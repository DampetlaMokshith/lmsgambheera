'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import FacultyLayout from '@/components/layout/faculty-layout';
import { Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [userRole, setUserRole] = useState<'student' | 'faculty' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if faculty
      const { data: facultyProfile } = await supabase
        .from('faculty_profiles')
        .select('email')
        .eq('email', user.email)
        .single();

      setUserRole(facultyProfile ? 'faculty' : 'student');
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const content = (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-accent border p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Introduction
          </h2>
          <p className="text-gray-300 leading-relaxed">
            THREADLMS (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our learning management system platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6" />
            Information We Collect
          </h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email address, and contact information</li>
                <li>Student registration number and academic details</li>
                <li>Profile information including avatar and preferences</li>
                <li>Course enrollment and progress data</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Usage Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Learning activity and course interaction data</li>
                <li>Quiz attempts and assignment submissions</li>
                <li>Time spent on lectures and modules</li>
                <li>Discussion forum posts and comments</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6" />
            How We Use Your Information
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            We use the collected information for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
            <li>To provide and maintain our educational services</li>
            <li>To personalize your learning experience</li>
            <li>To track your progress and generate certificates</li>
            <li>To communicate course updates and announcements</li>
            <li>To improve our platform and develop new features</li>
            <li>To ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Data Security
          </h2>
          <p className="text-gray-300 leading-relaxed">
            We implement industry-standard security measures to protect your personal information. This includes encryption of data in transit and at rest, secure authentication methods, regular security audits, and restricted access to personal data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Your Rights
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Request data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-black border border-gray-800">
            <p className="text-white">Email: privacy@threadlms.com</p>
            <p className="text-white">Support: support@threadlms.com</p>
          </div>
        </section>
      </div>
    </div>
  );

  if (loading) {
    return null;
  }

  return userRole === 'faculty' ? (
    <FacultyLayout title="Privacy Policy">
      {content}
    </FacultyLayout>
  ) : (
    <DashboardLayout title="Privacy Policy">
      {content}
    </DashboardLayout>
  );
}
