'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';

export default function CertificatesPage() {
  return (
    <DashboardLayout title="Certificates & Badges">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 md:p-8 text-center">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Certificates & Badges</h3>
        <p className="text-gray-400">Certificates and badges content will be implemented here</p>
      </div>
    </DashboardLayout>
  );
}