import { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast"; 
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import examDeskImg from "@/assets/landing/exam_preparation_desk.png";

const grades = [1, 2, 3, 4, 5];

const LeadForm = memo(() => {
  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    grade: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.email || !formData.grade) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            student_name: formData.studentName,
            email: formData.email,
            grade: formData.grade,
          }
        ]);

      if (error) throw error;

      toast({ title: "Success", description: "Request received!" });
      setFormData({ studentName: "", email: "", grade: "" });
      
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Side image — hidden on mobile */}
          <div className="hidden md:block rounded-3xl overflow-hidden shadow-xl border border-border">
            <img
              src={examDeskImg}
              alt="Exam preparation desk with books and clock"
              className="w-full h-auto object-cover aspect-[4/3]"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Form */}
          <div className="bg-card p-8 rounded-3xl shadow-lg border border-border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Book a Free Demo</h2>
              <p className="text-muted-foreground mt-1">Start your journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Student's Name"
                value={formData.studentName}
                onChange={(e) => handleInputChange("studentName", e.target.value)}
                className="h-12"
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12"
              />
              <Select
                value={formData.grade}
                onValueChange={(val) => handleInputChange("grade", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Request Demo"} 
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
});

LeadForm.displayName = "LeadForm";

export default LeadForm;
