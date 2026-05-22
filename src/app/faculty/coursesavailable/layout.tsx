import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses Available',
  description: 'View and manage all your published courses. Track enrollment counts, edit course content, and create new courses for your students.',
};

export default function CoursesAvailableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
