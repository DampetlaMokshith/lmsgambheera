"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";

interface FacultyCardProps {
  _id: string;
  title: string;
  description: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    asset?: {
      url?: string;
      _ref?: string;
    };
    alt?: string;
  };
  faculty: {
    name: string;
    email: string;
    profileImage?: {
      asset?: {
        _ref?: string;
        url?: string;
      };
      alt?: string;
    };
  };
  totalEnrollments?: number;
  duration?: string;
  level: string;
  isPublished: boolean;
  enrollmentCount?: number;
  createdAt: string;
}

export default function FacultyCard({
  _id,
  title,
  description,
  slug,
  thumbnail,
  faculty,
  duration,
  level,
  isPublished,
  enrollmentCount: propEnrollmentCount, // Use passed enrollment count instead of fetching
}: FacultyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use prop enrollment count instead of fetching individually
  const enrollmentCount = propEnrollmentCount || 0;

  const truncateDescription = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <Link 
      href={`/faculty/edit/${slug.current}`}
      className="block cursor-pointer"
    >
      <div
        className={`
          group relative bg-black border border-gray-800 rounded-xl overflow-hidden
          transition-all duration-300 ease-in-out transform hover:shadow-lg hover:shadow-white/10
          ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}
          h-full flex flex-col
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay for better visual hierarchy */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Thumbnail Section - Match course card height */}
        <div className="relative h-36 overflow-hidden bg-gray-800 flex-shrink-0">
          {thumbnail?.asset ? (
            <Image
              src={thumbnail.asset.url || urlFor(thumbnail).width(400).height(300).url()}
              alt={thumbnail.alt || title}
              fill
              className={`
                object-cover transition-all duration-500 ease-in-out
                ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                group-hover:scale-110
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error('Failed to load thumbnail for course:', title);
                setImageLoaded(true); // Show fallback
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}

          {/* Publication Status Badge */}
          <Badge 
            variant={isPublished ? "default" : "secondary"}
            className={`absolute top-3 right-3 text-xs ${
              isPublished 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-gray-600 text-gray-200"
            } backdrop-blur-sm border-0`}
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>

          {/* Level badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-gray-800/80 backdrop-blur-sm text-gray-200 border-gray-700"
          >
            {level?.charAt(0).toUpperCase() + level?.slice(1)}
          </Badge>
        </div>

        {/* Content Section - Match course card layout and spacing */}
        <div className="p-4 space-y-2 flex-grow flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors duration-300 line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-xs leading-relaxed flex-grow">
            {truncateDescription(description, 80)}
          </p>

          {/* Faculty Info and Stats - Match course card layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 relative rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                {faculty.profileImage?.asset?.url ? (
                  <Image
                    src={faculty.profileImage.asset.url}
                    alt={faculty.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                ) : faculty.profileImage?.asset?._ref ? (
                  <Image
                    src={urlFor(faculty.profileImage).width(24).height(24).url()}
                    alt={faculty.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {faculty.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-300 font-medium">{faculty.name}</span>
            </div>

            {/* Enrollments and Duration */}
            <div className="flex items-center space-x-2">
              {/* Enrollments */}
              <div className="flex items-center space-x-1 text-gray-400">
                <Users className="w-3 h-3" />
                <span className="text-xs">
                  {enrollmentCount.toLocaleString()}
                </span>
              </div>

              {/* Duration */}
              {duration && (
                <div className="flex items-center space-x-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button - Match course card style */}
          <div className="block">
            <div className={`
              w-full bg-white text-black font-semibold py-2 rounded-lg text-center
              transform transition-all duration-300 ease-in-out text-xs
              ${isHovered ? 'shadow-lg shadow-yellow-500/25' : ''}
              group-hover:scale-[1.02]
            `}>
              Click to edit →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}