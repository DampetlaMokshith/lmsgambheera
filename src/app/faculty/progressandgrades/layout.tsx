import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progress & Grades',
  description: 'Track your students progress, quiz performance, and grades across all your courses. View detailed analytics, quiz badges, and certificate status.',
};

export default function ProgressAndGradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
