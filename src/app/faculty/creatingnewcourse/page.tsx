'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import FacultyLayout from '@/components/layout/faculty-layout';
import CourseContentManager from '@/components/faculty/course-content-creator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { editorClient } from '@/sanity/lib/client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Plus, X, Save, Send, BookOpen, Settings } from 'lucide-react';

// Define interfaces
interface CourseData {
  title: string;
  description: string;
  thumbnail?: File;
  previewVideo: string;
  degree: string;
  department: string;
  faculty: string;
  language: string;
  level: string;
  price: number;
  whatYouLearn: string[];
  requirements: string[];
  courseIncludes: string[];
  tags: string[];
  estimatedDuration: number;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  supabaseId?: string;
}

interface User {
  id: string;
  email?: string;
}

interface CourseSection {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  order: number;
  estimatedDuration?: number;
  isActive?: boolean;
  lectures?: ContentItem[];
  modules?: ContentItem[];
  assignments?: ContentItem[];
  quiz?: ContentItem;
}

interface ContentItem {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  duration?: number;
  order?: number;
  dueDate?: string;
  [key: string]: unknown;
}

interface SanityImageAsset {
  _type: 'image';
  asset: {
    _type: 'reference';
    _ref: string;
  };
}

export default function CreatingNewCoursePage() {
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    previewVideo: '',
    degree: 'btech',
    department: 'cse',
    faculty: '',
    language: 'English',
    level: 'beginner',
    price: 0,
    whatYouLearn: [''],
    requirements: [''],
    courseIncludes: ['Lifetime access', 'Certificate of completion', 'Downloadable resources'],
    tags: [''],
    estimatedDuration: 1
  });

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [currentPage, setCurrentPage] = useState(1);

  // Degree options
  const degreeOptions = [
    { label: 'B.Tech (Bachelor of Technology)', value: 'btech' },
    { label: 'M.Tech (Master of Technology)', value: 'mtech' },
    { label: 'MBA (Master of Business Administration)', value: 'mba' },
  ];

  // Department options
  const departmentOptions = [
    { label: 'Computer Science & Engineering', value: 'cse' },
    { label: 'Electronics & Communication', value: 'ece' },
    { label: 'Mechanical Engineering', value: 'mech' },
    { label: 'Civil Engineering', value: 'civil' },
  ];

  // Level options
  const levelOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  // Language options
  const languageOptions = [
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Telugu', value: 'Telugu' },
    { label: 'Tamil', value: 'Tamil' },
  ];

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Auto-select current faculty if found
      if (user?.id && facultyList.length > 0) {
        const currentFaculty = facultyList.find(f => f.supabaseId === user.id);
        if (currentFaculty) {
          setCourseData(prev => ({ ...prev, faculty: currentFaculty._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, [facultyList]);

  const fetchFacultyList = useCallback(async () => {
    try {
      const faculty = await editorClient.fetch(`
        *[_type == "faculty"] {
          _id,
          name,
          email,
          supabaseId
        }
      `);
      setFacultyList(faculty);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty list');
    }
  }, []);

  useEffect(() => {
    fetchFacultyList();
  }, [fetchFacultyList]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleInputChange = (field: keyof CourseData, value: string | number | File) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: 'whatYouLearn' | 'requirements' | 'courseIncludes' | 'tags', index: number, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'whatYouLearn' | 'requirements' | 'courseIncludes' | 'tags') => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'whatYouLearn' | 'requirements' | 'courseIncludes' | 'tags', index: number) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleThumbnailUpload = (file: File) => {
    setCourseData(prev => ({ ...prev, thumbnail: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToSanity = async (file: File): Promise<SanityImageAsset> => {
    try {
      console.log('🔄 Uploading image to Sanity...');
      
      // Use the editorClient with proper authentication
      const asset = await editorClient.assets.upload('image', file, {
        filename: file.name,
      });
      
      console.log('✅ Image uploaded successfully:', asset._id);
      
      return {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        }
      };
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error('Insufficient permissions to upload images. Please check your Sanity API token.');
        } else if (error.message.includes('unauthorized')) {
          throw new Error('Unauthorized access. Please verify your Sanity configuration.');
        }
      }
      
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!courseData.title.trim()) {
      toast.error('Course title is required');
      return false;
    }
    if (!courseData.description.trim()) {
      toast.error('Course description is required');
      return false;
    }
    if (!courseData.faculty) {
      toast.error('Please select a faculty instructor');
      return false;
    }
    if (courseData.whatYouLearn.filter(item => item.trim()).length < 3) {
      toast.error('Please add at least 3 learning outcomes');
      return false;
    }
    if (!courseData.thumbnail) {
      toast.error('Course thumbnail is required for publishing');
      return false;
    }
    return true;
  };

  const createCourseSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const saveDraft = async () => {
    setIsLoading(true);
    try {
      // Basic validation for draft
      if (!courseData.title.trim()) {
        toast.error('Course title is required to save draft');
        return;
      }

      let thumbnailData = null;
      if (courseData.thumbnail) {
        thumbnailData = await uploadImageToSanity(courseData.thumbnail);
      }

      const courseDocument = {
        _type: 'course',
        title: courseData.title,
        slug: {
          _type: 'slug',
          current: createCourseSlug(courseData.title)
        },
        description: courseData.description,
        ...(thumbnailData && { thumbnail: thumbnailData }),
        previewVideo: courseData.previewVideo || undefined,
        degree: courseData.degree,
        department: courseData.department,
        faculty: {
          _type: 'reference',
          _ref: courseData.faculty
        },
        language: courseData.language,
        level: courseData.level,
        price: courseData.price,
        whatYouLearn: courseData.whatYouLearn.filter(item => item.trim()),
        requirements: courseData.requirements.filter(item => item.trim()),
        courseIncludes: courseData.courseIncludes.filter(item => item.trim()),
        tags: courseData.tags.filter(item => item.trim()),
        estimatedDuration: courseData.estimatedDuration,
        isPublished: false,
        isFeatured: false,
        difficultyLevel: courseData.level === 'beginner' ? 1 : courseData.level === 'intermediate' ? 3 : 5,
        rating: 4.5,
        totalEnrollments: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await editorClient.create(courseDocument);
      toast.success('Course draft saved successfully!');
      console.log('Draft saved:', result);
    } catch (error: unknown) {
      console.error('Error saving draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      toast.error('Failed to save draft: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const publishAndSyncCourse = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔄 Publishing course and syncing...');
      
      let thumbnailData = null;
      if (courseData.thumbnail) {
        thumbnailData = await uploadImageToSanity(courseData.thumbnail);
      }

      const courseDocument = {
        _type: 'course',
        title: courseData.title,
        slug: {
          _type: 'slug',
          current: createCourseSlug(courseData.title)
        },
        description: courseData.description,
        thumbnail: thumbnailData,
        previewVideo: courseData.previewVideo || undefined,
        degree: courseData.degree,
        department: courseData.department,
        faculty: {
          _type: 'reference',
          _ref: courseData.faculty
        },
        language: courseData.language,
        subtitles: false,
        level: courseData.level,
        price: courseData.price,
        whatYouLearn: courseData.whatYouLearn.filter(item => item.trim()),
        requirements: courseData.requirements.filter(item => item.trim()),
        courseIncludes: courseData.courseIncludes.filter(item => item.trim()),
        tags: courseData.tags.filter(item => item.trim()),
        estimatedDuration: courseData.estimatedDuration,
        difficultyLevel: courseData.level === 'beginner' ? 1 : courseData.level === 'intermediate' ? 3 : 5,
        rating: 4.5,
        totalEnrollments: 0,
        isPublished: true,
        isFeatured: false,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Step 1: Create course in Sanity
      console.log('📝 Creating course in Sanity...');
      const sanityResult = await editorClient.create(courseDocument);
      console.log('✅ Course created in Sanity:', sanityResult._id);

      // Step 2: Sync to Supabase
      console.log('🔄 Syncing to Supabase...');
      await syncCourseToSupabase(sanityResult);

      // Step 3: Sync all existing courses to ensure completeness
      console.log('🔄 Syncing all courses...');
      await syncAllCoursesToSupabase();

      toast.success('🎉 Course published and synced successfully!');
      
      // Reset form
      setCourseData({
        title: '',
        description: '',
        previewVideo: '',
        degree: 'btech',
        department: 'cse',
        faculty: '',
        language: 'English',
        level: 'beginner',
        price: 0,
        whatYouLearn: [''],
        requirements: [''],
        courseIncludes: ['Lifetime access', 'Certificate of completion', 'Downloadable resources'],
        tags: [''],
        estimatedDuration: 1
      });
      setThumbnailPreview('');
      setCourseSections([]);
      
    } catch (error: unknown) {
      console.error('❌ Error publishing course:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('permission')) {
        toast.error('❌ Permission denied. Please check your Sanity API token has Editor permissions.');
      } else if (errorMessage.includes('unauthorized')) {
        toast.error('❌ Unauthorized. Please verify your Sanity authentication.');
      } else {
        toast.error(`❌ Failed to publish course: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncCourseToSupabase = async (sanityData: { _id: string; title: string; slug: { current: string }; description: string; degree: string; department: string; level: string; price: number; isPublished: boolean; estimatedDuration?: number; language?: string; difficultyLevel?: number; [key: string]: unknown }) => {
    try {
      console.log('🔄 Syncing course to Supabase...');
      
      // Prepare course data for Supabase
      const courseData = {
        sanity_id: sanityData._id,
        title: sanityData.title,
        slug: sanityData.slug.current,
        description: sanityData.description,
        degree: sanityData.degree,
        department: sanityData.department,
        level: sanityData.level,
        price: sanityData.price || 0,
        estimated_duration: sanityData.estimatedDuration || 0,
        language: sanityData.language || 'English',
        difficulty_level: sanityData.difficultyLevel || 1,
        is_published: sanityData.isPublished || true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if courses table exists and sync
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData);

      if (error) {
        console.error('❌ Supabase sync error:', error);
        // Don't throw error - course is still created in Sanity
        toast.warning('⚠️ Course published but sync to database had issues: ' + error.message);
      } else {
        console.log('✅ Course synced to Supabase:', data);
        toast.success('✅ Course successfully synced to database!');
      }
    } catch (error) {
      console.error('❌ Error syncing to Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      toast.warning('⚠️ Course published but database sync failed: ' + errorMessage);
    }
  };

  const syncAllCoursesToSupabase = async () => {
    try {
      console.log('🔄 Fetching all published courses from Sanity...');
      // Fetch all published courses from Sanity
      const allCourses = await editorClient.fetch(`
        *[_type == "course" && isPublished == true] {
          _id,
          title,
          slug,
          description,
          degree,
          department,
          level,
          price,
          estimatedDuration,
          language,
          difficultyLevel,
          isPublished,
          publishedAt,
          createdAt,
          updatedAt
        }
      `);

      console.log(`📊 Found ${allCourses.length} published courses in Sanity`);
      let syncedCount = 0;
      
      for (const course of allCourses) {
        try {
          // Check if course already exists in Supabase
          const { data: existing } = await supabase
            .from('courses')
            .select('sanity_id')
            .eq('sanity_id', course._id)
            .single();

          if (!existing) {
            // Insert new course
            await supabase
              .from('courses')
              .insert({
                sanity_id: course._id,
                title: course.title,
                slug: course.slug?.current || course.title.toLowerCase().replace(/\s+/g, '-'),
                description: course.description,
                degree: course.degree,
                department: course.department,
                level: course.level,
                price: course.price || 0,
                estimated_duration: course.estimatedDuration || 0,
                language: course.language || 'English',
                difficulty_level: course.difficultyLevel || 1,
                is_published: course.isPublished,
                created_at: course.createdAt || new Date().toISOString(),
                updated_at: course.updatedAt || new Date().toISOString()
              });
            syncedCount++;
            console.log(`✅ Synced course: ${course.title}`);
          }
        } catch (error) {
          console.error(`❌ Error syncing course ${course._id}:`, error);
        }
      }

      console.log(`🎉 Sync complete: ${syncedCount} new courses synced to Supabase`);
      return syncedCount;
    } catch (error: unknown) {
      console.error('❌ Error syncing all courses:', error);
      throw error;
    }
  };

  return (
    <FacultyLayout title="Create New Course">
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Create New Course</h1>
          <p className="text-gray-400">Build and publish your course from scratch</p>
        </div>

        {/* Action Buttons with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={saveDraft}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button
              onClick={publishAndSyncCourse}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Publishing...' : 'Publish & Sync'}
            </Button>
          </div>
          
          {/* Pagination */}
          <Pagination className="w-auto">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={`min-h-[44px] min-w-[44px] ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === 1} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === 2} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage(2); }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < 2) setCurrentPage(currentPage + 1);
                  }}
                  className={`min-h-[44px] min-w-[44px] ${currentPage === 2 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="basic-info" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Basic Information
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Course Content
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic-info" className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-8">
              {/* Basic Information */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  📚 Basic Information
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Course Title *</Label>
                    <Input
                      id="title"
                      value={courseData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter course title"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-white">Duration (hours) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="200"
                      value={courseData.estimatedDuration}
                      onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 1)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Course Description *</Label>
                  <textarea
                    id="description"
                    value={courseData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what your course is about..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewVideo" className="text-white">Preview Video URL</Label>
                  <Input
                    id="previewVideo"
                    type="url"
                    value={courseData.previewVideo}
                    onChange={(e) => handleInputChange('previewVideo', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Course Details */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  ⚙️ Course Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="degree" className="text-white">Degree *</Label>
                    <select
                      id="degree"
                      value={courseData.degree}
                      onChange={(e) => handleInputChange('degree', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      {degreeOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white">Department *</Label>
                    <select
                      id="department"
                      value={courseData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      {departmentOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-white">Course Level *</Label>
                    <select
                      id="level"
                      value={courseData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      {levelOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty" className="text-white">Faculty Instructor *</Label>
                    <select
                      id="faculty"
                      value={courseData.faculty}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      <option value="" className="bg-gray-800">Select Faculty</option>
                      {facultyList.map(faculty => (
                        <option key={faculty._id} value={faculty._id} className="bg-gray-800">
                          {faculty.name} ({faculty.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-white">Language</Label>
                    <select
                      id="language"
                      value={courseData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      {languageOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={courseData.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      placeholder="0 for free"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Thumbnail Upload */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  🖼️ Course Thumbnail
                </h2>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                    {thumbnailPreview ? (
                      <div className="space-y-4">
                        <Image 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          width={300}
                          height={200}
                          className="max-w-full h-48 object-cover mx-auto rounded-lg"
                        />
                        <Button
                          onClick={() => {
                            setThumbnailPreview('');
                            setCourseData(prev => ({ ...prev, thumbnail: undefined }));
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-white">Upload course thumbnail</p>
                          <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbnailUpload(file);
                          }}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <Label htmlFor="thumbnail-upload">
                          <Button asChild variant="outline">
                            <span>Choose Image</span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Learning Outcomes */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  🎯 What You&apos;ll Learn *
                </h2>
                
                <div className="space-y-3">
                  {courseData.whatYouLearn.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('whatYouLearn', index, e.target.value)}
                        placeholder="Learning outcome"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      {courseData.whatYouLearn.length > 1 && (
                        <Button
                          onClick={() => removeArrayField('whatYouLearn', index)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={() => addArrayField('whatYouLearn')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Learning Outcome
                  </Button>
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Course Requirements */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  📋 Course Requirements
                </h2>
                
                <div className="space-y-3">
                  {courseData.requirements.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                        placeholder="Requirement or prerequisite"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      {courseData.requirements.length > 1 && (
                        <Button
                          onClick={() => removeArrayField('requirements', index)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={() => addArrayField('requirements')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Requirement
                  </Button>
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Course Includes */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  📦 This Course Includes
                </h2>
                
                <div className="space-y-3">
                  {courseData.courseIncludes.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('courseIncludes', index, e.target.value)}
                        placeholder="What's included with this course"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button
                        onClick={() => removeArrayField('courseIncludes', index)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => addArrayField('courseIncludes')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </Button>
                </div>
              </section>

              <Separator className="bg-white/20" />

              {/* Tags */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  🏷️ Course Tags
                </h2>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {courseData.tags.filter(tag => tag.trim()).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => removeArrayField('tags', index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={courseData.tags[courseData.tags.length - 1] || ''}
                      onChange={(e) => {
                        const newTags = [...courseData.tags];
                        newTags[newTags.length - 1] = e.target.value;
                        setCourseData(prev => ({ ...prev, tags: newTags }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          addArrayField('tags');
                        }
                      }}
                      placeholder="Add a tag (press Enter)"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button
                      onClick={() => addArrayField('tags')}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          {/* Course Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <CourseContentManager
              initialSections={courseSections}
              onSectionsChange={setCourseSections}
              editable={true}
            />
          </TabsContent>
        </Tabs>

        {/* Bottom Action Buttons with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={saveDraft}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={publishAndSyncCourse}
              disabled={isLoading}
              size="lg"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-5 h-5" />
              {isLoading ? 'Publishing...' : 'Publish & Sync Course'}
            </Button>
          </div>
          
          {/* Bottom Pagination */}
          <Pagination className="w-auto">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={`min-h-[44px] min-w-[44px] ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === 1} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === 2} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage(2); }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < 2) setCurrentPage(currentPage + 1);
                  }}
                  className={`min-h-[44px] min-w-[44px] ${currentPage === 2 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </FacultyLayout>
  );
}
