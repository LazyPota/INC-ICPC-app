import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DivisionSchema } from '@/lib/validations/auth';
import { dataStore, isProductionEnvironment } from '@/lib/data/store';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if an attempt has already started
    const assessment = await dataStore.getAssessmentByDivision(session.profile.intended_division);
    if (assessment) {
      const attempt = await dataStore.getAttemptByCandidateAndAssessment(session.userId, assessment.id);
      if (attempt) {
        return NextResponse.json(
          { error: 'Cannot change division once an assessment attempt has been started.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const newDivision = DivisionSchema.parse(body.division);

    const updatedProfile = {
      ...session.profile,
      intended_division: newDivision,
      updated_at: new Date().toISOString(),
    };

    await dataStore.createProfile(updatedProfile);

    // In local non-Supabase dev environment only, refresh cookie
    if (!isProductionEnvironment() && !isSupabaseConfigured()) {
      const cookieStore = await cookies();
      cookieStore.set(
        'inc_session',
        encodeURIComponent(
          JSON.stringify({
            userId: updatedProfile.id,
            email: updatedProfile.student_email,
            profile: updatedProfile,
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
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update division';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
