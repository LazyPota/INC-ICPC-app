import { NextResponse } from 'next/server';
import { LoginCandidateSchema } from '@/lib/validations/auth';
import { dataStore, assertPersistenceConfigured } from '@/lib/data/store';
import { isAdminEmail } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = LoginCandidateSchema.parse(body);

    const email = validated.studentEmail.toLowerCase();
    const isAdmin = isAdminEmail(email);

    // Enforce production persistence requirement
    assertPersistenceConfigured();

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: validated.password,
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Invalid credentials. Please verify your email and password.' },
          { status: 401 }
        );
      }

      let profile = await dataStore.getProfile(authData.user.id);
      if (!profile && isAdmin) {
        profile = await dataStore.createProfile({
          id: authData.user.id,
          full_name: 'Administrator',
          student_email: email,
          intended_division: 'problem_analysis',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        isAdmin,
        profile,
      });
    }

    // Local development/testing fallback ONLY
    let profile = await dataStore.getProfileByEmail(email);

    if (!profile) {
      if (isAdmin) {
        // Auto-provision admin profile in local development ONLY
        profile = {
          id: crypto.randomUUID(),
          full_name: 'Administrator',
          student_email: email,
          intended_division: 'problem_analysis',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await dataStore.createProfile(profile);
      } else {
        return NextResponse.json(
          { error: 'No account found with this student email. Please register first.' },
          { status: 404 }
        );
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(
      'inc_session',
      encodeURIComponent(
        JSON.stringify({
          userId: profile.id,
          email: profile.student_email,
          profile,
        })
      ),
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return NextResponse.json({
      success: true,
      isAdmin,
      profile,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: (error as { issues: Array<{ message: string }> }).issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Login failed';
    const status = message.includes('PERSISTENCE_ERROR') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
