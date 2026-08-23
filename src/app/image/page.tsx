import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageStudioPage from '../dashboard/image/page';

export const metadata = {
  title: 'Tạo Ảnh AI Miễn Phí (Puter.js Engine) — Lemas.AI',
  description: 'Trình tạo ảnh nghệ thuật AI siêu thực, 3D render, anime, và concept art tốc độ cao sử dụng Puter.js AI và FLUX Router trên Lemas.AI.',
};

export default function PublicImageStudio() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImageStudioPage />
      </main>
      <Footer />
    </div>
  );
}
