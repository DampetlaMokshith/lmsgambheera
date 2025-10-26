"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseProgressBar } from "@/components/learn/course-progress-bar";
import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { supabase } from "@/lib/supabase";

interface EnrolledCourseCardProps {
  _id: string;
  title: string;
  description: string;
  slug: {
    current: string;
  };
  thumbnail: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  faculty: {
    name: string;
    profileImage?: {
      asset: {
        _ref: string;
      };
    };
  };
  level: string;
  isPublished: boolean;
  progress?: number; // Progress percentage from course_enrollments table
}

export default function EnrolledCourseCard({
  _id,
  title,
  description,
  thumbnail,
  faculty,
  level,
  isPublished,
  progress = 0
}: EnrolledCourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [actualProgress, setActualProgress] = useState(progress);

  // Fetch user and actual progress
  useEffect(() => {
    const fetchUserAndProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch actual progress from API
          const response = await fetch(`/api/progress/${_id}?userId=${user.id}`);
          if (response.ok) {
            const progressData = await response.json();
            setActualProgress(progressData.progress_percentage || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchUserAndProgress();
  }, [_id]);

  if (!isPublished) return null;

  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div
      className={`
        group relative bg-black border rounded-xl overflow-hidden
        transition-all duration-300 ease-in-out transform hover:shadow-lg hover:shadow-accent
        ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay for better visual hierarchy */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Thumbnail Section */}
      <div className="relative h-36 overflow-hidden">
        <Image
          src={urlFor(thumbnail).width(600).height(400).url()}
          alt={thumbnail.alt || title}
          fill
          className={`
            object-cover transition-all duration-500 ease-in-out
            ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
            group-hover:scale-110
          `}
          onLoad={() => setImageLoaded(true)}
          priority
        />

        {/* Level badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-gray-800/80 backdrop-blur-sm text-gray-200 border-gray-700"
        >
          {level?.charAt(0).toUpperCase() + level?.slice(1)}
        </Badge>

        {/* Enrolled badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-green-600/80 backdrop-blur-sm text-white border-green-500"
        >
          Enrolled
        </Badge>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors duration-300 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-xs leading-relaxed">
          {truncateDescription(description, 80)}
        </p>

        {/* Faculty Info and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 relative rounded-full overflow-hidden border border-gray-700">
              {faculty.profileImage ? (
                <Image
                  src={urlFor(faculty.profileImage).width(24).height(24).url()}
                  alt={faculty.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {faculty.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-300 font-medium">{faculty.name}</span>
          </div>

          {/* Progress percentage */}
          <div className="text-xs text-gray-300 font-semibold">
            {Math.round(actualProgress)}%
          </div>
        </div>

        {/* Progress Bar */}
        <CourseProgressBar
          percent={actualProgress}
          showDetails={false}
          className="pt-1"
        />

        {/* Continue Course Button */}
        <Link href={`/courses/learn/${_id}`} className="block">
          <Button 
            className={`
              w-full bg-green-600 hover:bg-green-700
              text-white font-semibold py-2 rounded-lg
              transform transition-all duration-300 ease-in-out
              ${isHovered ? 'shadow-lg shadow-green-500/25' : ''}
              group-hover:scale-[1.02]
            `}
          >
            <Play className="w-3 h-3 mr-2 fill-current" />
            Continue Course
          </Button>
        </Link>
      </div>
    </div>
  );
}