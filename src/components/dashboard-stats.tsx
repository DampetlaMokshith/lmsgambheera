'use client';

import Image from 'next/image';

interface DashboardStatsProps {
  className?: string;
}

export default function DashboardStats({ className = '' }: DashboardStatsProps) {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* First Row - Two blocks side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Assignment Submitted Block */}
        <div className="bg-black border rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Assignment Submitted
          </h3>
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className=" opacity-15">
              <Image
                src="/no_data.svg"
                alt="No data"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
            </div>
            <p className="text-gray-400 text-sm opacity-50 sm:text-base text-center">
              No data found
            </p>
          </div>
        </div>

        {/* Quizzes Attempted Block */}
        <div className="bg-black border rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Quizzes Attempted
          </h3>
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <div className="opacity-15">
              <Image
                src="/no_data.svg"
                alt="No data"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
            </div>
            <p className="text-gray-400 opacity-50 text-sm sm:text-base text-center">
              No data found
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}