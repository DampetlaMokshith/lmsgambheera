import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import Image from "next/image";

interface Course {
  _id: string;
  title: string;
  description?: string;
  slug: {
    current: string;
  };
  thumbnail?: {
    asset: {
      _id: string;
    };
  };
  degree?: string;
  department?: string;
  facultyName?: string;
}

interface SuggestiveSearchProps {
  onChange?: (val: string) => void;
  className?: string;
}

const SuggestiveSearch: React.FC<SuggestiveSearchProps> = ({
  onChange,
  className,
}) => {
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search courses
  useEffect(() => {
    const searchCourses = async () => {
      if (search.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const query = `*[_type == "course" && (
          title match $searchTerm + "*" ||
          description match $searchTerm + "*" ||
          degree match $searchTerm + "*" ||
          department match $searchTerm + "*" ||
          facultyName match $searchTerm + "*"
        )][0...5]{
          _id,
          title,
          description,
          slug,
          thumbnail,
          degree,
          department,
          facultyName
        }`;

        const courses = await client.fetch<Course[]>(query, {
          searchTerm: search.trim()
        });

        setResults(courses);
        setShowResults(true);
      } catch (error) {
setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCourses, 300);
    return () => clearTimeout(debounceTimer);
  }, [search]);

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange?.(val);
  };

  const handleCourseClick = (slug: string) => {
    setSearch("");
    setShowResults(false);
    router.push(`/courses/${slug}`);
  };

  return (
    <div ref={searchRef} className="relative">
      <div
        className={cn(
          "relative flex items-center gap-x-2 py-2 px-4 border border-white rounded-full bg-black",
          className
        )}
      >
        <Search className="size-4 text-white flex-shrink-0" />
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => search.length >= 2 && results.length > 0 && setShowResults(true)}
            className="bg-transparent outline-none text-sm text-white w-full relative z-10"
            aria-label="search"
          />
          {!search && (
            <div className="absolute inset-0  pointer-events-none">
              <AnimatedShinyText shimmerWidth={80} className="text-sm text-white/50">
                Search courses...
              </AnimatedShinyText>
            </div>
          )}
        </div>
        {loading && <Loader2 className="size-4 text-white animate-spin flex-shrink-0" />}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black border border-white/20 shadow-2xl z-50 w-[90vw] sm:w-[600px] sm:max-w-[90vw] sm:left-0 sm:translate-x-0">
          <ScrollArea className="h-[400px]">
            <div className="p-2">
              {results.map((course) => (
                <button
                  key={course._id}
                  onClick={() => handleCourseClick(course.slug.current)}
                  className="w-full text-left px-3 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3 group cursor-pointer"
                >
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-800 overflow-hidden">
                    {course.thumbnail ? (
                      <Image
                        src={urlFor(course.thumbnail).width(64).height(64).url()}
                        alt={course.title}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium mb-1 line-clamp-1">{course.title}</div>
                    {course.description && (
                      <div className="text-gray-400 text-sm mb-1 line-clamp-1">
                        {course.description}
                      </div>
                    )}
                    <div className="flex gap-2 text-xs text-gray-500">
                      {course.degree && <span>• {course.degree}</span>}
                      {course.department && <span>• {course.department}</span>}
                      {course.facultyName && <span>• {course.facultyName}</span>}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0 text-gray-500 group-hover:text-white transition-colors">
                    <ArrowRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* No Results Message */}
      {showResults && !loading && search.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black border border-white/20 shadow-2xl p-4 z-50 w-[90vw] sm:w-[600px] sm:max-w-[90vw] sm:left-0 sm:translate-x-0">
          <p className="text-gray-400 text-sm text-center">
            No courses found matching &quot;{search}&quot;
          </p>
        </div>
      )}
    </div>
  );
};

export default SuggestiveSearch;
