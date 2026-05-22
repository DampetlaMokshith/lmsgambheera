'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import LoadingPage from '@/components/loading-page';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp,
  Inbox,
  CircleDot,
  Star,
  Zap,
  FolderOpen,
  LayoutGrid,
  MoreHorizontal,
  Search,
  ChevronDown,
  ArrowRight,
  Settings
} from 'lucide-react';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Session management constants
const SESSION_KEY = 'lms_session_id';
const SESSION_SHOWN_LOADING = 'lms_shown_loading';
const LAST_ACTIVITY_KEY = 'lms_last_activity';

// Chart data - Student engagement over time
const chartData = [
  { date: "2024-04-01", students: 222, courses: 150 },
  { date: "2024-04-02", students: 97, courses: 180 },
  { date: "2024-04-03", students: 167, courses: 120 },
  { date: "2024-04-04", students: 242, courses: 260 },
  { date: "2024-04-05", students: 373, courses: 290 },
  { date: "2024-04-06", students: 301, courses: 340 },
  { date: "2024-04-07", students: 245, courses: 180 },
  { date: "2024-04-08", students: 409, courses: 320 },
  { date: "2024-04-09", students: 59, courses: 110 },
  { date: "2024-04-10", students: 261, courses: 190 },
  { date: "2024-04-11", students: 327, courses: 350 },
  { date: "2024-04-12", students: 292, courses: 210 },
  { date: "2024-04-13", students: 342, courses: 380 },
  { date: "2024-04-14", students: 137, courses: 220 },
  { date: "2024-04-15", students: 120, courses: 170 },
  { date: "2024-04-16", students: 138, courses: 190 },
  { date: "2024-04-17", students: 446, courses: 360 },
  { date: "2024-04-18", students: 364, courses: 410 },
  { date: "2024-04-19", students: 243, courses: 180 },
  { date: "2024-04-20", students: 89, courses: 150 },
  { date: "2024-04-21", students: 137, courses: 200 },
  { date: "2024-04-22", students: 224, courses: 170 },
  { date: "2024-04-23", students: 138, courses: 230 },
  { date: "2024-04-24", students: 387, courses: 290 },
  { date: "2024-04-25", students: 215, courses: 250 },
  { date: "2024-04-26", students: 75, courses: 130 },
  { date: "2024-04-27", students: 383, courses: 420 },
  { date: "2024-04-28", students: 122, courses: 180 },
  { date: "2024-04-29", students: 315, courses: 240 },
  { date: "2024-04-30", students: 454, courses: 380 },
  { date: "2024-05-01", students: 165, courses: 220 },
  { date: "2024-05-02", students: 293, courses: 310 },
  { date: "2024-05-03", students: 247, courses: 190 },
  { date: "2024-05-04", students: 385, courses: 420 },
  { date: "2024-05-05", students: 481, courses: 390 },
  { date: "2024-05-06", students: 498, courses: 520 },
  { date: "2024-05-07", students: 388, courses: 300 },
  { date: "2024-05-08", students: 149, courses: 210 },
  { date: "2024-05-09", students: 227, courses: 180 },
  { date: "2024-05-10", students: 293, courses: 330 },
  { date: "2024-05-11", students: 335, courses: 270 },
  { date: "2024-05-12", students: 197, courses: 240 },
  { date: "2024-05-13", students: 197, courses: 160 },
  { date: "2024-05-14", students: 448, courses: 490 },
  { date: "2024-05-15", students: 473, courses: 380 },
  { date: "2024-05-16", students: 338, courses: 400 },
  { date: "2024-05-17", students: 499, courses: 420 },
  { date: "2024-05-18", students: 315, courses: 350 },
  { date: "2024-05-19", students: 235, courses: 180 },
  { date: "2024-05-20", students: 177, courses: 230 },
  { date: "2024-05-21", students: 82, courses: 140 },
  { date: "2024-05-22", students: 81, courses: 120 },
  { date: "2024-05-23", students: 252, courses: 290 },
  { date: "2024-05-24", students: 294, courses: 220 },
  { date: "2024-05-25", students: 201, courses: 250 },
  { date: "2024-05-26", students: 213, courses: 170 },
  { date: "2024-05-27", students: 420, courses: 460 },
  { date: "2024-05-28", students: 233, courses: 190 },
  { date: "2024-05-29", students: 78, courses: 130 },
  { date: "2024-05-30", students: 340, courses: 280 },
];

const chartConfig = {
  visitors: { label: "Activity" },
  students: { label: "Students", color: "hsl(160, 84%, 39%)" },
  courses: { label: "Courses", color: "hsl(217, 91%, 60%)" },
} satisfies ChartConfig;

