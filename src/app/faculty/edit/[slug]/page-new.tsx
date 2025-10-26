'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FacultyLayout from '@/components/layout/faculty-layout';
import { supabase } from '@/lib/supabase';
import { client } from '@/sanity/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, Users, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  thumbnail?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  duration?: string;
  level: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  faculty: {
    _id: string;
    name: string;
    email: string;
  };
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: '',
    duration: '',
    isPublished: false
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
        const courseData = await client.fetch(
          `*[_type == "course" && slug.current == $slug && faculty->email == $email][0] {
            _id,
            title,
            slug,
            description,
            thumbnail {
              asset -> {
                _id,
                url
              }
            },
            duration,
            level,
            isPublished,
            createdAt,
            updatedAt,
            faculty -> {
              _id,
              name,
              email
            },
            modules[] -> {
              _id,
              title,
              description,
              lectures[] -> {
                _id,
                title,
                videoUrl,
                duration
              }
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
        setCourse(courseData);
        setFormData({
          title: courseData.title || '',
          description: courseData.description || '',
          level: courseData.level || '',
          duration: courseData.duration || '',
          isPublished: courseData.isPublished || false
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
        duration: formData.duration,
        isPublished: formData.isPublished,
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
      
      // Update local state with real-time timestamp
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
    <FacultyLayout title="">
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
              Last updated: {course.updatedAt ? new Date(course.updatedAt).toLocaleString() : new Date(course.createdAt).toLocaleString()}
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

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="details" className="data-[state=active]:bg-gray-800">Course Details</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-800">Content & Modules</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-800">Analytics</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-screen max-h-[calc(100vh-200px)]">
              {/* Left Side - Scrollable Content */}
              <div className="lg:col-span-8 overflow-y-auto pr-4 space-y-6">
                {/* Course Title and Description */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-white text-lg font-semibold">Course Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white text-lg"
                          placeholder="Enter course title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-white text-lg font-semibold">Course Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                          placeholder="Enter detailed course description"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Language and Level */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white text-lg font-semibold">Course Language</Label>
                        <Select value="English" onValueChange={() => {}}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="level" className="text-white text-lg font-semibold">Course Level</Label>
                        <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What You Will Learn */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-semibold">What You Will Learn</Label>
                      <p className="text-gray-400 text-sm mb-4">Key learning outcomes for students</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="grid grid-cols-2 gap-2 text-gray-400 mt-1">
                            <span className="text-xs">⋮⋮</span>
                          </div>
                          <input 
                            type="text" 
                            className="flex-1 bg-transparent text-white placeholder-gray-500 border-none outline-none"
                            placeholder="Signal Representation & Classification: Understand how to mathematically represent signals"
                            defaultValue="Signal Representation & Classification: Understand how to mathematically represent signals"
                          />
                        </div>
                        
                        <div className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="grid grid-cols-2 gap-2 text-gray-400 mt-1">
                            <span className="text-xs">⋮⋮</span>
                          </div>
                          <input 
                            type="text" 
                            className="flex-1 bg-transparent text-white placeholder-gray-500 border-none outline-none"
                            placeholder="System Properties & Characterization: Analyze the fundamental properties"
                            defaultValue="System Properties & Characterization: Analyze the fundamental properties"
                          />
                        </div>
                        
                        <div className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="grid grid-cols-2 gap-2 text-gray-400 mt-1">
                            <span className="text-xs">⋮⋮</span>
                          </div>
                          <input 
                            type="text" 
                            className="flex-1 bg-transparent text-white placeholder-gray-500 border-none outline-none"
                            placeholder="Time-Domain Analysis: Master convolution for both continuous and discrete"
                            defaultValue="Time-Domain Analysis: Master convolution for both continuous and discrete"
                          />
                        </div>
                      </div>
                      
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full">
                        + Add item
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Requirements */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-semibold">Course Requirements</Label>
                      <p className="text-gray-400 text-sm mb-4">Prerequisites and requirements for the course</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="grid grid-cols-2 gap-2 text-gray-400 mt-1">
                            <span className="text-xs">⋮⋮</span>
                          </div>
                          <input 
                            type="text" 
                            className="flex-1 bg-transparent text-white placeholder-gray-500 border-none outline-none"
                            placeholder="None! All you need is a computer and a desire to learn. ✨"
                            defaultValue="None! All you need is a computer and a desire to learn. ✨"
                          />
                        </div>
                      </div>
                      
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full">
                        + Add item
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* This Course Includes */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-semibold">This Course Includes</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock size={16} />
                          <span>{formData.duration || 'Duration not set'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Users size={16} />
                          <span>Lifetime access</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar size={16} />
                          <span>Certificate of completion</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Save size={16} />
                          <span>Downloadable resources</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Tags */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-semibold">Course Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">Signal Processing</Badge>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">Systems Theory</Badge>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">IoT</Badge>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">Embedded Systems</Badge>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">Engineering</Badge>
                      </div>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                        + Add Tag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Fixed Content */}
              <div className="lg:col-span-4 space-y-6">
                {/* Course Thumbnail */}
                <Card className="bg-gray-900 border-gray-800 sticky top-0">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 mb-4">
                      Change Thumbnail
                    </Button>
                    
                    {/* Course Preview Link */}
                    <Button 
                      variant="default" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.open(`/courses/${course.slug.current}`, '_blank')}
                    >
                      Course Preview Link
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content & Modules Tab */}
          <TabsContent value="content">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Module and lecture management coming soon...</p>
                  <p className="text-gray-500 text-sm">
                    You&apos;ll be able to add, edit, and organize course modules and lectures here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Course Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Analytics dashboard coming soon...</p>
                  <p className="text-gray-500 text-sm">
                    View student engagement, completion rates, and other course metrics here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}