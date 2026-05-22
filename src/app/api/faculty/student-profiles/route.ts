import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/faculty/student-profiles?userIds=uuid1,uuid2,uuid3
 * Fetch student profiles for given user IDs (bypasses RLS for faculty access)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdsParam = searchParams.get('userIds');

    if (!userIdsParam) {
      return NextResponse.json(
        { error: "Missing userIds query parameter" },
        { status: 400 }
      );
    }

    const userIds = userIdsParam.split(',').filter(id => id.trim());
    
    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "No valid user IDs provided" },
        { status: 400 }
      );
    }

    // Fetch all profiles for reference
    const { data: allProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name');

    // Fetch profiles from user_profiles table using service role (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, gender, guardian_email, date_of_birth, registration_number, college, batch, degree, department')
      .in('user_id', userIds);

    if (profilesError) {
      return NextResponse.json(
        { error: "Failed to fetch profiles", details: profilesError.message },
        { status: 500 }
      );
    }

    // Also fetch from users table for fallback data
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    // Create a map of user_id to profile data
    const profilesMap: Record<string, {
      fullName: string;
      gender: string;
      guardianEmail: string;
      dateOfBirth: string;
      registrationNumber: string;
      college: string;
      batch: string;
      degree: string;
      department: string;
    }> = {};

    // First, populate with user_profiles data
    if (profiles) {
      for (const profile of profiles) {
        profilesMap[profile.user_id] = {
          fullName: profile.full_name || 'N/A',
          gender: profile.gender || 'N/A',
          guardianEmail: profile.guardian_email || 'N/A',
          dateOfBirth: profile.date_of_birth 
            ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
            : 'N/A',
          registrationNumber: profile.registration_number || 'N/A',
          college: profile.college || 'N/A',
          batch: profile.batch || 'N/A',
          degree: profile.degree || 'N/A',
          department: profile.department || 'N/A',
        };
      }
    }

    // For any missing profiles, add placeholder with data from users table
    for (const userId of userIds) {
      if (!profilesMap[userId]) {
        const userData = usersData?.find(u => u.id === userId);
        profilesMap[userId] = {
          fullName: userData?.full_name || 'N/A',
          gender: 'N/A',
          guardianEmail: 'N/A',
          dateOfBirth: 'N/A',
          registrationNumber: 'N/A',
          college: 'N/A',
          batch: 'N/A',
          degree: 'N/A',
          department: 'N/A',
        };
      }
    }

    return NextResponse.json({
      success: true,
      profiles: profilesMap,
      debug: {
        requestedIds: userIds,
        foundInUserProfiles: profiles?.length || 0,
        foundInUsers: usersData?.length || 0,
        allExistingProfileUserIds: allProfiles?.map(p => ({ user_id: p.user_id, full_name: p.full_name })) || [],
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
