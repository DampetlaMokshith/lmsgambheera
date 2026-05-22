"use client";

// Simplified provider - notifications are now handled via API in the useNotifications hook
// This component is kept for backwards compatibility with the layout
export function AuthNotificationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}