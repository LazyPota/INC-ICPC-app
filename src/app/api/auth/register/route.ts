import { NextResponse } from 'next/server';
import { RegisterCandidateSchema } from '@/lib/validations/auth';
import { dataStore, assertPersistenceConfigured } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = RegisterCandidateSchema.parse(body);
    const email = validated.studentEmail.toLowerCase();

    // In production, Supabase Auth is strictly required
    assertPersistenceConfigured();

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
            intended_division: validated.intendedDivision,
          },
        },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const userId = authData.user?.id;
      if (!userId) {
        return NextResponse.json({ error: 'Failed to create candidate identity.' }, { status: 500 });
      }

      const newProfile = {
        id: userId,
        full_name: validated.fullName,
        student_email: email,
        intended_division: validated.intendedDivision,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Ensure profile row exists in public.profiles table
      await dataStore.createProfile(newProfile);

      const isConfirmed = Boolean(authData.user?.email_confirmed_at);
      const hasActiveSession = Boolean(authData.session);

      return NextResponse.json({
        success: true,
        profile: newProfile,
        requiresEmailVerification: !isConfirmed && !hasActiveSession,
        message: !hasActiveSession
          ? 'Registration successful! Verification email sent to your institutional address. Please confirm your email before logging in.'
          : undefined,
      });
    }

    // Local dev/testing fallback store ONLY
    const existing = await dataStore.getProfileByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'A candidate with this student email is already registered.' },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const newProfile = {
      id: userId,
      full_name: validated.fullName,
      student_email: email,
      intended_division: validated.intendedDivision,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dataStore.createProfile(newProfile);

    const cookieStore = await cookies();
    cookieStore.set(
      'inc_session',
      encodeURIComponent(
        JSON.stringify({
          userId: newProfile.id,
          email: newProfile.student_email,
          profile: newProfile,
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
      profile: newProfile,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: (error as { issues: Array<{ message: string }> }).issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message.includes('PERSISTENCE_ERROR') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
