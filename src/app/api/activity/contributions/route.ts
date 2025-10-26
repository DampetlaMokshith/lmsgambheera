import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    let start_date = searchParams.get('start_date');
    let end_date = searchParams.get('end_date');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If no dates provided, use current year in IST
    if (!start_date || !end_date) {
      const istNow = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
      const currentYear = istNow.getFullYear();
      start_date = `${currentYear}-01-01`;
      end_date = `${currentYear}-12-31`;
    }

    // Try to use the SQL function first
    const { data: contributionData, error: contributionError } = await supabase
      .rpc('get_user_contribution_data', {
        target_user_id: user_id,
        start_date: start_date,
        end_date: end_date,
      });

    const { data: statsData, error: statsError } = await supabase
      .rpc('get_user_contribution_stats', {
        target_user_id: user_id,
        start_date: start_date,
        end_date: end_date,
      });

    // If functions don't exist yet, return sample data
    if (contributionError && contributionError.code === '42883') {
      console.log('Database functions not ready yet. Returning sample data.');
      
      // Generate sample data for current year
      const istNow = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
      const currentYear = istNow.getFullYear();
      const sampleData = [];
      
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentYear, month, day);
          const count = Math.floor(Math.random() * 10);
          const level = count === 0 ? 0 : Math.ceil(count / 2.5);
          
          sampleData.push({
            date: date.toISOString().split('T')[0],
            count: count,
            level: Math.min(level, 4),
            hours: count * 0.25
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: sampleData,
        totalDays: 50,
        totalHours: 25.5,
        avgHours: 0.51,
        message: 'Using sample data - database setup pending'
      });
    }

    if (contributionError || statsError) {
      console.error('Database error:', contributionError || statsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contribution data' },
        { status: 500 }
      );
    }

    const stats = statsData?.[0] || { total_days: 0, total_hours: 0, avg_hours: 0 };

    return NextResponse.json({
      success: true,
      data: contributionData || [],
      totalDays: stats.total_days,
      totalHours: stats.total_hours,
      avgHours: stats.avg_hours,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}