import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentRequest {
  id: number;
  userId: string | null;
  userName: string | null;
  courseId: number | null;
  amount: number | null;
  transactionId: string | null;
  senderName: string | null;
  screenshotUrl: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface PaymentRequestInput {
  courseId: number;
  amount: number;
  transactionId: string;
  senderName: string;
  screenshotUrl?: string;
  userName?: string;
}

export const usePayments = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) { setPayments([]); setLoading(false); return; }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("payment_requests").select("*").order("created_at", { ascending: false });

      // Non-admins only see their own payments
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      const formatted: PaymentRequest[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        userName: p.user_name,
        courseId: p.course_id,
        amount: p.amount,
        transactionId: p.transaction_id,
        senderName: p.sender_name,
        screenshotUrl: p.screenshot_url,
        status: p.status,
        createdAt: p.created_at,
      }));

      setPayments(formatted);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const createPaymentRequest = useCallback(async (input: PaymentRequestInput): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to submit payment");
      return false;
    }

    try {
      const { error: dbError } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        user_name: input.userName || null,
        course_id: input.courseId,
        amount: input.amount,
        transaction_id: input.transactionId,
        sender_name: input.senderName,
        screenshot_url: input.screenshotUrl || null,
        status: 'pending',
      });

      if (dbError) throw dbError;

      toast.success("Payment request submitted!");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error creating payment request:", err);
      toast.error(err.message || "Failed to submit payment");
      return false;
    }
  }, [user, fetchPayments]);

  const approvePayment = useCallback(async (id: number): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return false;
    }

    try {
      const { error: dbError } = await supabase
        .from("payment_requests")
        .update({ status: 'approved' })
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Payment approved & user enrolled!");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error approving payment:", err);
      toast.error(err.message || "Failed to approve");
      return false;
    }
  }, [isAdmin, fetchPayments]);

  const rejectPayment = useCallback(async (id: number): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return false;
    }

    try {
      const { error: dbError } = await supabase
        .from("payment_requests")
        .update({ status: 'rejected' })
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Payment rejected");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error rejecting payment:", err);
      toast.error(err.message || "Failed to reject");
      return false;
    }
  }, [isAdmin, fetchPayments]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPaymentRequest,
    approvePayment,
    rejectPayment,
  };
};
