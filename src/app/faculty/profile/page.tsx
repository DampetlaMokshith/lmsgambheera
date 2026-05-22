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
import { Edit, Save, X, Upload, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { client } from '@/sanity/lib/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const router = useRouter();

  const handleAddSkill = () => {
    if (!newSkill.trim() || !editForm) return;
    const updatedSkills = [...(editForm.skilledAt || []), newSkill.trim()];
    setEditForm({ ...editForm, skilledAt: updatedSkills });
    setNewSkill('');
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    if (!editForm) return;
    const updatedSkills = editForm.skilledAt?.filter((_, index) => index !== indexToRemove) || [];
    setEditForm({ ...editForm, skilledAt: updatedSkills });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

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
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyProfile();
  }, [router]);

  const handleSave = async () => {
    if (!editForm || !faculty) {
toast.error('Missing profile data');
      return;
    }
    
    setSaving(true);

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
      // Use API route for server-side update with proper permissions
      const response = await fetch('/api/faculty/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facultyId: faculty._id,
          updates: updateData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
// Update local state - preserve profileImage from current state
      const newFacultyData = { 
        ...faculty, 
        ...result.data,
        // Keep the existing profileImage as API doesn't return it
        profileImage: faculty.profileImage 
      };
      setFaculty(newFacultyData);
      setEditForm(newFacultyData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');

    } catch (error) {
const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(faculty);
    setIsEditing(false);
    setNewSkill('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !faculty) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('facultyId', faculty._id);

      // Upload via API route
      const response = await fetch('/api/faculty/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
// Update local state with new image URL
      setFaculty({
        ...faculty,
        profileImage: {
          asset: {
            _ref: result.imageRef,
            url: result.imageUrl,
          },
        },
      });

      if (editForm) {
        setEditForm({
          ...editForm,
          profileImage: {
            asset: {
              _ref: result.imageRef,
              url: result.imageUrl,
            },
          },
        });
      }

      toast.success('Profile image updated successfully!');
    } catch (error) {
const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
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
              Go to home
            </Button>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black border p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="w-28 h-28 md:w-32 md:h-32 mb-4">
                  <AvatarImage src={getProfileImage() || undefined} alt={faculty.name} />
                  <AvatarFallback className="text-2xl bg-accent text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label htmlFor="profile-image-upload" className="absolute bottom-4 right-0 bg-white text-black p-2 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Upload size={16} />
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Profile Details Section */}
            <div className="flex-1 space-y-6">
              {/* Header with Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">{faculty.name}</h1>
                  <p className="text-gray-400 text-sm md:text-base">{faculty.email}</p>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="bg-accent border-gray-700 text-white hover:bg-accent/80 w-full sm:w-auto"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-white text-black hover:bg-gray-100 flex-1 sm:flex-none"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="bg-accent border-gray-700 text-white hover:bg-accent/80 flex-1 sm:flex-none"
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
                      className="bg-accent border-gray-700 text-white focus:ring-2 focus:ring-white"
                    />
                  ) : (
                    <p className="text-white bg-accent p-2 border border-gray-700">
                      {faculty.name}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <p className="text-white bg-accent p-2 border border-gray-700">
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
                      className="bg-accent border-gray-700 text-white focus:ring-2 focus:ring-white"
                      placeholder="e.g., Professor, Lecturer"
                    />
                  ) : (
                    <p className="text-white bg-accent p-2 border border-gray-700">
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
                      className="bg-accent border-gray-700 text-white focus:ring-2 focus:ring-white"
                      placeholder="e.g., Engineering College"
                    />
                  ) : (
                    <p className="text-white bg-accent p-2 border border-gray-700">
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
                      className="bg-accent border-gray-700 text-white focus:ring-2 focus:ring-white"
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <p className="text-white bg-accent p-2 border border-gray-700">
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
                      <SelectTrigger className="bg-black border-gray-700 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-accent border-gray-700">
                        <SelectItem value="male" className="text-white">Male</SelectItem>
                        <SelectItem value="female" className="text-white">Female</SelectItem>
                        <SelectItem value="other" className="text-white">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say" className="text-white">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white bg-accent p-2 border border-gray-700">
                      {faculty.gender ? faculty.gender.charAt(0).toUpperCase() + faculty.gender.slice(1) : 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-white">Skilled At</Label>
                {isEditing ? (
                  <div className="bg-black border border-gray-700 p-3 space-y-3">
                    {/* Current Skills as Tags */}
                    <div className="flex flex-wrap gap-2">
                      {editForm?.skilledAt && editForm.skilledAt.length > 0 ? (
                        editForm.skilledAt.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-black text-white border-gray-600 hover:bg-black pr-1 flex items-center gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(index)}
                              className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No skills added yet</span>
                      )}
                    </div>
                    {/* Add New Skill Input */}
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        className="bg-black border-gray-700 text-white focus:ring-2 focus:ring-white flex-1"
                        placeholder="Type a skill and press Enter or click Add"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSkill}
                        size="sm"
                        variant="outline"
                        className="bg-white text-white hover:bg-gray-200 border-gray-600"
                      >
                        <Plus size={16} className="mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-accent p-2 border border-gray-700">
                    {faculty.skilledAt && faculty.skilledAt.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {faculty.skilledAt.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-black text-white text-sm border border-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No skills specified</p>
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
                    className="bg-accent border-gray-700 text-white min-h-[100px] focus:ring-2 focus:ring-white"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-white bg-accent p-2 border border-gray-700 min-h-[100px]">
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
