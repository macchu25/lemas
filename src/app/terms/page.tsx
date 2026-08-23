'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại trang chủ Lemas.AI</span>
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-white/10 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-bold text-cyan-300">
            <FileText className="size-3.5" />
            <span>Điều Khoản Sử Dụng Dịch Vụ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service (Điều Khoản Dịch Vụ)
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
              <span className="flex size-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold items-center justify-center">1</span>
              Chấp Thuận Điều Khoản
            </h2>
            <p>
              Bằng việc truy cập hoặc sử dụng cổng AI Gateway Lemas.AI (`https://lemas.io.vn`, `api.lemas.io.vn`), bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được quy định trong văn bản này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold items-center justify-center">2</span>
              Quy Định Sử Dụng Dịch Vụ & API Keys
            </h2>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>Mỗi người dùng chịu hoàn toàn trách nhiệm bảo mật API Key và thông tin đăng nhập của mình.</li>
              <li>Nghiêm cấm hành vi brute-force, khai thác lỗ hổng (exploit), lạm dụng mã khuyến mãi/giftcode hoặc spam gây quá tải hạ tầng xoay tua model.</li>
              <li>Hệ thống áp dụng chính sách giới hạn lưu lượng (Rate Limiting) và hạn mức ngân sách Token theo gói cước để đảm bảo tính ổn định và công bằng cho toàn bộ người dùng.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold items-center justify-center">3</span>
              Thanh Toán, Nạp Tiền & Hạn Mức Token
            </h2>
            <p>
              Các giao dịch nạp tiền qua cổng thanh toán SePay VietQR được xử lý tự động và cộng vào số dư ví USD của người dùng. Số dư ví không có ngày hết hạn và được khấu trừ trực tiếp dựa trên số lượng Token tiêu thụ thực tế qua các mô hình AI theo bảng giá công khai.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold items-center justify-center">4</span>
              Quyền Sở Hữu Trí Tuệ & Bản Quyền
            </h2>
            <p>
              Toàn bộ nền tảng Lemas.AI, mã nguồn, kiến trúc định tuyến thông minh và nhãn hiệu thuộc quyền sở hữu độc quyền của <strong>MacchuStudio</strong>. Người dùng giữ toàn quyền sở hữu đối với các prompt và dữ liệu do mô hình AI tạo ra trong quá trình sử dụng.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 rounded-3xl border border-white/10 bg-[#0a0d18]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex size-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold items-center justify-center">5</span>
              Liên Hệ & Hỗ Trợ Kỹ Thuật
            </h2>
            <p>
              Mọi thắc mắc liên quan đến điều khoản sử dụng hoặc báo cáo bảo mật, vui lòng liên hệ đội ngũ kỹ sư tại <Link href="/contact" className="text-cyan-400 underline font-semibold">trang Liên hệ</Link> hoặc qua kênh Telegram: <a href="https://t.me/lemas_ai" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">@lemas_ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
