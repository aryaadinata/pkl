"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { user, isLoading, hasAccess } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1b4b] text-white text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <span>{isLoading ? "Memuat Sistem Praktik Kerja Lapangan (PKL)..." : "Mengarahkan ke Halaman Login SSO..."}</span>
        </div>
      </div>
    );
  }

  if (user && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1b4b] px-4">
        <div className="max-w-md w-full bg-[#131131] border border-[#2e265c] rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl mb-4 shadow-lg">
            <FontAwesomeIcon icon={faBan} />
          </div>
          <h2 className="text-lg font-bold mb-2">Akses Modul PKL Ditolak</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Akun Anda (<strong className="text-white">@{user.username || user.identifier}</strong>) belum memiliki izin untuk mengakses aplikasi <strong className="text-[#818CF8]">Praktik Kerja Lapangan (Si-PKL)</strong>.
            Silakan hubungi Superadmin di menu <em>Kelola Admin Portal</em> untuk menambahkan izin modul ini.
          </p>
          <a
            href="http://localhost:3000/portal"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-98"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Kembali ke Portal Sekolah</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaeaea] flex">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onToggleDesktop={() => setIsDesktopSidebarOpen((prev) => !prev)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isDesktopSidebarOpen ? "lg:pl-64" : "lg:pl-0"
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-2 sm:p-3 md:p-4 w-full min-w-0 print:p-0 print:m-0 print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
