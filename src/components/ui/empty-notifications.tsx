"use client";

import { Bell } from "lucide-react";

interface EmptyNotificationsProps {
  className?: string;
}

export function EmptyNotifications({ className = "" }: EmptyNotificationsProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        You&apos;re all caught up! We&apos;ll notify you when something new happens.
      </p>
    </div>
  );
}