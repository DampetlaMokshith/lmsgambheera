'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import FacultyLayout from '@/components/layout/faculty-layout';
import { Mail, MessageSquare, Send, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [userRole, setUserRole] = useState<'student' | 'faculty' | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }));

      // Check if faculty
      const { data: facultyProfile } = await supabase
        .from('faculty_profiles')
        .select('name, email')
        .eq('email', user.email)
        .single();

      if (facultyProfile) {
        setUserRole('faculty');
        setFormData(prev => ({
          ...prev,
          name: facultyProfile.name || ''
        }));
      } else {
        // Get student profile
        const { data: studentProfile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        setUserRole('student');
        setFormData(prev => ({
          ...prev,
          name: studentProfile?.full_name || ''
        }));
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    
    // Simulate sending (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData(prev => ({ ...prev, subject: '', message: '' }));
    setSending(false);
  };

  const content = (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
        <p className="text-gray-400">We&apos;re here to help and answer any questions you might have</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2 bg-accent border p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Send us a Message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What is your message about?"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="How can we help you?"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-accent border p-6">
            <h3 className="text-xl font-bold text-white mb-4">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-gray-400 text-sm">support@threadlms.com</p>
                  <p className="text-gray-400 text-sm">help@threadlms.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="text-white font-medium">Support Hours</p>
                  <p className="text-gray-400 text-sm">24/7 Available</p>
                  <p className="text-gray-400 text-sm">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="text-white font-medium">Location</p>
                  <p className="text-gray-400 text-sm">Available globally</p>
                  <p className="text-gray-400 text-sm">Online support worldwide</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent border p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Help</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                → FAQs
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                → Support Center
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                → Community Forum
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                → Video Tutorials
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return null;
  }

  return userRole === 'faculty' ? (
    <FacultyLayout title="Contact Us">
      {content}
    </FacultyLayout>
  ) : (
    <DashboardLayout title="Contact Us">
      {content}
    </DashboardLayout>
  );
}
