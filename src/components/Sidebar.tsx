"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faBuilding,
  faUsers,
  faBookOpen,
  faCalendarCheck,
  faChalkboardUser,
  faAward,
  faGear,
  faBriefcase,
  faArrowLeft,
  faXmark,
  faUserShield,
  faFileCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { usePkl } from "@/context/PklContext";

interface SidebarProps {
  isOpen: boolean;
  isDesktopOpen?: boolean;
  onClose: () => void;
  onToggleDesktop?: () => void;
}

export default function Sidebar({
  isOpen,
  isDesktopOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { role, isAdmin, isTeacher, isStudent } = useAuth();
  const { settings } = usePkl();

  // Navigation Items per Role
  const adminNav = [
    {
      name: "Dashboard Admin",
      href: "/",
      icon: faChartPie,
      desc: "Overview DUDI, siswa & status",
    },
    {
      name: "Mitra Industri (DUDI)",
      href: "/mitra",
      icon: faBuilding,
      desc: "Input DUDI, MoU & kuota industri",
    },
    {
      name: "Guru Pembimbing (SIAK)",
      href: "/pembimbing",
      icon: faChalkboardUser,
      desc: "Penugasan guru dari SIAK",
    },
    {
      name: "Penempatan & Pembimbing",
      href: "/penempatan",
      icon: faUsers,
      desc: "Plotting guru ke DUDI & siswa",
    },
    {
      name: "Rekap Jurnal Keseluruhan",
      href: "/jurnal",
      icon: faBookOpen,
      desc: "Monitoring logbook harian siswa",
    },
    {
      name: "Rekap Kehadiran",
      href: "/presensi",
      icon: faCalendarCheck,
      desc: "Presensi seluruh siswa PKL",
    },
    {
      name: "Penilaian & Sertifikat",
      href: "/penilaian",
      icon: faAward,
      desc: "Rekap nilai & terbitkan sertifikat",
    },
    {
      name: "Pengaturan Sistem",
      href: "/pengaturan",
      icon: faGear,
      desc: "Periode, kepala sekolah & syarat",
    },
  ];

  const teacherNav = [
    {
      name: "Dashboard Pembimbing",
      href: "/",
      icon: faChartPie,
      desc: "Siswa binaan & status bimbingan",
    },
    {
      name: "Siswa Binaan & DUDI",
      href: "/penempatan",
      icon: faUsers,
      desc: "Daftar siswa & lokasi industri DUDI",
    },
    {
      name: "Verifikasi Jurnal Harian",
      href: "/jurnal",
      icon: faBookOpen,
      desc: "Review & persetujuan logbook",
    },
    {
      name: "Rekap Kehadiran Binaan",
      href: "/presensi",
      icon: faCalendarCheck,
      desc: "Presensi harian siswa bimbingan",
    },
    {
      name: "Input Nilai & Sertifikat",
      href: "/penilaian",
      icon: faAward,
      desc: "Input nilai DUDI + sekolah & download sertifikat",
    },
  ];

  const studentNav = [
    {
      name: "Dashboard Siswa",
      href: "/",
      icon: faChartPie,
      desc: "Informasi penempatan & progres",
    },
    {
      name: "Jurnal Harian PKL",
      href: "/jurnal",
      icon: faBookOpen,
      desc: "Input logbook + foto tag lokasi & waktu",
    },
    {
      name: "Rekap Presensi Saya",
      href: "/presensi",
      icon: faCalendarCheck,
      desc: "Catatan kehadiran industri",
    },
    {
      name: "Nilai & Sertifikat PKL",
      href: "/penilaian",
      icon: faAward,
      desc: "Cek nilai DUDI & download sertifikat",
    },
  ];

  const navigation = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  const roleBadge = isAdmin
    ? { title: "Portal Administrator", tag: "Admin Hubin", color: "bg-indigo-900/60 text-indigo-300 border-indigo-700/60" }
    : isTeacher
    ? { title: "Portal Guru Pembimbing", tag: "Guru Pembimbing", color: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60" }
    : { title: "Portal Siswa PKL", tag: "Siswa Vokasi", color: "bg-amber-950/80 text-amber-300 border-amber-800/60" };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Deep Midnight Indigo #1E1B4B & Vivid Indigo #4F46E5) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1e1b4b] text-white flex flex-col transition-transform duration-200 ease-in-out shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full"}`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#2e265c]">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 overflow-hidden ${
                settings?.logo_url
                  ? "bg-white border border-white/20 p-1"
                  : "bg-[#4F46E5] text-white shadow-indigo-900/40"
              }`}
            >
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings?.app_name || "Logo PKL"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <FontAwesomeIcon icon={faBriefcase} className="text-base" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-wide text-white block truncate">
                {settings?.app_name || "Si-PKL"}
              </span>
              <span className="text-[10px] text-indigo-200/70 font-medium block truncate">
                {roleBadge.title}
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-[#251f4d] transition-colors cursor-pointer"
            aria-label="Tutup sidebar"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-4 py-2.5 bg-[#17143d] border-b border-[#2e265c] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-indigo-200/80">Peran Aktif:</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge.color}`}>
            {roleBadge.tag}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300/50">
            Navigasi {roleBadge.tag}
          </p>
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-900/50"
                    : "text-indigo-200/80 hover:text-white hover:bg-[#2c2759]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#1e1b4b]/40 text-white"
                      : "bg-[#131131] text-[#818CF8] group-hover:text-white group-hover:bg-[#4F46E5]/40"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate leading-tight">{item.name}</p>
                  <p
                    className={`text-[10px] truncate mt-0.5 font-normal ${
                      isActive ? "text-indigo-100/90" : "text-indigo-300/50"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Back to Portal */}
        <div className="p-3 border-t border-[#2e265c] bg-[#131131]">
          <a
            href="http://localhost:3000/portal"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#1e1b4b] hover:bg-[#251f4d] border border-[#2e265c] text-indigo-200 hover:text-white text-xs font-semibold transition-all duration-150"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            <span>Kembali ke Portal</span>
          </a>
        </div>
      </aside>
    </>
  );
}
