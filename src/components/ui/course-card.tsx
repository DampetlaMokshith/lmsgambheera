"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";

interface CourseCardProps {
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
  rating: number;
  totalEnrollments: number;
  estimatedDuration: number;
  level: string;
  price: number;
  tags: string[];
  isPublished: boolean;
  enrollmentCountOverride?: number; // Optional override for real-time count
  buttonText?: string; // Optional custom button text
  buttonHref?: string; // Optional custom button link
}

export default function CourseCard({
  title,
  description,
  slug,
  thumbnail,
  faculty,
  rating,
  totalEnrollments,
  estimatedDuration,
  level,
  tags,
  isPublished,
  enrollmentCountOverride,
  buttonText = "Start Course",
  buttonHref
}: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!isPublished) return null;

  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-400/25 text-yellow-400/50" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-400" />
      );
    }

    return stars;
  };

  return (
    <Link href={buttonHref || `/courses/${slug.current}`} className="block">
      <div
        className={`
          group relative bg-black border rounded-xl overflow-hidden cursor-pointer
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

        {/* Faculty Info and Rating */}
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

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {renderStars(rating || 4.5)}
            </div>
            <span className="text-xs text-gray-300 ml-1">
              {(rating || 4.5).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Tags and Stats */}
        <div className="flex items-center justify-between">
          {/* Tags - Only show 2 tags */}
          <div className="flex flex-wrap gap-1">
            {tags && tags.length > 0 ? (
              <>
                {tags.slice(0, 2).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs border-accent text-gray-300 hover:border-gray-600 px-2 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge variant="outline" className="text-xs border-accent text-gray-300 px-2 py-0">
                    +{tags.length - 2}
                  </Badge>
                )}
              </>
            ) : (
              <div></div>
            )}
          </div>

          {/* Enrollments and Duration */}
          <div className="flex items-center space-x-2">
            {/* Enrollments */}
            <div className="flex items-center space-x-1 text-gray-400">
              <Users className="w-3 h-3" />
              <span className="text-xs">
                {(enrollmentCountOverride ?? (totalEnrollments || 0)).toLocaleString()}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center space-x-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{estimatedDuration || 0}h</span>
            </div>
          </div>
        </div>

        {/* Start Course Button */}
        <div className="block">
          <Button 
            className={`
              w-full bg-white 
              hover:from-blue-700 hover:to-purple-700 
              text-black font-semibold py-2 rounded-lg
              transform transition-all duration-300 ease-in-out
              ${isHovered ? 'shadow-lg shadow-yellow-500/25' : ''}
              group-hover:scale-[1.02]
            `}
          >
            <Play className="w-3 h-3 mr-2 fill-current" />
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
    </Link>
  );
}