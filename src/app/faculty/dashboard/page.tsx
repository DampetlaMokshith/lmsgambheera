'use client';

import FacultyLayout from '@/components/layout/faculty-layout';

export default function FacultyDashboardPage() {
  return (
    <FacultyLayout title="Faculty Dashboard">
      <div className="space-y-6">
        <div className="text-white">
          <p>Welcome to the Faculty Dashboard!</p>
          <p>From here you can manage courses, view progress, and create new content.</p>
        </div>
      </div>
    </FacultyLayout>
  );
}