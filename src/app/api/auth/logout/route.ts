import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase Auth:', e);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete('inc_session');
  return NextResponse.json({ success: true });
}
