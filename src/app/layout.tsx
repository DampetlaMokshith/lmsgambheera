import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthNotificationProvider } from "@/components/providers/auth-notification-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const pesteTrial = localFont({
  src: "../../public/pestetrial-regular.otf",
  variable: "--font-peste-trial",
  weight: "400",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "THREADLMS - Advanced Learning Management System",
    template: "%s | THREADLMS"
  },
  description: "THREADLMS is a comprehensive learning management system designed for students and faculty. Track progress, access courses, earn certificates, and enhance your learning experience with advanced analytics and interactive features.",
  keywords: ["LMS", "Learning Management System", "Online Education", "E-Learning", "Course Management", "Student Portal", "Faculty Dashboard", "Education Platform", "THREADLMS", "Thread LMS"],
  authors: [{ name: "THREADLMS Team" }],
  creator: "THREADLMS",
  publisher: "THREADLMS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://lmsgambheera.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "THREADLMS - Advanced Learning Management System",
    description: "Comprehensive learning management system for students and faculty with progress tracking, interactive courses, and certificate generation.",
    siteName: "THREADLMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "THREADLMS - Learning Management System",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THREADLMS - Advanced Learning Management System",
    description: "Comprehensive learning management system for students and faculty with progress tracking and interactive courses.",
    images: ["/og-image.png"],
    creator: "@threadlms",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/threadlmslogofavi.png", type: "image/png" },
    ],
    apple: [
      { url: "/threadlmslogofavi.png", type: "image/png" },
    ],
    shortcut: "/threadlmslogofavi.png",
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${pesteTrial.variable} font-inter antialiased`}
      >
        <Script 
          src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"
          strategy="beforeInteractive"
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthNotificationProvider>
              {children}
              <Toaster richColors />
            </AuthNotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
