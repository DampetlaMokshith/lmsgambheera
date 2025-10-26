"use client";

import React from "react";
import { format, startOfWeek, addWeeks, startOfYear, endOfYear } from "date-fns";

export interface ContributionActivity {
  date: string;
  count: number;
  level: number;
}

export interface ContributionGraphProps {
  data: ContributionActivity[];
  children: React.ReactNode;
  blockSize?: number;
  blockMargin?: number;
  blockRadius?: number;
  colorScheme?: "github" | "default";
  className?: string;
}

export interface ContributionGraphCalendarProps {
  children: (props: {
    activity: ContributionActivity;
    dayIndex: number;
    weekIndex: number;
  }) => React.ReactNode;
}

export interface ContributionGraphBlockProps {
  activity: ContributionActivity;
  dayIndex: number;
  weekIndex: number;
  className?: string;
  style?: React.CSSProperties;
}

const ContributionGraphContext = React.createContext<{
  data: ContributionActivity[];
  blockSize: number;
  blockMargin: number;
  blockRadius: number;
  colorScheme: "github" | "default";
  weeks: ContributionActivity[][];
} | null>(null);

export function ContributionGraph({
  data,
  children,
  blockSize = 12,
  blockMargin = 2,
  blockRadius = 2,
  colorScheme = "default",
  className = "",
}: ContributionGraphProps) {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  // Create data map for quick lookups
  const dataMap = new Map<string, ContributionActivity>();
  data.forEach((item) => {
    dataMap.set(item.date, item);
  });

  // Generate weeks for the year - only include current year days, start from Wednesday
  const weeks: ContributionActivity[][] = [];
  
  // Start from the first day of the year
  let currentDate = new Date(yearStart);
  
  // Find what day of week January 1st falls on (0=Sunday, 1=Monday, etc.)
  const firstDayOfWeek = yearStart.getDay();
  
  // For the first week, we need to determine how many empty slots to add
  // If Jan 1st is Wednesday (3), we want it to appear in position 3 of the first column
  
  while (currentDate <= yearEnd) {
    const week: ContributionActivity[] = [];
    const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    
    // For the very first week of the year, handle the offset
    if (weeks.length === 0) {
      // Add empty slots for days before January 1st in the first week
      for (let i = 0; i < firstDayOfWeek; i++) {
        // Don't add anything - this creates the gap at the top
      }
    }
    
    // Generate 7 days for this week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + i);
      
      // Only include days that are within the current year
      if (dayDate >= yearStart && dayDate <= yearEnd) {
        const dateStr = format(dayDate, "yyyy-MM-dd");
        week.push(
          dataMap.get(dateStr) || {
            date: dateStr,
            count: 0,
            level: 0,
          }
        );
      }
    }
    
    // Only add weeks that have current year days
    if (week.length > 0) {
      weeks.push(week);
    }
    
    // Move to next week
    currentDate = addWeeks(currentDate, 1);
    
    // Break if we've gone past the year
    if (currentDate > yearEnd) {
      break;
    }
  }

  return (
    <ContributionGraphContext.Provider
      value={{
        data,
        blockSize,
        blockMargin,
        blockRadius,
        colorScheme,
        weeks,
      }}
    >
      <div className={`contribution-graph ${className}`} data-color-scheme={colorScheme}>
        {children}
      </div>
    </ContributionGraphContext.Provider>
  );
}

