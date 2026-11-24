"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface PklSettings {
  app_name: string;
  app_tagline: string;
  app_description?: string;
  logo_url?: string;
  favicon_url?: string;
  min_attendance_pct?: number;
  academic_year?: string;
  semester?: string;
  principal_name?: string;
  principal_nip?: string;
}

export interface PklStats {
  total_students: number;
  total_companies: number;
  active_placements: number;
  pending_journals: number;
  today_attendance_pct: number;
}

interface PklContextType {
  settings: PklSettings;
  stats: PklStats;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  updateSettings: (newSettings: Partial<PklSettings>) => void;
}

const DEFAULT_SETTINGS: PklSettings = {
  app_name: "Si-PKL",
  app_tagline: "Praktik Kerja Lapangan & Hubin",
  app_description: "Sistem Informasi Manajemen PKL, Bimbingan DUDI & Sertifikasi Vokasi SMK",
  logo_url: "/logo.png",
  min_attendance_pct: 85,
  academic_year: "2024/2025",
  semester: "Ganjil",
};

const DEFAULT_STATS: PklStats = {
  total_students: 0,
  total_companies: 0,
  active_placements: 0,
  pending_journals: 0,
  today_attendance_pct: 0,
};

const PklContext = createContext<PklContextType | undefined>(undefined);

export const PklProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PklSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<PklStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAndSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch stats from backend
      try {
        const res = await fetch("/api/backend/api/pkl/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setStats(data.stats);
          }
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (err) {
        // Fallback default stats for display if backend is initializing
        console.warn("PKL stats fetch fallback:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatsAndSettings();
  }, [fetchStatsAndSettings]);

  const updateSettings = (newSettings: Partial<PklSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <PklContext.Provider
      value={{
        settings,
        stats,
        isLoading,
        refreshStats: fetchStatsAndSettings,
        updateSettings,
      }}
    >
      {children}
    </PklContext.Provider>
  );
};

export const usePkl = () => {
  const context = useContext(PklContext);
  if (!context) {
    throw new Error("usePkl must be used within a PklProvider");
  }
  return context;
};
