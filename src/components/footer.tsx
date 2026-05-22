'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

export function Footer() {
  const [userRole, setUserRole] = useState<'student' | 'faculty' | null>(null);
  const pathname = usePathname();

  // Determine if we're on a faculty page based on the URL
  const isFacultyPage = pathname?.startsWith('/faculty');

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // If on faculty page, assume faculty role
        if (isFacultyPage) {
          setUserRole('faculty');
        } else {
          // Check the users table for role
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          setUserRole(userData?.role === 'faculty' ? 'faculty' : 'student');
        }
      } catch {
        // Silent error handling
      }
    }

    checkUserRole();
  }, [isFacultyPage]);

  if (!userRole) {
    return (
      <footer className="bg-black mt-16">
       
      </footer>
    );
  }

  return (
    <footer className="relative bg-black mt-auto pt-16">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className={`grid gap-8 md:gap-12 ${
          userRole === 'faculty' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {userRole === 'student' ? (
                <>
                  <li>
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="text-gray-400 hover:text-white transition-colors">
                      Browse Courses
                    </Link>
                  </li>
                  <li>
                    <Link href="/certificates" className="text-gray-400 hover:text-white transition-colors">
                      My Certificates & Badges
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/ide" className="text-gray-400 hover:text-white transition-colors">
                      IDE
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/faculty/coursesavailable" className="text-gray-400 hover:text-white transition-colors">
                      Courses Available
                    </Link>
                  </li>
                  <li>
                    <Link href="/faculty/creatingnewcourse" className="text-gray-400 hover:text-white transition-colors">
                      Create New Course
                    </Link>
                  </li>
                  <li>
                    <Link href="/faculty/progressandgrades" className="text-gray-400 hover:text-white transition-colors">
                      Progress & Grades
                    </Link>
                  </li>
                  <li>
                    <Link href="/faculty/profile" className="text-gray-400 hover:text-white transition-colors">
                      Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Courses - only for students */}
          {userRole === 'student' && (
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">
                Courses
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/courses?degree=btech&department=cse" className="text-gray-400 hover:text-white transition-colors">
                    Computer Science
                  </Link>
                </li>
                <li>
                  <Link href="/courses?degree=btech&department=ece" className="text-gray-400 hover:text-white transition-colors">
                    Electronics
                  </Link>
                </li>
                <li>
                  <Link href="/courses?degree=btech&department=mech" className="text-gray-400 hover:text-white transition-colors">
                    Mechanical
                  </Link>
                </li>
                <li>
                  <Link href="/courses?degree=btech&department=civil" className="text-gray-400 hover:text-white transition-colors">
                    Civil Engineering
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="mailto:support@threadlms.com" className="text-gray-400 hover:text-white transition-colors">
                  support@threadlms.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Large THREADLMS Text Below Footer */}
      <section className="relative w-full overflow-hidden text-center text-accent flex items-center justify-center mx-auto pointer-events-none">
        <h1 className="text-[4.5rem] tracking-tighter sm:text-[10rem] md:text-[12rem] lg:text-[18rem] leading-none font-bold duration-200 -mb-[2%] sm:-mb-[3%] ease-in-out drop-shadow-xl whitespace-nowrap opacity-50">
          ThreadLMS
        </h1>
        <p className="absolute bottom-3 right-[5%] transform -translate-y-1/2 text-xs sm:text-sm pointer-events-auto">
          <AnimatedShinyText shimmerWidth={100} className="inline-flex items-center justify-center">
            built with ❤️ by <span className="text-white font-semibold ml-1">ThreadDev</span>
          </AnimatedShinyText>
        </p>
        <div className="bg-gradient-to-b from-transparent via-accent to-accent h-[1%] w-full absolute bottom-0 left-0 z-20"></div>
      </section>
    </footer>
  );
}
