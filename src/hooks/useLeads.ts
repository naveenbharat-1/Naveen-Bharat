import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: number;
  parentName: string;
  email: string;
  grade: string;
  createdAt: string | null;
}

export interface LeadInput {
  parentName: string;
  email: string;
  grade: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;

      const formatted: Lead[] = (data || []).map((l: any) => ({
        id: l.id,
        parentName: l.student_name,
        email: l.email,
        grade: l.grade,
        createdAt: l.created_at,
      }));

      setLeads(formatted);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitLead = useCallback(async (input: LeadInput): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase.from("leads").insert({
        student_name: input.parentName,
        email: input.email,
        grade: input.grade,
      });

      if (dbError) throw dbError;

      toast.success("Thank you! We'll contact you soon.");
      return true;
    } catch (err: any) {
      console.error("Error submitting lead:", err);
      toast.error(err.message || "Failed to submit");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    submitLead,
  };
};
