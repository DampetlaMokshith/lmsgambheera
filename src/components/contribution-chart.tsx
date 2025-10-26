"use client";

import { useState, useEffect } from "react";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
} from "@/components/kibo-ui/contribution-graph";
import { eachDayOfInterval, formatISO } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabase';

interface ActivityData {
  date: string;
  count: number;
  level: number;
}

interface ApiActivityData {
  date: string;
  count: number;
  level: number;
  hours?: number;
}

interface ContributionStats {
  totalDays: number;
  totalHours: number;
  avgHours: number;
}

interface ContributionChartProps {
  userId?: string;
}

const ContributionChart: React.FC<ContributionChartProps> = ({ userId }) => {
  const [contributionData, setContributionData] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState<ContributionStats>({ totalDays: 0, totalHours: 0, avgHours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        // Get current user ID if not provided
        const currentUserId = userId || await getCurrentUserId();
        if (!currentUserId) {
          throw new Error('No user ID available');
        }

        const response = await fetch(`/api/activity/contributions?user_id=${currentUserId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform the API data to match Kibo UI format
          const transformedData: ActivityData[] = data.data.map((item: ApiActivityData) => ({
            date: item.date,
            count: item.count,
            level: item.level
          }));
          
          setContributionData(transformedData);
          
          // Calculate stats from real data
          const totalDays = data.totalDays || 0;
          const totalHours = data.totalHours || 0;
          const avgHours = data.avgHours || 0;
          
          setStats({ totalDays, totalHours, avgHours });
        } else {
          // Fallback to sample data if API fails
          const sampleData = generateSampleData();
          setContributionData(sampleData);
          // Set default stats for fallback
          setStats({ totalDays: 0, totalHours: 0, avgHours: 0 });
        }
      } catch (error) {
        console.error('Error fetching contribution data:', error);
        // Fallback to sample data
        const sampleData = generateSampleData();
        setContributionData(sampleData);
        // Set default stats for fallback
        setStats({ totalDays: 0, totalHours: 0, avgHours: 0 });
      } finally {
        setLoading(false);
      }
    };

    const getCurrentUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
      } catch (error) {
        console.error('Error getting user session:', error);
        return null;
      }
    };

    fetchContributions();
  }, [userId]);

  // Generate sample data for fallback using IST timezone and current year
  const generateSampleData = (): ActivityData[] => {
    const maxCount = 20;
    const maxLevel = 4;
    
    // Use IST timezone for current date
    const istNow = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const currentYear = istNow.getFullYear();
    
    // Generate data for current year only
    const days = eachDayOfInterval({
      start: new Date(currentYear, 0, 1), // January 1st of current year
      end: new Date(currentYear, 11, 31), // December 31st of current year
    });

    return days.map((date) => {
      const c = Math.round(
        Math.random() * maxCount - Math.random() * (0.8 * maxCount)
      );
      const count = Math.max(0, c);
      const level = Math.ceil((count / maxCount) * maxLevel);

      return {
        date: formatISO(date, { representation: "date" }),
        count,
        level,
      };
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-black border rounded-xl">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black border  rounded-xl">
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto">
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {stats.totalDays ? `${stats.totalDays} days` : '--'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">Total Contribution</p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {stats.totalHours ? `${stats.totalHours.toFixed(2)} Hours` : '--'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">Total Hours Spent</p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {stats.avgHours ? `${stats.avgHours.toFixed(2)} Hours per day` : '--'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">Average Time</p>
            </div>
          </div>
        </div>
        
        {/* Contribution Graph Container with responsive scroll */}
        <div className="w-full">
          {/* Mobile: horizontal scroll with visible scrollbar | Desktop: full width, no scroll */}
          <div 
            className="overflow-x-auto lg:overflow-x-hidden pb-2 lg:pb-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#6b7280 #374151',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="inline-block min-w-full lg:w-full">
              <TooltipProvider>
                <ContributionGraph 
                  data={contributionData} 
                  colorScheme="github"
                  blockSize={20}
                  blockMargin={4}
                  blockRadius={4}
                  className="w-full min-w-[1000px] lg:min-w-full lg:max-w-none"
                >
                  <ContributionGraphCalendar>
                    {({ activity, dayIndex, weekIndex }) => (
                      <Tooltip key={`${dayIndex}-${weekIndex}`}>
                        <TooltipTrigger asChild>
                          <g>
                            <ContributionGraphBlock
                              activity={activity}
                              className="cursor-pointer hover:stroke-gray-400 hover:stroke-2 transition-all"
                              dayIndex={dayIndex}
                              weekIndex={weekIndex}
                            />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{activity.date}</p>
                          
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </ContributionGraphCalendar>
                  <ContributionGraphFooter />
                </ContributionGraph>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ContributionChart;