export function ContributionGraphCalendar({ children }: ContributionGraphCalendarProps) {
  const context = React.useContext(ContributionGraphContext);
  if (!context) {
    throw new Error("ContributionGraphCalendar must be used within ContributionGraph");
  }

  const { weeks, blockSize, blockMargin } = context;
  const svgWidth = weeks.length * (blockSize + blockMargin) - blockMargin;
  const svgHeight = 7 * (blockSize + blockMargin) - blockMargin;

  // Month labels
  const monthLabels: React.ReactElement[] = [];
  const monthPositions = new Map<string, number>();
  weeks.forEach((week, weekIndex) => {
    const firstDay = new Date(week[0].date);
    const monthKey = format(firstDay, "MMM");
    if (!monthPositions.has(monthKey)) {
      monthPositions.set(monthKey, weekIndex * (blockSize + blockMargin));
    }
  });

  monthPositions.forEach((position, month) => {
    monthLabels.push(
      <text
        key={month}
        x={position}
        y={-12}
        fontSize="14"
        fill="currentColor"
        className="text-sm font-medium text-gray-600 dark:text-gray-400"
      >
        {month}
      </text>
    );
  });

  // Day labels
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabelElements = dayLabels.map((day, index) => {
    if (index % 2 === 1) return null; // Only show alternate labels
    return (
      <text
        key={day}
        x={-12}
        y={index * (blockSize + blockMargin) + blockSize / 2}
        fontSize="12"
        fill="currentColor"
        textAnchor="end"
        dominantBaseline="central"
        className="text-xs font-medium text-gray-600 dark:text-gray-400"
      >
        {day}
      </text>
    );
  });

  return (
    <div className="w-full">
      <div className="w-full">
        <svg
          width={Math.max(svgWidth + 80, 800)}
          height={svgHeight + 80}
          className="w-full lg:w-auto lg:max-w-full"
          viewBox={`0 0 ${Math.max(svgWidth + 80, 800)} ${svgHeight + 80}`}
          style={{ 
            minWidth: '800px',
            height: 'auto',
            display: 'block'
          }}
        >
          <g transform="translate(40, 40)">
            {monthLabels}
            {dayLabelElements}
            <g transform="translate(0, 0)">
              {weeks.map((week, weekIndex) =>
                week.map((activity, dayIndex) =>
                  children({ activity, dayIndex, weekIndex })
                )
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

export function ContributionGraphBlock({
  activity,
  dayIndex,
  weekIndex,
  className = "",
  style = {},
}: ContributionGraphBlockProps) {
  const context = React.useContext(ContributionGraphContext);
  if (!context) {
    throw new Error("ContributionGraphBlock must be used within ContributionGraph");
  }

  const { blockSize, blockMargin, blockRadius, colorScheme } = context;
  const x = weekIndex * (blockSize + blockMargin);
  
  // Calculate the Y position with offset for the first week
  // If January 1st is Wednesday (dayIndex 3), we want it to start from position 3
  let adjustedDayIndex = dayIndex;
  
  // For the first week (weekIndex 0), add offset based on what day Jan 1st falls on
  if (weekIndex === 0) {
    const yearStart = startOfYear(new Date());
    const firstDayOfWeek = yearStart.getDay(); // 0=Sunday, 1=Monday, etc.
    adjustedDayIndex = dayIndex + firstDayOfWeek;
  }
  
  const y = adjustedDayIndex * (blockSize + blockMargin);

  // GitHub color scheme
  const githubColors = {
    0: "#ebedf0",
    1: "#9be9a8",
    2: "#40c463",
    3: "#30a14e",
    4: "#216e39",
  };

  // Default color scheme
  const defaultColors = {
    0: "#f3f4f6",
    1: "#dcfce7",
    2: "#bbf7d0",
    3: "#86efac",
    4: "#4ade80",
  };

  const colors = colorScheme === "github" ? githubColors : defaultColors;
  const fillColor = colors[Math.min(activity.level, 4) as keyof typeof colors];

  return (
    <rect
      x={x}
      y={y}
      width={blockSize}
      height={blockSize}
      rx={blockRadius}
      fill={fillColor}
      className={className}
      style={style}
    />
  );
}

export function ContributionGraphFooter() {
  const context = React.useContext(ContributionGraphContext);
  if (!context) {
    throw new Error("ContributionGraphFooter must be used within ContributionGraph");
  }

  const { blockSize, blockRadius, colorScheme } = context;

  // GitHub color scheme
  const githubColors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
  // Default color scheme  
  const defaultColors = ["#f3f4f6", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80"];
  const colors = colorScheme === "github" ? githubColors : defaultColors;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-4 text-gray-600 dark:text-gray-400">
      
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Less</span>
        <div className="flex gap-0.5">
          {colors.map((color, index) => (
            <div
              key={index}
              className="rounded-sm border border-gray-200 dark:border-gray-700"
              style={{
                width: blockSize + 2,
                height: blockSize + 2,
                backgroundColor: color,
                borderRadius: blockRadius,
              }}
            />
          ))}
        </div>
        <span className="text-sm font-medium">More</span>
      </div>
    </div>
  );
}