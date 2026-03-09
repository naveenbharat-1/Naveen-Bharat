/**
 * Supabase Library - Central Export
 * ===================================
 */

// Client
export { supabase } from '@/integrations/supabase/client';

// Admin utilities (selective export to avoid conflicts)
export { 
  checkUserRole,
  getUserRole,
  requireAdmin,
  requireAdminOrTeacher,
  getCurrentUserWithRole,
} from './admin';

// Types (this includes AppRole)
export * from './types';

// Hooks
export * from './hooks';
