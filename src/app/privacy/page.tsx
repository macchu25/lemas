'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại trang chủ Lemas.AI</span>
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-white/10 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-300">
            <ShieldCheck className="size-3.5" />
            <span>Chính Sách Bảo Mật & Quyền Riêng Tư</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy (Chính Sách Bảo Mật)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Bản quyền thuộc về MacchuStudio — Cập nhật lần cuối: 23/08/2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold items-center justify-center">1</span>
              Thu Thập Thông Tin Cá Nhân
            </h2>
            <p>
              Lemas.AI cam kết chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ xác thực người dùng và vận hành dịch vụ:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li>Địa chỉ Email, Họ và tên (khi đăng ký tài khoản hoặc đăng nhập qua Google OAuth 2.0).</li>
              <li>Mật khẩu đã được mã hóa một chiều an toàn qua thuật toán Bcrypt với salt độ phức tạp cao.</li>
              <li>Nhật ký sử dụng token (Usage Logs) phục vụ tính toán chi phí minh bạch và kiểm soát hạn mức.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold items-center justify-center">2</span>
              Bảo Mật Dữ Liệu Prompt & Nội Dung Truy Vấn AI
            </h2>
            <p>
              Chúng tôi tôn trọng quyền riêng tư tuyệt đối của khách hàng. Lemas.AI đóng vai trò là một cổng định tuyến bảo mật (Zero-Retention Gateway). Chúng tôi <strong>không bao giờ</strong> sử dụng các câu lệnh (prompts), phản hồi hoặc dữ liệu nội dung kinh doanh của bạn để đào tạo hay huấn luyện bất kỳ mô hình AI nào.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold items-center justify-center">3</span>
              Mã Hóa & Tiêu Chuẩn Bảo Mật Hạ Tầng
            </h2>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>Toàn bộ dữ liệu truyền tải đều được bảo vệ bởi giao thức mã hóa TLS/HTTPS đạt tiêu chuẩn cao cấp.</li>
              <li>Các khóa API Key được lưu trữ mã hóa và che dấu (Masked) trong mọi nhật ký giám sát.</li>
              <li>Hệ thống cơ sở dữ liệu MongoDB Atlas Cloud được bảo vệ bằng tường lửa phân vùng mạng và mã hóa dữ liệu tĩnh (Encryption at Rest).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold items-center justify-center">4</span>
              Quyền Yêu Cầu Xóa Dữ Liệu
            </h2>
            <p>
              Người dùng có toàn quyền yêu cầu trích xuất hoặc xóa vĩnh viễn toàn bộ tài khoản và dữ liệu liên quan khỏi hệ thống bằng cách gửi yêu cầu hỗ trợ đến ban quản trị <Link href="/contact" className="text-emerald-400 underline font-semibold">tại đây</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
