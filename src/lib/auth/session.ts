import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { isProductionEnvironment } from '@/lib/data/store';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/database';

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || '';
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
}

export interface UserSession {
  userId: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  profile: Profile | null;
}

export async function getCurrentSession(): Promise<UserSession | null> {
  // If Supabase is configured, validate session via cryptographic JWT validation on the server
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user || !user.email) {
        return null;
      }

      const admin = isAdminEmail(user.email);
      const isVerified = Boolean(user.email_confirmed_at);

      // Fetch profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        userId: user.id,
        email: user.email,
        isAdmin: admin,
        emailVerified: isVerified,
        profile: profile || null,
      };
    } catch (err) {
      console.error('Error fetching Supabase session:', err);
      return null;
    }
  }

  // In production or Netlify staging, unsigned local session cookies are STRICTLY FORBIDDEN
  if (isProductionEnvironment()) {
    return null;
  }

  // Fallback dev/testing session cookie for isolated local unit tests / mock environment ONLY
  const cookieStore = await cookies();
  const devSessionCookie = cookieStore.get('inc_session');
  if (devSessionCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(devSessionCookie.value));
      return {
        userId: parsed.userId,
        email: parsed.email,
        isAdmin: isAdminEmail(parsed.email),
        emailVerified: true,
        profile: parsed.profile || null,
      };
    } catch {
      return null;
    }
  }

  return null;
}
