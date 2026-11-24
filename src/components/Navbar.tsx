"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBriefcase,
  faRightFromBracket,
  faUserGear,
  faChevronDown,
  faCalendarDays,
  faUserShield,
  faChalkboardUser,
  faGraduationCap,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth, PklRole } from "@/context/AuthContext";
import { usePkl } from "@/context/PklContext";
import AppSwitcher from "@/components/AppSwitcher";

interface NavbarProps {
  onToggleSidebar?: () => void;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export default function Navbar({
  onToggleSidebar,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
}: NavbarProps) {
  const { user, role, switchRole, logout } = useAuth();
  const { settings } = usePkl();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now)
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || user?.username || "Pengguna";

  const roleMeta: Record<PklRole, { label: string; sub: string; icon: any; badgeBg: string; textColor: string }> = {
    admin: {
      label: "Admin PKL / Hubin",
      sub: "Akses Penuh Manajemen",
      icon: faUserShield,
      badgeBg: "bg-indigo-50 border-indigo-200 text-[#4F46E5]",
      textColor: "text-[#4F46E5]",
    },
    teacher: {
      label: "Guru Pembimbing",
      sub: "Bimbingan, Nilai & Verifikasi",
      icon: faChalkboardUser,
      badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      textColor: "text-emerald-700",
    },
    student: {
      label: "Siswa PKL",
      sub: "Jurnal, Lokasi, Nilai & Sertifikat",
      icon: faGraduationCap,
      badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
      textColor: "text-amber-800",
    },
  };

  const currentRoleMeta = roleMeta[role] || roleMeta.admin;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Tombol Show/Hide Sidebar untuk Desktop (lg+) */}
        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-[#4F46E5] transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
            title={isDesktopSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            aria-label={isDesktopSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
          >
            <FontAwesomeIcon icon={faBars} className="text-sm" />
          </button>
        )}

        {/* Tombol Toggle Sidebar untuk Mobile (< lg) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex lg:hidden w-9 h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-[#4F46E5] transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
            title="Buka / Tutup Menu Sidebar"
            aria-label="Buka / Tutup Menu Sidebar"
          >
            <FontAwesomeIcon icon={faBars} className="text-sm" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          {settings?.logo_url ? (
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
              <img
                src={settings.logo_url}
                alt={settings?.app_name || "Logo PKL"}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center text-sm shadow-xs shrink-0">
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                {settings?.app_name || "Si-PKL"}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden md:inline-flex items-center gap-1 ${currentRoleMeta.badgeBg}`}>
                <FontAwesomeIcon icon={currentRoleMeta.icon} className="text-[9px]" />
                {currentRoleMeta.label}
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500">
              {settings?.app_tagline || "Praktik Kerja Lapangan & Hubin Vokasi SMK"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Role Switcher Pill */}
        <div className="relative" ref={roleRef}>
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${currentRoleMeta.badgeBg}`}
            title="Ganti Peran / Role Pengguna"
          >
            <FontAwesomeIcon icon={currentRoleMeta.icon} className="text-xs" />
            <span className="text-xs hidden sm:inline">{currentRoleMeta.label}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-[10px] opacity-70 ml-0.5" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Peran Sistem (Role PKL)
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Beralih mode untuk menguji fitur tiap role
                </p>
              </div>

              <div className="space-y-1">
                {(["admin", "teacher", "student"] as PklRole[]).map((r) => {
                  const meta = roleMeta[r];
                  const isActive = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        switchRole(r);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 border border-indigo-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                          isActive
                            ? "bg-[#4F46E5] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={meta.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isActive ? "text-[#4F46E5]" : "text-slate-800"}`}>
                            {meta.label}
                          </p>
                          {isActive && (
                            <FontAwesomeIcon icon={faCheck} className="text-xs text-[#4F46E5]" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {meta.sub}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
          <FontAwesomeIcon icon={faCalendarDays} className="text-[#4F46E5] text-xs" />
          <span>{currentDate}</span>
        </div>

        <AppSwitcher currentApp="pkl" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1e1b4b] text-[#818CF8] flex items-center justify-center text-xs font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {currentRoleMeta.label}
              </p>
            </div>
            <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.nip ? `NIP: ${user.nip}` : user?.nisn ? `NISN: ${user.nisn}` : user?.username || "user"}
                </p>
                {user?.major && (
                  <p className="text-[10px] text-[#4F46E5] font-semibold mt-0.5 truncate">{user.major}</p>
                )}
              </div>
              <Link
                href="/pengaturan"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <FontAwesomeIcon icon={faUserGear} className="text-slate-400" />
                <span>Pengaturan Sistem</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
