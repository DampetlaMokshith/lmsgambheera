import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthNotificationProvider } from "@/components/providers/auth-notification-provider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pesteTrial = localFont({
  src: "../../public/pest regular.otf",
  variable: "--font-peste-trial",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LMS Gambheera - Learning Management System",
  description: "Advanced Learning Management System for Students and Faculty",
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
          <AuthNotificationProvider>
            {children}
            <Toaster richColors />
          </AuthNotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