// Sidebar Component - Linear Style
function Sidebar() {
  const [searchValue, setSearchValue] = useState('');
  
  return (
    <div className="w-[200px] lg:w-[240px] bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col h-full">
      {/* Logo Section with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="p-3 flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
            <div className="relative w-5 h-5">
              <Image src="/threadlmslogofavi.png" alt="Logo" fill className="object-contain" />
            </div>
            <AnimatedShinyText shimmerWidth={100} className="text-white text-sm font-medium">
              THREADLMS
            </AnimatedShinyText>
            <ChevronDown className="w-3 h-3 text-gray-500 ml-auto" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-[#1a1a1a] border-[#2a2a2a]" align="start">
          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#252525] cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search Input */}
      <div className="px-3 py-1 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-7 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        <SidebarItem icon={Inbox} label="Inbox" />
        <SidebarItem icon={CircleDot} label="My Courses" />
        <SidebarItem icon={Star} label="Reviews" />
        <SidebarItem icon={Zap} label="Progress" />

        {/* Workspace Section */}
        <div className="pt-4 pb-1">
          <span className="px-2 text-[10px] text-gray-500 uppercase tracking-wider">Workspace</span>
        </div>
        <SidebarItem icon={FolderOpen} label="Initiatives" />
        <SidebarItem icon={LayoutGrid} label="Projects" />
        <SidebarItem icon={MoreHorizontal} label="More" />

        {/* Favorites Section */}
        <div className="pt-4 pb-1">
          <span className="px-2 text-[10px] text-gray-500 uppercase tracking-wider">Favorites</span>
        </div>
        <SidebarItem icon={Zap} label="Quick Start" highlight />
        <SidebarItem icon={BookOpen} label="All Courses" />
        <SidebarItem icon={Award} label="Certificates" />
      </nav>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, highlight }: { icon: React.ElementType; label: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${highlight ? 'text-purple-400' : 'text-gray-400'} hover:bg-[#1a1a1a] hover:text-white`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm truncate">{label}</span>
    </div>
  );
}

// Main Content Component
function MainContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState('');
  const [timeRange, setTimeRange] = React.useState("30d");
  const [isStarred, setIsStarred] = useState(false);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-05-30");
    let daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;
    else if (timeRange === "90d") daysToSubtract = 90;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const handleStudentClick = () => {
    setIsLoading('student');
    localStorage.setItem('attemptedRole', 'student');
    router.push('/auth');
  };

  const handleFacultyClick = () => {
    setIsLoading('faculty');
    localStorage.setItem('attemptedRole', 'faculty');
    router.push('/faculty/auth');
  };

  const stats = [
    { icon: BookOpen, label: 'Active Courses', value: '50+' },
    { icon: Users, label: 'Students', value: '2,500+' },
    { icon: Award, label: 'Certificates', value: '1,200+' },
    { icon: TrendingUp, label: 'Completion', value: '94%' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d] overflow-hidden">
      {/* Content Header Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a]">
        <span className="text-white text-sm font-medium">Dashboard</span>
        <div className="flex items-center gap-1 text-gray-500">
          <motion.button
            onClick={() => setIsStarred(!isStarred)}
            whileTap={{ scale: 0.9 }}
            className="p-0.5 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <Star 
              className={`w-3.5 h-3.5 transition-all duration-300 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} 
            />
          </motion.button>
          <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">🔔</span>
          <MoreHorizontal className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="hover:text-white cursor-pointer">Overview</span>
          <span className="hover:text-white cursor-pointer">Updates</span>
          <span className="hover:text-white cursor-pointer">Courses</span>
          <span className="hover:text-white cursor-pointer">Stats</span>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Chart Section */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <div>
              <h3 className="text-white text-sm font-medium">Platform Activity</h3>
              <p className="text-gray-500 text-xs">Student engagement over time</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="7d" className="text-white text-xs">Last 7 days</SelectItem>
                <SelectItem value="30d" className="text-white text-xs">Last 30 days</SelectItem>
                <SelectItem value="90d" className="text-white text-xs">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4">
            <ChartContainer config={chartConfig} className="h-[120px] w-full">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCourses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fill: '#4a4a4a', fontSize: 10 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      indicator="dot"
                    />
                  }
                />
                <Area dataKey="courses" type="natural" fill="url(#fillCourses)" stroke="hsl(217, 91%, 60%)" stackId="a" />
                <Area dataKey="students" type="natural" fill="url(#fillStudents)" stroke="hsl(160, 84%, 39%)" stackId="a" />
              </AreaChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-400">Students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-400">Courses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-3">
              <stat.icon className="w-4 h-4 text-gray-500 mb-1" />
              <p className="text-white font-semibold text-lg">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role Selection */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4">
          <h3 className="text-white text-sm font-medium mb-1">Choose Your Role</h3>
          <p className="text-gray-500 text-xs mb-4">Select how you want to access the platform</p>
          
          <div className="flex gap-3">
            <Button
              onClick={handleStudentClick}
              disabled={isLoading !== ''}
              className="flex-1 h-11 bg-white hover:bg-gray-100 text-black font-medium text-sm rounded-lg transition-colors"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              {isLoading === 'student' ? 'Loading...' : 'I am a Student'}
            </Button>
            <Button
              onClick={handleFacultyClick}
              disabled={isLoading !== ''}
              className="flex-1 h-11 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium text-sm rounded-lg border border-[#2a2a2a] transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading === 'faculty' ? 'Loading...' : 'I am Faculty'}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center justify-between text-[10px]">
        <AnimatedShinyText shimmerWidth={60} className="text-gray-500">
          {new Date().toLocaleDateString()}
        </AnimatedShinyText>
        <AnimatedShinyText shimmerWidth={80} className="text-gray-500">
          THREADLMS v2.0
        </AnimatedShinyText>
        <AnimatedShinyText shimmerWidth={40} className="text-gray-500">
          © 2026
        </AnimatedShinyText>
      </div>
    </div>
  );
}

