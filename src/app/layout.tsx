import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LayoutProvider } from "@/lib/context/LayoutContext"
import { DataProvider } from "@/lib/context/DataContext";
import React, { Suspense } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SidebarDependentLayout } from "@/components/layout/SidebarDependentLayout";
import { GlobalScanner } from "@/components/shared/GlobalScanner";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Executive - ERP Prototype",
  description: "A high-fidelity ERP frontend prototype built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <body className="h-[100dvh] overflow-x-hidden flex flex-col bg-gray-50 selection:bg-primary/10 selection:text-primary max-w-full">
        <LayoutProvider>
          <DataProvider>
            <GlobalScanner />
            <GlobalSearch />
            <Toaster position="top-right" expand={true} richColors closeButton />
            <Sidebar />
            <Suspense fallback={<div className="h-20 bg-white/80 border-b border-border-main fixed top-0 left-0 right-0 z-40 animate-pulse" />}>
              <Navbar />
            </Suspense>
            <SidebarDependentLayout>
              {children}
            </SidebarDependentLayout>
          </DataProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}

