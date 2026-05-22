'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import FacultyLayout from '@/components/layout/faculty-layout';
import { FileText, CheckCircle, AlertCircle, Scale, UserX, Shield } from 'lucide-react';

export default function TermsConditionsPage() {
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
        <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-4">Terms & Conditions</h1>
        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-accent border p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Acceptance of Terms
          </h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing and using THREADLMS, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms and Conditions, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserX className="w-6 h-6" />
            User Responsibilities
          </h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">For Students:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the platform for legitimate educational purposes only</li>
                <li>Respect intellectual property rights of course materials</li>
                <li>Engage respectfully in discussions and forums</li>
                <li>Complete quizzes and assignments honestly without plagiarism</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">For Faculty:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and maintain high-quality course content</li>
                <li>Ensure course materials do not infringe copyrights</li>
                <li>Provide timely feedback and support to students</li>
                <li>Maintain professional conduct in all interactions</li>
                <li>Protect student privacy and data</li>
                <li>Update course content to maintain accuracy and relevance</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Scale className="w-6 h-6" />
            Intellectual Property
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            All content on THREADLMS, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300 mb-4">
            <li>Course materials, videos, and lectures</li>
            <li>Quizzes, assignments, and assessments</li>
            <li>Platform design and user interface</li>
            <li>Software, code, and algorithms</li>
            <li>Logos, trademarks, and branding</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            are the property of THREADLMS or its content creators and are protected by copyright and intellectual property laws. Users may not reproduce, distribute, or create derivative works without explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Prohibited Activities
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The following activities are strictly prohibited:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
            <li>Sharing account credentials with others</li>
            <li>Attempting to hack, disrupt, or damage the platform</li>
            <li>Uploading malicious code or viruses</li>
            <li>Harassing, threatening, or abusing other users</li>
            <li>Sharing or selling course content without authorization</li>
            <li>Using automated bots or scrapers</li>
            <li>Submitting false or misleading information</li>
            <li>Engaging in academic dishonesty or cheating</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Limitation of Liability
          </h2>
          <p className="text-gray-300 leading-relaxed">
            THREADLMS is provided &quot;as is&quot; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform. This includes but is not limited to loss of data, interruption of service, or any errors in course content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to suspend or terminate your account if you violate these Terms and Conditions. Upon termination, your right to access the platform will immediately cease. You may also terminate your account at any time by contacting our support team.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Your continued use of the platform after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-black border border-gray-800">
            <p className="text-white">Email: legal@threadlms.com</p>
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
    <FacultyLayout title="Terms & Conditions">
      {content}
    </FacultyLayout>
  ) : (
    <DashboardLayout title="Terms & Conditions">
      {content}
    </DashboardLayout>
  );
}
