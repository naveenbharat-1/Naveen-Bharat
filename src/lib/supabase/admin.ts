/**
 * Supabase Admin Client Utilities
 * ================================
 * Secure wrapper for admin operations using the auto-generated client.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Re-export the standard client for most operations
export { supabase } from '@/integrations/supabase/client';

/**
 * Role types for authorization checks
 */
export type AppRole = 'admin' | 'teacher' | 'student';

/**
 * Check if user has a specific role using the has_role function
 */
export async function checkUserRole(
  client: SupabaseClient<Database>,
  userId: string,
  role: AppRole
): Promise<boolean> {
  const { data, error } = await client.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return !!data;
}

/**
 * Get user's current role
 */
export async function getUserRole(
  client: SupabaseClient<Database>,
  userId: string
): Promise<AppRole | null> {
  const { data, error } = await client.rpc('get_user_role', {
    _user_id: userId,
  });

  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }

  return data as AppRole | null;
}

/**
 * Validate that the current user is an admin
 * Throws error if not authorized
 */
export async function requireAdmin(
  client: SupabaseClient<Database>
): Promise<string> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const isAdmin = await checkUserRole(client, user.id, 'admin');
  
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user.id;
}

/**
 * Validate that current user is admin or teacher
 */
export async function requireAdminOrTeacher(
  client: SupabaseClient<Database>
): Promise<{ userId: string; role: AppRole }> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const isAdmin = await checkUserRole(client, user.id, 'admin');
  if (isAdmin) return { userId: user.id, role: 'admin' };

  const isTeacher = await checkUserRole(client, user.id, 'teacher');
  if (isTeacher) return { userId: user.id, role: 'teacher' };

  throw new Error('Forbidden: Admin or teacher access required');
}

/**
 * Get the current authenticated user with their role
 */
export async function getCurrentUserWithRole(
  client: SupabaseClient<Database>
): Promise<{ userId: string; role: AppRole | null } | null> {
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error || !user) return null;

  const role = await getUserRole(client, user.id);
  
  return { userId: user.id, role };
}
