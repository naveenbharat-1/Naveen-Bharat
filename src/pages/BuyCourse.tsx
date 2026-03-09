import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, Shield, Copy, Upload, Loader2, 
  Camera, X, User, CreditCard, Smartphone, Zap
} from "lucide-react";
import { useAdminEnrollment } from "@/hooks/useAdminEnrollment";
import { openRazorpayCheckout, type RazorpaySuccessResponse } from "@/utils/razorpay";

const MERCHANT_UPI = "mandharilalyadav101174-2@okaxis"; 
const MERCHANT_NAME = "Sadguru Coaching Classes"; 
const SUCCESS_SOUND_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_aad70ee296.mp3";

type PaymentMethod = "razorpay" | "manual" | null;

const BuyCourse = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { adminEnroll, isAdmin, isEnrolling } = useAdminEnrollment();
  
  const [step, setStep] = useState<"details" | "payment" | "verify" | "razorpay-success">("details");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderName, setSenderName] = useState(""); 
  const [isDeclared, setIsDeclared] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [adminAutoEnrolled, setAdminAutoEnrolled] = useState(false);

  const [countdown, setCountdown] = useState(5);

  // Define free enrollment handler early so useEffect can reference it
  const handleFreeEnrollmentEarly = async (courseIdNum: number) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseIdNum)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        toast.info("You're already enrolled in this course!");
        navigate(`/my-courses`);
        return;
      }

      const { error } = await supabase
        .from("enrollments")
        .upsert(
          { user_id: user.id, course_id: courseIdNum, status: "active" },
          { onConflict: "user_id,course_id", ignoreDuplicates: true }
        );

      if (error) throw error;

      playSuccessSound();
      toast.success("Free enrollment successful! Starting your course...");
      navigate(`/my-courses`);
    } catch (error: any) {
      console.error("Free enrollment error:", error);
      toast.error("Failed to enroll. Please try again.");
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      if (courseId) {
        try {
          const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("id", Number(courseId))
            .single();

          if (!error && data) {
            const isFree = !data.price || data.price === 0;
            const mapped = {
              id: data.id,
              title: data.title,
              description: data.description,
              grade: data.grade,
              price: data.price ?? 0,
              imageUrl: data.image_url,
              thumbnailUrl: data.thumbnail_url,
            };
            setCourse(mapped);
            
            if (isFree && user) {
              await handleFreeEnrollmentEarly(Number(courseId));
            }
          }
        } catch (err) {
          console.error("Error fetching course:", err);
        }
      }
      setLoading(false);
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.id]);

  useEffect(() => {
    const handleAdminAutoEnroll = async () => {
      if (isAdmin && course && course.price > 0 && courseId && !adminAutoEnrolled) {
        setAdminAutoEnrolled(true);
        await adminEnroll(Number(courseId));
      }
    };
    
    if (!loading && course) {
      handleAdminAutoEnroll();
    }
  }, [isAdmin, course, courseId, loading, adminAutoEnrolled, adminEnroll]);

  // handleFreeEnrollment is defined above as handleFreeEnrollmentEarly (hoisting fix)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === "verify") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/classes/${courseId}/lessons`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, navigate, courseId]);

  const playSuccessSound = () => {
    try {
      const audio = new Audio(SUCCESS_SOUND_URL);
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio autoplay blocked:", err));
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const getUPILink = (appMode?: string) => {
    const price = course?.price || '0';
    const base = `pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&tn=Course-${courseId}&cu=INR`;
    if (appMode === 'gpay') return `tez://upi/pay?${base}`;
    if (appMode === 'phonepe') return `phonepe://upi/pay?${base}`;
    if (appMode === 'paytm') return `paytmmp://upi/pay?${base}`;
    return `upi://pay?${base}`;
  };
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUPILink())}`;

  const handleProceedManual = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setPaymentMethod("manual");
    setStep("payment");
  };

  const handleRazorpayPayment = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    setIsRazorpayLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Please login first");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wegamscqtvqhxowlskfm.supabase.co";
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: Number(courseId) }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      setIsRazorpayLoading(false);

      await openRazorpayCheckout({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: MERCHANT_NAME,
        description: orderData.course_title,
        order_id: orderData.order_id,
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
        },
        theme: { color: '#F97316' },
        handler: async (response: RazorpaySuccessResponse) => {
          await verifyRazorpayPayment(response);
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
          }
        }
      });

    } catch (error: any) {
      console.error("Razorpay error:", error);
      toast.error(error.message || "Failed to initiate payment. Please try again.");
      setIsRazorpayLoading(false);
    }
  };

  const verifyRazorpayPayment = async (response: RazorpaySuccessResponse) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wegamscqtvqhxowlskfm.supabase.co";

      const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          course_id: Number(courseId),
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      playSuccessSound();
      toast.success("🎉 Payment successful! You are now enrolled!");
      setStep("razorpay-success");
      setTimeout(() => navigate(`/classes/${courseId}/lessons`), 3000);

    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Payment verification failed. Please contact support.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return toast.error("Max size 5MB");
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(MERCHANT_UPI);
    toast.success("UPI ID Copied!");
  };

  const handlePaymentSubmit = async () => {
    if (!/^\d{12}$/.test(transactionId.trim())) return toast.error("Enter valid 12-digit numeric UTR.");
    if (!screenshot) return toast.error("Screenshot proof is mandatory.");
    if (!senderName.trim() || senderName.length < 3) return toast.error("Enter Sender Name.");
    if (!isDeclared) return toast.error("Please agree to the declaration.");
    if (!user) return toast.error("Please login first.");

    setIsSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const fileName = `${user.id}/${Date.now()}_${screenshot.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, screenshot, { contentType: screenshot.type });
        
        if (uploadError) {
          toast.error('Failed to upload screenshot. Please try again.');
          throw uploadError;
        }
        screenshotUrl = fileName;
      }

      const { error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          course_id: Number(courseId),
          transaction_id: transactionId,
          amount: course.price,
          status: "pending",
          sender_name: senderName,
          user_name: user.fullName || user.email,
          screenshot_url: screenshotUrl,
        });

      if (error) throw error;

      playSuccessSound();
      setStep("verify");
      toast.success("Payment Received Successfully!");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div className="p-10 text-center">Course not found <Button onClick={() => navigate(-1)}>Back</Button></div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <header className="sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        {step !== 'verify' && step !== 'razorpay-success' && (
           <Button variant="ghost" size="icon" onClick={() => {
             if (step === 'payment') { setStep('details'); setPaymentMethod(null); }
             else navigate(-1);
           }}><ArrowLeft className="h-5 w-5" /></Button>
        )}
        <h1 className="font-semibold text-lg">Secure Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4">
        
        {/* ── STEP: Details ── */}
        {step === "details" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{course.price === 0 ? "Free Enrollment" : "Payment Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-center bg-muted/50 p-3 rounded-lg border">
                  {course.imageUrl && <img src={course.imageUrl} alt="Course" className="w-16 h-16 rounded object-cover"/>}
                  <div>
                    <h2 className="font-bold text-sm">{course.title}</h2>
                    <p className="font-bold text-primary">
                      {course.price === 0 ? (
                        <span className="text-[hsl(142,72%,29%)] dark:text-[hsl(142,72%,55%)]">FREE</span>
                      ) : (
                        `₹${course.price}`
                      )}
                    </p>
                  </div>
                </div>

                {course.price === 0 ? (
                  <Button 
                    className="w-full h-12 text-lg mt-4 bg-green-600 hover:bg-green-700" 
                    onClick={async () => {
                      if (!user) {
                        toast.error("Please login first");
                        navigate("/login", { state: { from: location.pathname + location.search } });
                        return;
                      }
                      await handleFreeEnrollmentEarly(Number(courseId));
                    }}
                    disabled={loading}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Enroll for Free
                  </Button>
                ) : (
                  /* ── Payment Method Selection ── */
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-medium text-muted-foreground text-center">Choose Payment Method</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Razorpay Option */}
                      <button
                        onClick={handleRazorpayPayment}
                        disabled={isRazorpayLoading}
                        className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all group disabled:opacity-60"
                      >
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5" /> INSTANT
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {isRazorpayLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">Pay with Razorpay</p>
                          <p className="text-xs text-muted-foreground">Cards · UPI · Netbanking · Wallet</p>
                        </div>
                        <div className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold text-center group-hover:bg-primary/90">
                          {isRazorpayLoading ? "Loading..." : `Pay ₹${course.price}`}
                        </div>
                        <p className="text-[10px] text-green-600 font-medium">✓ Instant enrollment after payment</p>
                      </button>

                      {/* Manual UPI Option */}
                      <button
                        onClick={handleProceedManual}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-muted-foreground/40 hover:bg-muted/30 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">Pay via UPI</p>
                          <p className="text-xs text-muted-foreground">GPay · PhonePe · Paytm · Any UPI</p>
                        </div>
                        <div className="w-full border border-border rounded-lg py-2 text-sm font-semibold text-center group-hover:bg-muted/50">
                          Scan QR to Pay
                        </div>
                        <p className="text-[10px] text-amber-600 font-medium">⏱ Requires admin approval (few hours)</p>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure &amp; encrypted payment</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP: Manual UPI Payment ── */}
        {step === "payment" && paymentMethod === "manual" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Scan &amp; Verify</CardTitle>
              <p className="text-xs text-muted-foreground">Pay ₹{course.price} via UPI then submit proof</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-4 bg-card border rounded-xl shadow-sm w-fit mx-auto">
                <img src={qrCodeUrl} alt="UPI QR" className="w-40 h-40 mix-blend-multiply" />
                <div className="flex items-center gap-2 mt-2 bg-muted px-3 py-1 rounded text-xs">
                  <span className="font-mono">{MERCHANT_UPI}</span>
                  <Copy className="h-3 w-3 cursor-pointer" onClick={handleCopyUPI}/>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:hidden">
                <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('gpay')}>GPay</Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('phonepe')}>PhonePe</Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = getUPILink('paytm')}>Paytm</Button>
              </div>

              <div className="border-t border-dashed"></div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Sender Name (As per Bank) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. Rahul Kumar" className="pl-9" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>12-Digit UTR Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="3214xxxx5678" value={transactionId} maxLength={12} className="font-mono tracking-widest"
                    onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))} />
                </div>

                <div className="space-y-1">
                  <Label>Payment Screenshot <span className="text-destructive">*</span></Label>
                  {!previewUrl ? (
                    <div className="border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50"
                      onClick={() => document.getElementById('file-upload')?.click()}>
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tap to upload</span>
                      <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  ) : (
                    <div className="relative h-32 bg-muted/20 rounded-lg border overflow-hidden">
                      <img src={previewUrl} className="w-full h-full object-contain" />
                      <X className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 h-5 w-5 cursor-pointer" onClick={() => {setPreviewUrl(null); setScreenshot(null)}}/>
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-2 bg-accent/30 p-3 rounded border border-accent">
                  <input type="checkbox" id="terms" className="mt-1 h-4 w-4" checked={isDeclared} onChange={(e) => setIsDeclared(e.target.checked)}/>
                  <label htmlFor="terms" className="text-xs text-foreground cursor-pointer select-none">
                    I verify that UTR and Screenshot are authentic. Fake details will ban my account.
                  </label>
                </div>

                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold shadow-md" 
                  onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <><Shield className="mr-2 h-4 w-4"/> Secure Submit</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP: Manual Payment Submitted ── */}
        {step === "verify" && (
          <Card className="text-center py-16 animate-in fade-in duration-500">
            <CardContent>
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out_1]">
                <CheckCircle className="w-16 h-16" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-green-700">Request Received!</h2>
              
              <div className="bg-muted/50 p-4 rounded-lg border max-w-xs mx-auto my-6">
                <p className="text-muted-foreground text-sm">Amount</p>
                <p className="text-2xl font-bold">₹{course.price}</p>
                <p className="text-xs text-muted-foreground mt-1">Transaction ID: {transactionId}</p>
              </div>

              <p className="text-muted-foreground mb-8">
                Redirecting you to dashboard in <span className="font-bold text-primary text-xl">{countdown}</span> seconds...
              </p>
              
              <Button onClick={() => navigate(`/classes/${courseId}/lessons`)} className="w-full max-w-xs">
                Start Learning Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── STEP: Razorpay Success ── */}
        {step === "razorpay-success" && (
          <Card className="text-center py-16 animate-in fade-in duration-500">
            <CardContent>
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-16 h-16" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-green-700">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">You are now enrolled in <strong>{course.title}</strong></p>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 max-w-xs mx-auto my-6">
                <p className="text-sm text-green-700 dark:text-green-400">Amount Paid</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">₹{course.price}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1 flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3" /> Instant enrollment activated
                </p>
              </div>

              <p className="text-muted-foreground text-sm mb-6">Redirecting you to your course...</p>
              
              <Button onClick={() => navigate(`/classes/${courseId}/lessons`)} className="w-full max-w-xs bg-green-600 hover:bg-green-700">
                Start Learning Now 🎉
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BuyCourse;
