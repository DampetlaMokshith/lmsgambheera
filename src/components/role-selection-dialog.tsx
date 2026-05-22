'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Sparkles } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState('');

  const handleStudentClick = async () => {
    setIsLoading('student');
    localStorage.setItem('attemptedRole', 'student');
    router.push('/auth');
  };

  const handleFacultyClick = async () => {
    setIsLoading('faculty');
    localStorage.setItem('attemptedRole', 'faculty');
    router.push('/faculty/auth');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the dialog - user must choose a role
      if (newOpen === false) {
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent 
        className="sm:max-w-lg bg-gradient-to-br from-black via-gray-900 to-black border-2 border-gray-700 shadow-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          {/* Logo with glow effect */}
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 blur-3xl" />
            <div className="relative w-24 h-24 flex items-center justify-center overflow-hidden">
              <Image
                src="/threadlmslogofavi.png"
                alt="THREADLMS Logo"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* Title with gradient */}
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mb-2">
            WELCOME TO THREADLMS
          </DialogTitle>
          
          {/* Subtitle with icon */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <DialogDescription className="text-center text-base">
              Choose your role to begin your journey
            </DialogDescription>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6 px-2">
          {/* Student Button with enhanced design */}
          <Button
            onClick={handleStudentClick}
            disabled={isLoading !== ''}
            className="group w-full h-16 bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-white text-black font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden border-2 cursor-pointer border-gray-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-3">
              <div className="p-2 bg-black/10">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span>{isLoading === 'student' ? 'Loading...' : 'I am a Student'}</span>
            </div>
          </Button>

          {/* Faculty Button with enhanced design */}
          <Button
            onClick={handleFacultyClick}
            disabled={isLoading !== ''}
            className="group w-full h-16 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500 text-white font-bold text-lg border-2 border-emerald-500/50 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-3">
              <div className="p-2 bg-white/10">
                <Users className="h-6 w-6" />
              </div>
              <span>{isLoading === 'faculty' ? 'Loading...' : 'I am Faculty'}</span>
            </div>
          </Button>

        
        </div>
      </DialogContent>
    </Dialog>
  );
}