// Right Panel - Status Info (Like Linear)
function RightPanel() {
  return (
    <div className="w-[180px] lg:w-[200px] bg-[#0d0d0d] border-l border-[#1a1a1a] p-3 hidden xl:block">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <AnimatedShinyText shimmerWidth={80} className="text-yellow-500 text-sm">
            In Progress
          </AnimatedShinyText>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Priority</span>
          <span className="text-white text-sm ml-auto">Medium</span>
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Assignee</span>
          <span className="text-white text-sm ml-auto">You</span>
        </div>

        {/* Timeline */}
        <div className="pt-2 border-t border-[#1a1a1a]">
          <span className="text-gray-500 text-xs">Timeline</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white text-sm">Feb 23, 2026</span>
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <span className="text-white text-sm">Q3 2026</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="pt-2 border-t border-[#1a1a1a]">
          <span className="text-gray-500 text-xs">Milestones</span>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-white text-xs">Core</span>
              </div>
              <span className="text-gray-500 text-[10px]">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-white text-xs">Polish</span>
              </div>
              <span className="text-gray-500 text-[10px]">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="text-white text-xs">Beta</span>
              </div>
              <span className="text-gray-500 text-[10px]">18%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Card - The main container
function DashboardCard() {
  return (
    <div className="w-full max-w-[1400px] h-[560px] lg:h-[620px] bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] overflow-hidden flex shadow-2xl shadow-black/50">
      <Sidebar />
      <MainContent />
      <RightPanel />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const checkSessionAndAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const currentSessionId = sessionStorage.getItem(SESSION_KEY);
        const shownLoadingInSession = sessionStorage.getItem(SESSION_SHOWN_LOADING);
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        
        const now = Date.now();
        const lastActivityTime = lastActivity ? parseInt(lastActivity) : 0;
        const timeSinceLastActivity = now - lastActivityTime;
        const isNewSession = !currentSessionId || timeSinceLastActivity > 30 * 60 * 1000;
        
        if (session?.user) {
          const storedRole = localStorage.getItem('userRole');
          
          if (isNewSession && !shownLoadingInSession) {
            const newSessionId = `${Date.now()}_${Math.random()}`;
            sessionStorage.setItem(SESSION_KEY, newSessionId);
            sessionStorage.setItem(SESSION_SHOWN_LOADING, 'true');
            localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
            
            setShowLoading(true);
            
            setTimeout(() => {
              if (storedRole === 'student') {
                router.push('/dashboard');
              } else if (storedRole === 'faculty') {
                router.push('/faculty/coursesavailable');
              } else {
                setShowLoading(false);
                setShowLanding(true);
              }
            }, 3500);
          } else {
            if (storedRole === 'student') {
              router.push('/dashboard');
            } else if (storedRole === 'faculty') {
              router.push('/faculty/coursesavailable');
            } else {
              setShowLanding(true);
            }
          }
        } else {
          if (isNewSession || !shownLoadingInSession) {
            const newSessionId = `${Date.now()}_${Math.random()}`;
            sessionStorage.setItem(SESSION_KEY, newSessionId);
            sessionStorage.setItem(SESSION_SHOWN_LOADING, 'true');
            localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
            
            setShowLoading(true);
            
            setTimeout(() => {
              setShowLoading(false);
              setShowLanding(true);
            }, 3500);
          } else {
            setShowLanding(true);
          }
        }
      } catch {
        setShowLanding(true);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSessionAndAuth();
  }, [router]);

  if (showLoading || checkingAuth) {
    return <LoadingPage />;
  }

  if (!showLanding) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-6 lg:px-12 pt-8 lg:pt-12 pb-8">
        {/* Hero Text - Left Aligned */}
        <div className="w-full max-w-[1400px] mb-6 lg:mb-10">
          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            The advanced learning<br />
            platform for students<br />
            and educators
          </motion.h1>
          
          <motion.div 
            className="flex items-center justify-between mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-400 text-base lg:text-lg max-w-xl">
              Purpose-built for modern education with AI-powered learning paths. Designed for the future.
            </p>
            <a href="#" className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <span className="text-white font-medium">New</span>
              <span>AI Course Assistant (Beta)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <DashboardCard />
        </motion.div>
      </main>
    </div>
  );
}
