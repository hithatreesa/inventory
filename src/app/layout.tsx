import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LayoutProvider } from "@/lib/context/LayoutContext"
import { DataProvider } from "@/lib/context/DataContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SidebarDependentLayout } from "@/components/layout/SidebarDependentLayout";
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
      <body className="min-h-full flex flex-col bg-background selection:bg-primary/10 selection:text-primary">
        <LayoutProvider>
          <DataProvider>
            <Toaster position="top-right" expand={true} richColors closeButton />
            <Sidebar />
            <Navbar />
            <SidebarDependentLayout>
              {children}
            </SidebarDependentLayout>
          </DataProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}

