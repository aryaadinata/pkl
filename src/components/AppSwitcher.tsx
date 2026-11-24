"use client";

import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCells,
  faGraduationCap,
  faCoins,
  faBookOpen,
  faBoxesStacked,
  faBriefcase,
  faCompass,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface AppInfo {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  favicon?: string;
  url: string;
}

const DEFAULT_ECOSYSTEM_APPS: Record<string, AppInfo> = {
  siak: {
    id: "siak",
    name: "Cendekia",
    tagline: "Akademik",
    logo: "/logo.png",
    url: "http://localhost:3000",
  },
  keuangan: {
    id: "keuangan",
    name: "Sipanda",
    tagline: "SPP & Kasir",
    logo: "",
    url: "http://localhost:3001",
  },
  perpustakaan: {
    id: "perpustakaan",
    name: "Pustaloka",
    tagline: "E-Library",
    logo: "/logo.png",
    url: "http://localhost:3002",
  },
  sarpras: {
    id: "sarpras",
    name: "Sarpras",
    tagline: "Aset & KIR",
    logo: "",
    url: "http://localhost:3003",
  },
  pkl: {
    id: "pkl",
    name: "Si-PKL",
    tagline: "Vokasi & DUDI",
    logo: "",
    url: "http://localhost:3004",
  },
};

interface AppSwitcherProps {
  currentApp?: "siak" | "keuangan" | "perpustakaan" | "sarpras" | "pkl";
}

