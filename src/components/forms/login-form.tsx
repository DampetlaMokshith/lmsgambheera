'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Request additional scopes to get profile information
          scopes: 'email profile',
        }
      });
      
      if (error) {
        console.error('Error with Google OAuth:', error.message);
        alert('Error signing in with Google');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      alert('Something went wrong with Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Check if email has faculty domain (not allowed for students)
    const facultyDomains = ['@faculty.cse', '@faculty.ece', '@faculty.mech', '@faculty.civil'];
    const isFacultyEmail = facultyDomains.some(domain => email.toLowerCase().includes(domain));
    
    if (isFacultyEmail) {
      toast.error('Invalid credentials', {
        style: {
          backgroundColor: 'white',
          color: 'black',
        },
        position: 'bottom-left',
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        alert(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex bg-black px-4 py-4 lg:min-h-screen lg:py-16 md:py-32">
      <form
        onSubmit={handleEmailAuth}
        className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border border-white/10 p-0.5 shadow-md"
        noValidate
      >
        <div className="p-8 pb-6">
          <div>
            <h1 className="mb-1 mt-4 text-xl font-semibold text-white">Sign In to LMS Gambheera</h1>
            <p className="text-sm text-gray-400">Welcome back! Sign in to continue</p>
          </div>

          <div className="mt-6 grid ">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285f4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                />
                <path
                  fill="#34a853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                />
                <path
                  fill="#fbbc05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                />
                <path
                  fill="#eb4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                />
              </svg>
              <span>Google</span>
            </Button>
            
          </div>

          <hr className="my-4 border-dashed border-white/20" />

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm text-white">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border-white/20 text-white placeholder:text-gray-500 focus:ring-white focus:border-white"
                placeholder="Enter your email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                inputMode="email"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-sm text-white">
                  Password
                </Label>
                
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  name="pwd"
                  id="pwd"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black border-white/20 text-white placeholder:text-gray-500 focus:ring-white focus:border-white pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </div>

        <div className="bg-white/5 rounded-b-[calc(var(--radius)+.125rem)] border border-white/10 p-3">
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?
            <Button
              type="button"
              variant="link"
              className="px-2 text-white hover:text-gray-300"
              onClick={onToggleMode}
            >
              Create account
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}