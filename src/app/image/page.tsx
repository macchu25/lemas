'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DashboardProvider } from '@/components/dashboard/DashboardContext';
import ImageStudioPage from '../dashboard/image/page';

export default function PublicImageStudio() {
  return (
    <DashboardProvider>
      <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100">
        <Navbar />
        <main className="flex-1 w-full mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <ImageStudioPage />
        </main>
        <Footer />
      </div>
    </DashboardProvider>
  );
}
