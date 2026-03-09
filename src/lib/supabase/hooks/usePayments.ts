/**
 * usePayments Hook
 * =================
 * Type-safe React Query hook for payment requests
 * Admin: full access | Users: own payments only
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentRequest, PaymentRequestInsert, PaymentWithDetails } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = ['payments'];

type PaymentStatus = 'pending' | 'approved' | 'rejected';

/**
 * Fetch payments with filtering (Admin view)
 */
export function usePayments(status?: PaymentStatus) {
  return useQuery({
    queryKey: [...QUERY_KEY, status],
    queryFn: async (): Promise<PaymentWithDetails[]> => {
      let query = supabase
        .from('payment_requests')
        .select(`
          *,
          courses (title),
          profiles!payment_requests_user_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PaymentWithDetails[];
    },
  });
}

/**
 * Fetch user's own payments
 */
export function useUserPayments(userId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'user', userId],
    queryFn: async (): Promise<PaymentWithDetails[]> => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          courses (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PaymentWithDetails[];
    },
    enabled: !!userId,
  });
}

/**
 * Submit payment request
 */
export function useSubmitPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PaymentRequestInsert): Promise<PaymentRequest> => {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Payment submitted for review!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to submit payment: ' + (err as Error).message);
    },
  });
}

/**
 * Approve payment and enroll user (Admin only)
 */
export function useApprovePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentRequest): Promise<void> => {
      // 1. Update payment status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      // 2. Check if already enrolled
      if (payment.user_id && payment.course_id) {
        const { data: existing } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', payment.user_id)
          .eq('course_id', payment.course_id)
          .maybeSingle();

        // 3. Create enrollment if not exists
        if (!existing) {
          const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
              user_id: payment.user_id,
              course_id: payment.course_id,
              status: 'active',
            });

          if (enrollError) throw enrollError;
        }
      }
    },
    onSuccess: () => {
      toast.success('Payment approved & course unlocked!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (err) => {
      toast.error('Failed to approve payment: ' + (err as Error).message);
    },
  });
}

/**
 * Reject payment (Admin only)
 */
export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: number): Promise<void> => {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.error('Payment rejected');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to reject payment: ' + (err as Error).message);
    },
  });
}

/**
 * Get payment stats for dashboard
 */
export function usePaymentStats() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: async () => {
      // Pending count
      const { count: pendingCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Total revenue from approved
      const { data: approved } = await supabase
        .from('payment_requests')
        .select('amount')
        .eq('status', 'approved');

      const totalRevenue = approved?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        pendingCount: pendingCount || 0,
        totalRevenue,
      };
    },
  });
}