export default function AppSwitcher({ currentApp = "pkl" }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<Record<string, AppInfo>>(DEFAULT_ECOSYSTEM_APPS);
  const [schoolType, setSchoolType] = useState<string>("SMA");
  const [accessibleModules, setAccessibleModules] = useState<string[]>([]);
  const [isPklMentor, setIsPklMentor] = useState<boolean>(false);
  const [isPklStudent, setIsPklStudent] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper untuk mendapatkan token SSO aktif
  const getSsoToken = () => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("siak_jwt_token") ||
      localStorage.getItem("siak_token") ||
      localStorage.getItem("keuangan_token") ||
      localStorage.getItem("perpus_token") ||
      localStorage.getItem("sarpras_token") ||
      localStorage.getItem("pkl_token") ||
      document.cookie.match(/(?:^|;\s*)(?:siak_token|keuangan_token|perpus_token|sarpras_token|pkl_token)=([^;]+)/)?.[1] ||
      ""
    );
  };

  const getTokenPayload = () => {
    const token = getSsoToken();
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      }
    } catch {}
    return null;
  };

  const getUserRoleFromToken = () => {
    const payload = getTokenPayload();
    return (payload?.role || "").toLowerCase();
  };

  // Ambil branding dinamis dari backend dengan cache localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ecosystem_apps_branding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.siak || parsed.keuangan || parsed.perpustakaan || parsed.pkl || parsed.sarpras) {
          setApps((prev) => ({ ...prev, ...parsed }));
        }
      }
      const cachedSchoolType = localStorage.getItem("school_type");
      if (cachedSchoolType) {
        setSchoolType(cachedSchoolType);
      }
      const cachedModules = localStorage.getItem("user_accessible_modules");
      if (cachedModules) {
        setAccessibleModules(JSON.parse(cachedModules));
      }
      const cachedMentor = localStorage.getItem("is_pkl_mentor");
      if (cachedMentor !== null) {
        setIsPklMentor(cachedMentor === "true");
      }
      const cachedStudent = localStorage.getItem("is_pkl_student");
      if (cachedStudent !== null) {
        setIsPklStudent(cachedStudent === "true");
      }
    } catch {}

    const fetchEcosystem = async () => {
      try {
        const token = getSsoToken();
        const payload = getTokenPayload();
        const params = new URLSearchParams();
        if (token) params.append("token", token);
        if (payload?.role) params.append("role", payload.role);
        const userId = payload?.id || payload?.sub || payload?.user_id;
        if (userId) params.append("user_id", String(userId));
        if (payload?.nip) params.append("nip", payload.nip);
        const studentId = payload?.student_id || payload?.nisn || payload?.nis;
        if (studentId) params.append("nisn", String(studentId));

        const queryStr = params.toString() ? `?${params.toString()}` : "";
        let res: Response;
        try {
          res = await fetch(`/api/backend/api/ecosystem/apps${queryStr}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error();
        } catch {
          res = await fetch(`http://127.0.0.1:5000/api/ecosystem/apps${queryStr}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
        if (res.ok) {
          const json = await res.json();
          if (json.school_type) {
            setSchoolType(json.school_type);
            try {
              localStorage.setItem("school_type", json.school_type);
            } catch {}
          }
          if (json.accessible_modules) {
            setAccessibleModules(json.accessible_modules);
            try {
              localStorage.setItem("user_accessible_modules", JSON.stringify(json.accessible_modules));
            } catch {}
          }
          if (json.is_pkl_mentor !== undefined) {
            setIsPklMentor(json.is_pkl_mentor);
            try {
              localStorage.setItem("is_pkl_mentor", String(json.is_pkl_mentor));
            } catch {}
          }
          if (json.is_pkl_student !== undefined) {
            setIsPklStudent(json.is_pkl_student);
            try {
              localStorage.setItem("is_pkl_student", String(json.is_pkl_student));
            } catch {}
          }
          if (json.success && json.apps) {
            setApps(json.apps);
            try {
              localStorage.setItem("ecosystem_apps_branding", JSON.stringify(json.apps));
            } catch {}
          }
        }
      } catch (err) {
        // Fallback ke default
      }
    };

    fetchEcosystem();
  }, []);

  const getSiakTargetUrl = () => {
    const base = apps.siak?.url || DEFAULT_ECOSYSTEM_APPS.siak.url || "http://localhost:3000";
    const cleanUrl = base.replace(/\/+$/, "");
    const role = getUserRoleFromToken();
    if (role === "student" || role === "siswa") {
      return `${cleanUrl}/student`;
    }
    if (role === "teacher" || role === "guru") {
      return `${cleanUrl}/teacher`;
    }
    if (role === "staff") {
      return `${cleanUrl}/list/teachers`;
    }
    return `${cleanUrl}/admin`;
  };

  const handleNavigate = (targetUrl: string, e: React.MouseEvent) => {
    setIsOpen(false);
    const token = getSsoToken();
    let finalUrl = targetUrl;
    if (
      finalUrl.includes("localhost:3000") &&
      (finalUrl.endsWith(":3000") ||
        finalUrl.endsWith(":3000/") ||
        (!finalUrl.includes("/portal") &&
          !finalUrl.includes("/admin") &&
          !finalUrl.includes("/teacher") &&
          !finalUrl.includes("/student") &&
          !finalUrl.includes("/list")))
    ) {
      finalUrl = getSiakTargetUrl();
    }
    if (token && finalUrl.startsWith("http")) {
      e.preventDefault();
      const url = new URL(finalUrl);
      url.searchParams.set("token", token);
      window.location.href = url.toString();
    }
  };

  // Filter modul berdasarkan role dan assignment PKL:
  // - Guru: siak, perpustakaan, dan PKL (jika pembimbing)
  // - Siswa: siak, keuangan, perpustakaan, dan PKL (jika dimaping)
  // - Admin: semua modul (PKL jika SMK)
  const isModuleVisible = (appId: string) => {
    // PKL HANYA boleh muncul jika jenjang sekolah adalah SMK!
    if (appId === "pkl" && schoolType !== "SMK") {
      return false;
    }
    if (accessibleModules.length > 0) {
      return accessibleModules.includes(appId);
    }
    const role = getUserRoleFromToken();
    if (role === "teacher" || role === "guru") {
      if (appId === "siak" || appId === "perpustakaan") return true;
      if (appId === "pkl") return schoolType === "SMK" && isPklMentor;
      return false;
    }
    if (role === "student" || role === "siswa") {
      if (appId === "siak" || appId === "keuangan" || appId === "perpustakaan") return true;
      if (appId === "pkl") return schoolType === "SMK" && isPklStudent;
      return false;
    }
    if (appId === "pkl") return schoolType === "SMK";
    return true;
  };

  // Render logo aplikasi dengan fallback ikon FontAwesome
  const renderLogoBox = (
    appId: "siak" | "keuangan" | "perpustakaan" | "sarpras" | "pkl",
    fallbackIcon: any,
    fallbackBg: string,
    fallbackText: string
  ) => {
    const app = apps[appId] || DEFAULT_ECOSYSTEM_APPS[appId];
    const hasCustomLogo = app?.logo && app.logo.trim() !== "";

    return (
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center p-1.5 mb-2 shadow-2xs group-hover:scale-105 group-hover:border-slate-300 transition-all overflow-hidden shrink-0">
        {hasCustomLogo ? (
          <img
            src={app.logo}
            alt={app.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.className = `w-12 h-12 rounded-xl ${fallbackBg} ${fallbackText} flex items-center justify-center text-lg mb-2 shadow-xs`;
              }
            }}
          />
        ) : (
          <div className={`w-full h-full rounded-lg ${fallbackBg} ${fallbackText} flex items-center justify-center text-base`}>
            <FontAwesomeIcon icon={fallbackIcon} />
          </div>
        )}
      </div>
    );
  };

  const siakApp = apps.siak || DEFAULT_ECOSYSTEM_APPS.siak;
  const keuApp = apps.keuangan || DEFAULT_ECOSYSTEM_APPS.keuangan;
  const perpusApp = apps.perpustakaan || DEFAULT_ECOSYSTEM_APPS.perpustakaan;
  const sarprasApp = apps.sarpras || DEFAULT_ECOSYSTEM_APPS.sarpras;
  const pklApp = apps.pkl || DEFAULT_ECOSYSTEM_APPS.pkl;

  const visibleCount = ["siak", "keuangan", "perpustakaan", "sarpras", "pkl"].filter(isModuleVisible).length;
  const popoverWidthClass =
    visibleCount <= 2
      ? "w-[280px] sm:w-[320px]"
      : visibleCount === 3
      ? "w-[320px] sm:w-[390px]"
      : visibleCount === 4
      ? "w-[360px] sm:w-[470px]"
      : "w-[360px] sm:w-[560px]";

  const popoverGridClass =
    visibleCount <= 2
      ? "grid-cols-2"
      : visibleCount === 3
      ? "grid-cols-3"
      : visibleCount === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-5";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 9-Dots Grid Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Peralihan Aplikasi Sekolah (App Switcher)"
        aria-label="App Switcher"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isOpen
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/30"
            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-sm"
        }`}
      >
        <FontAwesomeIcon icon={isOpen ? faXmark : faTableCells} className="text-base" />
      </button>

      {/* Floating Popover Menu (Google Workspace Style) */}
      {isOpen && (
        <div className={`absolute right-0 mt-2.5 ${popoverWidthClass} bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800`}>
          {/* Header */}
          <div className="px-1 py-1 border-b border-slate-100 flex items-center justify-between pb-3 mb-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                Ekosistem Aplikasi Sekolah
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih modul sistem untuk berpindah
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              SSO Terhubung
            </span>
          </div>

          {/* Dynamic Filtered Apps Grid */}
          <div className={`grid ${popoverGridClass} gap-2`}>
            {/* 1. SIAKAD (Cendekia) */}
            {isModuleVisible("siak") && (
              currentApp === "siak" ? (
                <div className="p-2.5 rounded-2xl border bg-blue-50/70 border-blue-200 shadow-2xs flex flex-col items-center text-center">
                  {renderLogoBox("siak", faGraduationCap, "bg-blue-50", "text-blue-600")}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-full px-1" title={siakApp.name}>
                    {siakApp.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">
                    {siakApp.tagline || "Akademik"}
                  </span>
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                    Aktif
                  </span>
                </div>
              ) : (
                <a
                  href={getSiakTargetUrl()}
                  onClick={(e) => handleNavigate(getSiakTargetUrl(), e)}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 flex flex-col items-center text-center transition-all group cursor-pointer"
                >
                  {renderLogoBox("siak", faGraduationCap, "bg-blue-50", "text-blue-600")}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate max-w-full px-1" title={siakApp.name}>
                    {siakApp.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-full">
                    {getUserRoleFromToken() === "student" || getUserRoleFromToken() === "siswa"
                      ? "Portal Siswa"
                      : (siakApp.tagline || "Akademik")}
                  </span>
                </a>
              )
            )}

            {/* 2. Keuangan (Sipanda) */}
            {isModuleVisible("keuangan") && (
              currentApp === "keuangan" ? (
                <div className="p-2.5 rounded-2xl border bg-emerald-50/70 border-emerald-200 shadow-2xs flex flex-col items-center text-center">
                  {renderLogoBox("keuangan", faCoins, "bg-emerald-50", "text-emerald-600")}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-full px-1" title={keuApp.name}>
                    {keuApp.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">
                    {keuApp.tagline || "SPP & Kasir"}
                  </span>
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                    Aktif
                  </span>
                </div>
              ) : (
                <a
                  href="http://localhost:3001"
                  onClick={(e) => handleNavigate("http://localhost:3001", e)}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 flex flex-col items-center text-center transition-all group cursor-pointer"
                >
                  {renderLogoBox("keuangan", faCoins, "bg-emerald-50", "text-emerald-600")}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 truncate max-w-full px-1" title={keuApp.name}>
                    {keuApp.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-full">
                    {keuApp.tagline || "SPP & Kasir"}
                  </span>
                </a>
              )
            )}

            {/* 3. Perpustakaan (Pustaloka) */}
            {isModuleVisible("perpustakaan") && (
              currentApp === "perpustakaan" ? (
                <div className="p-2.5 rounded-2xl border bg-amber-50/70 border-amber-200 shadow-2xs flex flex-col items-center text-center">
                  {renderLogoBox("perpustakaan", faBookOpen, "bg-amber-50", "text-amber-700")}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-full px-1" title={perpusApp.name}>
                    {perpusApp.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">
                    {perpusApp.tagline || "E-Library"}
                  </span>
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                    Aktif
                  </span>
                </div>
              ) : (
                <a
                  href="http://localhost:3002"
                  onClick={(e) => handleNavigate("http://localhost:3002", e)}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 flex flex-col items-center text-center transition-all group cursor-pointer"
                >
                  {renderLogoBox("perpustakaan", faBookOpen, "bg-amber-50", "text-amber-700")}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 truncate max-w-full px-1" title={perpusApp.name}>
                    {perpusApp.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-full">
                    {perpusApp.tagline || "E-Library"}
                  </span>
                </a>
              )
            )}

            {/* 4. Sarana & Prasarana */}
            {isModuleVisible("sarpras") && (
              currentApp === "sarpras" ? (
                <div className="p-2.5 rounded-2xl border bg-teal-50/70 border-teal-200 shadow-2xs flex flex-col items-center text-center">
                  {renderLogoBox("sarpras", faBoxesStacked, "bg-teal-50", "text-teal-700")}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-full px-1" title={sarprasApp.name}>
                    {sarprasApp.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">
                    {sarprasApp.tagline || "Aset & KIR"}
                  </span>
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                    Aktif
                  </span>
                </div>
              ) : (
                <a
                  href="http://localhost:3003"
                  onClick={(e) => handleNavigate("http://localhost:3003", e)}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 flex flex-col items-center text-center transition-all group cursor-pointer"
                >
                  {renderLogoBox("sarpras", faBoxesStacked, "bg-teal-50", "text-teal-700")}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 truncate max-w-full px-1" title={sarprasApp.name}>
                    {sarprasApp.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-full">
                    {sarprasApp.tagline || "Aset & KIR"}
                  </span>
                </a>
              )
            )}

            {/* 5. Praktik Kerja Lapangan (PKL) */}
            {isModuleVisible("pkl") && (
              currentApp === "pkl" ? (
                <div className="p-2.5 rounded-2xl border bg-indigo-50/70 border-indigo-200 shadow-2xs flex flex-col items-center text-center">
                  {renderLogoBox("pkl", faBriefcase, "bg-indigo-50", "text-indigo-600")}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-full px-1" title={pklApp.name}>
                    {pklApp.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate max-w-full">
                    {pklApp.tagline || "Vokasi & DUDI"}
                  </span>
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                    Aktif
                  </span>
                </div>
              ) : (
                <a
                  href="http://localhost:3004"
                  onClick={(e) => handleNavigate("http://localhost:3004", e)}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 flex flex-col items-center text-center transition-all group cursor-pointer"
                >
                  {renderLogoBox("pkl", faBriefcase, "bg-indigo-50", "text-indigo-600")}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate max-w-full px-1" title={pklApp.name}>
                    {pklApp.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-full">
                    {pklApp.tagline || "Vokasi & DUDI"}
                  </span>
                </a>
              )
            )}
          </div>

          {/* Secondary Footer Link: Portal Launcher Utama */}
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <a
              href="http://localhost:3000/portal"
              onClick={(e) => handleNavigate("http://localhost:3000/portal", e)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                  <FontAwesomeIcon icon={faCompass} />
                </div>
                <span>Portal Launcher Utama</span>
              </div>
              <span className="text-xs text-indigo-500 font-bold group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
