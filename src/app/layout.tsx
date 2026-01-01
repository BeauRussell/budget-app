import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { MobileMenuButton } from "@/components/layout/mobile-menu-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Track your budget and net worth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="sticky top-0 z-30 bg-background border-b p-4 md:hidden">
                <MobileMenuButton />
              </div>
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
