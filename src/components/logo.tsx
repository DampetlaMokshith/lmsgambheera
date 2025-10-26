import { GraduationCapIcon } from 'lucide-react';

export function LogoIcon() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white">
        <GraduationCapIcon className="size-6 text-black" />
      </div>
      <p className="text-2xl font-bold text-white">
        LMS Gambheera
      </p>
    </div>
  );
}