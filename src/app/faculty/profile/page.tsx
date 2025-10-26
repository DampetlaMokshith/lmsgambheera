'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FacultyLayout from '@/components/layout/faculty-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { client, writeClient } from '@/sanity/lib/client';
import { toast } from 'sonner';

interface Faculty {
  _id: string;
  name: string;
  email: string;
  profession?: string;
  about?: string;
  skilledAt?: string[];
  college?: string;
  department?: string;
  gender?: string;
  profileImage?: {
    asset: {
      _ref: string;
      url?: string;
    };
  };
}

export default function FacultyProfilePage() {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Faculty | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFacultyProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/faculty/auth');
          return;
        }

        const facultyData = await client.fetch(
          `*[_type == "faculty" && email == $email][0]{
            _id,
            name,
            email,
            profession,
            about,
            skilledAt,
            college,
            department,
            gender,
            profileImage {
              asset -> {
                _ref,
                url
              }
            }
          }`,
          { email: session.user.email }
        );

        if (facultyData) {
          setFaculty(facultyData);
          setEditForm(facultyData);
        } else {
          toast.error('Faculty profile not found');
        }
      } catch (error) {
        console.error('Error fetching faculty profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyProfile();
  }, [router]);

  const handleSave = async () => {
    if (!editForm || !faculty) {
      console.log('❌ Missing editForm or faculty data');
      toast.error('Missing profile data');
      return;
    }
    
    setSaving(true);

    // Create the update payload outside try block so it's available in catch
    const updateData = {
      name: editForm.name?.trim() || '',
      profession: editForm.profession?.trim() || '',
      about: editForm.about?.trim() || '',
      skilledAt: Array.isArray(editForm.skilledAt) ? editForm.skilledAt : [],
      college: editForm.college?.trim() || '',
      department: editForm.department?.trim() || '',
      gender: editForm.gender?.trim() || '',
    };

    try {
      console.log('🔄 Updating faculty profile...', {
        id: faculty._id,
        email: faculty.email,
        changes: editForm
      });

      console.log('📝 Update payload:', updateData);

      // Test writeClient configuration first
      console.log('🔧 Testing writeClient configuration...');
      try {
        const testFetch = await writeClient.fetch('*[_type == "faculty"][0]');
        console.log('✅ WriteClient can read data:', testFetch?._id);
      } catch (testError) {
        console.warn('⚠️ WriteClient read test failed:', testError);
      }

      // Validate faculty ID format
      console.log('🔍 Validating faculty document...', {
        facultyId: faculty._id,
        facultyType: typeof faculty._id,
        facultyEmail: faculty.email
      });

      // Check if document exists
      try {
        const existingDoc = await writeClient.getDocument(faculty._id);
        console.log('✅ Faculty document found:', existingDoc?._id);
      } catch (docError) {
        console.error('❌ Document not found or access denied:', docError);
        throw new Error(`Faculty document not accessible: ${faculty._id}`);
      }

      // Direct client update with better error handling
      console.log('🔄 Attempting Sanity writeClient patch...');
      
      let updatedFaculty;
      try {
        updatedFaculty = await writeClient
          .patch(faculty._id)
          .set(updateData)
          .commit();
      } catch (sanityError) {
        console.error('❌ Sanity patch error details:', {
          sanityError,
          errorType: typeof sanityError,
          errorConstructor: sanityError?.constructor?.name,
          errorMessage: sanityError instanceof Error ? sanityError.message : 'No message',
          errorToString: String(sanityError),
          hasMessage: sanityError && typeof sanityError === 'object' && 'message' in sanityError,
          hasStack: sanityError && typeof sanityError === 'object' && 'stack' in sanityError,
          errorKeys: Object.keys(sanityError || {}),
          errorProps: Object.getOwnPropertyNames(sanityError || {})
        });
        throw sanityError; // Re-throw to be caught by outer catch
      }

      console.log('✅ Faculty profile updated successfully:', updatedFaculty);
      
      // Update local state
      const newFacultyData = { ...faculty, ...updatedFaculty };
      setFaculty(newFacultyData);
      setEditForm(newFacultyData);
      setIsEditing(false);
      toast.success('Profile updated successfully! 🎉');

    } catch (error) {
      console.error('❌ Detailed error updating faculty profile:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        facultyId: faculty._id,
        updateData: editForm,
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });

      // Try fallback API approach
      try {
        console.log('🔄 Trying fallback API approach...');
        const response = await fetch('/api/test-sanity-write', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            facultyId: faculty._id,
            updates: updateData
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Faculty profile updated via API fallback:', result);
          
          // Update local state
          const newFacultyData = { ...faculty, ...updateData };
          setFaculty(newFacultyData);
          setEditForm(newFacultyData);
          setIsEditing(false);
          toast.success('Profile updated successfully! 🎉');
          return;
        }
      } catch (apiError) {
        console.error('❌ API fallback also failed:', apiError);
      }
      
      // Show user-friendly error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Request error') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        toast.error('Permission denied. Please contact administrator.');
      } else if (errorMessage.includes('Not found') || errorMessage.includes('404')) {
        toast.error('Faculty profile not found. Please refresh the page.');
      } else if (errorMessage.includes('token')) {
        toast.error('Authentication error. Please try logging out and back in.');
      } else {
        toast.error(`Update failed: ${errorMessage || 'Unknown error occurred'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(faculty);
    setIsEditing(false);
  };

  const handleSkillChange = (skills: string) => {
    if (!editForm) return;
    const skillArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setEditForm({ ...editForm, skilledAt: skillArray });
  };

  const getProfileImage = () => {
    if (faculty?.profileImage?.asset?.url) {
      return faculty.profileImage.asset.url;
    }
    return null;
  };

  const getInitials = () => {
    if (faculty?.name) {
      return faculty.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'F';
  };

  if (loading) {
    return (
      <FacultyLayout title="Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white">Loading profile...</div>
        </div>
      </FacultyLayout>
    );
  }

  if (!faculty) {
    return (
      <FacultyLayout title="Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-white mb-4">Profile not found</div>
            <Button onClick={() => router.push('/faculty/coursesavailable')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={getProfileImage() || undefined} alt={faculty.name} />
                  <AvatarFallback className="text-2xl bg-gray-800 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-4 right-0 bg-white text-black p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Upload size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Details Section */}
            <div className="flex-1 space-y-6">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{faculty.name}</h1>
                  <p className="text-gray-400">{faculty.email}</p>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editForm?.name || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                      {faculty.name}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                    {faculty.email}
                  </p>
                </div>

                {/* Profession */}
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-white">Profession</Label>
                  {isEditing ? (
                    <Input
                      id="profession"
                      value={editForm?.profession || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, profession: e.target.value } : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Professor, Lecturer"
                    />
                  ) : (
                    <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                      {faculty.profession || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* College */}
                <div className="space-y-2">
                  <Label htmlFor="college" className="text-white">College</Label>
                  {isEditing ? (
                    <Input
                      id="college"
                      value={editForm?.college || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, college: e.target.value } : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Engineering College"
                    />
                  ) : (
                    <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                      {faculty.college || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-white">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={editForm?.department || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, department: e.target.value } : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                      {faculty.department || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-white">Gender</Label>
                  {isEditing ? (
                    <Select
                      value={editForm?.gender || ''}
                      onValueChange={(value) => setEditForm(prev => prev ? { ...prev, gender: value } : null)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="male" className="text-white">Male</SelectItem>
                        <SelectItem value="female" className="text-white">Female</SelectItem>
                        <SelectItem value="other" className="text-white">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say" className="text-white">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                      {faculty.gender ? faculty.gender.charAt(0).toUpperCase() + faculty.gender.slice(1) : 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-white">Skilled At</Label>
                {isEditing ? (
                  <Input
                    id="skills"
                    value={editForm?.skilledAt?.join(', ') || ''}
                    onChange={(e) => handleSkillChange(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g., JavaScript, Python, React (comma-separated)"
                  />
                ) : (
                  <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    {faculty.skilledAt && faculty.skilledAt.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {faculty.skilledAt.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-white text-sm rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-300">No skills specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* About */}
              <div className="space-y-2">
                <Label htmlFor="about" className="text-white">About</Label>
                {isEditing ? (
                  <Textarea
                    id="about"
                    value={editForm?.about || ''}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, about: e.target.value } : null)}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-300 bg-gray-800 p-2 rounded border border-gray-700 min-h-[100px]">
                    {faculty.about || 'No description available'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
