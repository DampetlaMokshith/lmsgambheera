'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FacultyLayout from '@/components/layout/faculty-layout';
import { supabase } from '@/lib/supabase';
import { safeClient } from '@/sanity/lib/safeClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, Play, ChevronRight, Globe, BookOpen, Trophy, CheckCircle, Tag } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import CourseContentManager from '@/components/faculty/course-content-manager';

interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  thumbnail?: {
    asset: {
      _id: string;
      _ref?: string;
      url: string;
    };
  };
  duration?: string;
  level: string;
  language?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  faculty: {
    _id: string;
    name: string;
    email: string;
  };
  whatYouLearn?: string[];
  requirements?: string[];
  courseIncludes?: string[];
  tags?: string[];
  previewVideo?: string;
  modules?: Array<{
    _id: string;
    title: string;
    description: string;
    lectures: Array<{
      _id: string;
      title: string;
      videoUrl?: string;
      duration?: string;
    }>;
  }>;
  enrollmentCount?: number;
}

export default function EditCoursePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: '',
    language: '',
    duration: '',
    isPublished: false,
    whatYouWillLearn: [''],
    courseRequirements: [''],
    courseIncludes: [''],
    courseTags: [''],
    previewUrl: ''
  });
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/faculty/auth');
          return;
        }

        // Fetch course by slug
        const courseData = await safeClient.fetch(
          `*[_type == "course" && slug.current == $slug && faculty->email == $email][0] {
            _id,
            title,
            slug,
            description,
            thumbnail {
              asset -> {
                _id,
                _ref,
                url
              }
            },
            duration,
            level,
            language,
            isPublished,
            whatYouLearn,
            requirements,
            courseIncludes,
            tags,
            previewVideo,
            createdAt,
            updatedAt,
            faculty -> {
              _id,
              name,
              email
            },
            sections[] -> {
              _id,
              title,
              description
            }
          }`,
          { slug, email: session.user.email }
        );

        if (!courseData) {
          toast.error('Course not found or you do not have permission to edit this course');
          router.push('/faculty/coursesavailable');
          return;
        }

        console.log('📚 Course data fetched for editing:', courseData);
        setCourse(courseData as Course);
        const course = courseData as Course;
        setFormData({
          title: course.title || '',
          description: course.description || '',
          level: course.level || '',
          language: course.language || 'English',
          duration: course.duration || '',
          isPublished: course.isPublished || false,
          whatYouWillLearn: course.whatYouLearn && course.whatYouLearn.length > 0 ? course.whatYouLearn : [''],
          courseRequirements: course.requirements && course.requirements.length > 0 ? course.requirements : [''],
          courseIncludes: course.courseIncludes && course.courseIncludes.length > 0 ? course.courseIncludes : [''],
          courseTags: course.tags && course.tags.length > 0 ? course.tags : [''],
          previewUrl: course.previewVideo || ''
        });
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course');
        router.push('/faculty/coursesavailable');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCourse();
    }
  }, [slug, router]);

  const handleSave = async () => {
    if (!course) return;
    
    setSaving(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        language: formData.language,
        duration: formData.duration,
        isPublished: formData.isPublished,
        whatYouWillLearn: formData.whatYouWillLearn.filter(item => item.trim() !== ''),
        courseRequirements: formData.courseRequirements.filter(item => item.trim() !== ''),
        courseIncludes: formData.courseIncludes.filter(item => item.trim() !== ''),
        courseTags: formData.courseTags.filter(item => item.trim() !== ''),
        previewUrl: formData.previewUrl,
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Updating course with data:', updateData);

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required. Please log in again.');
        router.push('/faculty/auth');
        return;
      }

      // Call the API endpoint
      const response = await fetch('/api/faculty/courses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          courseId: course._id,
          updateData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (result.code === 'INSUFFICIENT_PERMISSIONS') {
          throw new Error('Insufficient permissions: The system does not have write access to Sanity. Please contact your administrator.');
        } else if (result.code === 'INVALID_TOKEN') {
          throw new Error('Invalid API configuration: Please check Sanity token setup.');
        } else if (result.code === 'NOT_FOUND') {
          throw new Error('Course not found: The course may have been deleted.');
        } else {
          throw new Error(result.error || 'Failed to update course');
        }
      }

      console.log('✅ Course update result:', result);
      
      toast.success('Course updated successfully!');
      
      // Update local state
      setCourse(prev => prev ? { ...prev, ...updateData, updatedAt: new Date().toISOString() } : null);
    } catch (error) {
      console.error('❌ Error updating course:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient permissions')) {
          toast.error('Permission Error: Unable to save changes. Please contact your system administrator.');
        } else if (error.message.includes('Authentication')) {
          toast.error('Authentication error. Please log in again.');
          router.push('/faculty/auth');
        } else if (error.message.includes('API configuration')) {
          toast.error('Configuration Error: Please contact technical support.');
        } else {
          toast.error(`Save failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      toast.info('Uploading thumbnail...');
      
      // Upload to Sanity
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in again');
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('courseId', course._id);

      const response = await fetch('/api/faculty/upload-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formDataObj
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const result = await response.json();
      
      // Update local state with new thumbnail
      setCourse(prev => prev ? {
        ...prev,
        thumbnail: {
          asset: {
            _id: result.assetId,
            url: result.url
          }
        }
      } : null);

      toast.success('Thumbnail updated successfully!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  if (loading) {
    return (
      <FacultyLayout title="Edit Course">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white">Loading course...</div>
        </div>
      </FacultyLayout>
    );
  }

  if (!course) {
    return (
      <FacultyLayout title="Course Not Found">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Course not found</h3>
            <p className="text-sm">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
          </div>
          <Button 
            onClick={() => router.push('/faculty/coursesavailable')}
            className="bg-white text-black hover:bg-gray-100"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Courses
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title={course.title ? `Editing: ${course.title}` : 'Edit Course'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/faculty/coursesavailable')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge 
              variant={course.isPublished ? "default" : "secondary"}
              className={course.isPublished ? "bg-green-600" : "bg-gray-600"}
            >
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
            <span className="text-gray-400 text-sm">
              Last updated: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : new Date(course.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save and Publish'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="details" className="data-[state=active]:bg-gray-800">Course Details</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-800">Content & Modules</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
              {/* Left Side - Scrollable Content */}
              <div className="lg:col-span-2 overflow-y-auto space-y-6 pr-0 lg:pr-4 max-h-[calc(100vh-200px)] custom-scrollbar">
                <style jsx>{`
                  .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(107, 114, 128, 0.3);
                    border-radius: 3px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(107, 114, 128, 0.5);
                  }
                  @media (max-width: 1024px) {
                    .custom-scrollbar {
                      max-height: none;
                      overflow-y: visible;
                    }
                  }
                `}</style>
                {/* Course Title and Description */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-300 text-lg font-semibold">Course Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white text-xl font-medium"
                        placeholder="Enter course title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-300 text-lg font-semibold">Course Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                        placeholder="Enter detailed course description"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Course Language and Level */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-gray-300 font-semibold flex items-center gap-2">
                          <Globe size={16} />
                          Course Language
                        </Label>
                        <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="level" className="text-gray-300 font-semibold flex items-center gap-2">
                          <Trophy size={16} />
                          Course Level
                        </Label>
                        <Select value={formData.level || 'beginner'} onValueChange={(value) => handleInputChange('level', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What You'll Learn */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-gray-300 text-lg font-semibold flex items-center gap-2">
                      <BookOpen size={16} />
                      What You&apos;ll Learn in This Course
                    </Label>
                    <div className="space-y-3">
                      {formData.whatYouWillLearn.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-1" />
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.whatYouWillLearn];
                              newItems[index] = e.target.value;
                              setFormData(prev => ({ ...prev, whatYouWillLearn: newItems }));
                            }}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="What will students learn?"
                          />
                          {formData.whatYouWillLearn.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.whatYouWillLearn.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, whatYouWillLearn: newItems }));
                              }}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, ''] }))}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Add Learning Point
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Requirements */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-gray-300 text-lg font-semibold">Course Requirements</Label>
                    <div className="space-y-3">
                      {formData.courseRequirements.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-400 flex-shrink-0 mt-1">•</span>
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.courseRequirements];
                              newItems[index] = e.target.value;
                              setFormData(prev => ({ ...prev, courseRequirements: newItems }));
                            }}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="What are the prerequisites?"
                          />
                          {formData.courseRequirements.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.courseRequirements.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, courseRequirements: newItems }));
                              }}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, courseRequirements: [...prev.courseRequirements, ''] }))}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Add Requirement
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* This Course Includes */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-gray-300 text-lg font-semibold">This Course Includes</Label>
                    <div className="space-y-3">
                      {formData.courseIncludes.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.courseIncludes];
                              newItems[index] = e.target.value;
                              setFormData(prev => ({ ...prev, courseIncludes: newItems }));
                            }}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="What&apos;s included in this course?"
                          />
                          {formData.courseIncludes.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.courseIncludes.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, courseIncludes: newItems }));
                              }}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, courseIncludes: [...prev.courseIncludes, ''] }))}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Add Feature
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Tags */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-gray-300 text-lg font-semibold flex items-center gap-2">
                      <Tag size={16} />
                      Course Tags
                    </Label>
                    <div className="space-y-3">
                      {formData.courseTags.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-blue-400 flex-shrink-0 mt-1">#</span>
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.courseTags];
                              newItems[index] = e.target.value;
                              setFormData(prev => ({ ...prev, courseTags: newItems }));
                            }}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Add a tag (e.g., programming, web development)"
                          />
                          {formData.courseTags.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.courseTags.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, courseTags: newItems }));
                              }}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, courseTags: [...prev.courseTags, ''] }))}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Add Tag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Fixed Thumbnail and Preview */}
              <div className="lg:col-span-1 space-y-6 order-first lg:order-last">
                <div className="lg:sticky lg:top-0 space-y-6">
                  {/* Course Thumbnail */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Course Thumbnail</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 mb-4">
                        {course.thumbnail?.asset?.url ? (
                          <Image
                            src={course.thumbnail.asset.url}
                            alt={course.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="thumbnail-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 mb-4"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        disabled={uploadingThumbnail}
                      >
                        {uploadingThumbnail ? 'Uploading...' : 'Change Thumbnail'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Course Preview Link */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Course Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="previewUrl" className="text-gray-300">Preview Video URL</Label>
                        <Input
                          id="previewUrl"
                          value={formData.previewUrl}
                          onChange={(e) => handleInputChange('previewUrl', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      {formData.previewUrl && (
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-600 text-blue-400 hover:bg-blue-900"
                          onClick={() => window.open(formData.previewUrl, '_blank')}
                        >
                          <Play size={16} className="mr-2" />
                          View Preview
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Navigation Button */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <Button 
                        onClick={() => setActiveTab('content')}
                        className="w-full bg-white text-black hover:bg-gray-100 text-lg py-3"
                      >
                        Next: Courses & Modules
                        <ChevronRight size={20} className="ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Content & Modules Tab */}
          <TabsContent value="content" className="space-y-6">
            <CourseContentManager courseSlug={slug} />
          </TabsContent>

        </Tabs>
      </div>
    </FacultyLayout>
  );
}