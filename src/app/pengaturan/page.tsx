"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faFloppyDisk,
  faBriefcase,
  faPercent,
  faCalendarDays,
  faSignature,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { usePkl } from "@/context/PklContext";

export default function PengaturanPklPage() {
  const { settings, updateSettings } = usePkl();
  const [formData, setFormData] = useState({
    app_name: settings.app_name || "Si-PKL",
    app_tagline: settings.app_tagline || "Praktik Kerja Lapangan & Hubin",
    app_description: settings.app_description || "Sistem Informasi Manajemen PKL, Bimbingan DUDI & Sertifikasi Vokasi SMK",
    min_attendance_pct: settings.min_attendance_pct || 85,
    academic_year: settings.academic_year || "2024/2025",
    semester: settings.semester || "Ganjil",
    principal_name: "Drs. I Ketut Wijaya, M.Pd.",
    principal_nip: "197508122002121003",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/backend/api/pkl/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) {
            setFormData((prev) => ({
              ...prev,
              ...json.settings,
              principal_name: json.settings.principal_name || "Drs. I Ketut Wijaya, M.Pd.",
              principal_nip: json.settings.principal_nip || "197508122002121003",
            }));
          }
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/backend/api/pkl/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        updateSettings(formData);
        Swal.fire({
          icon: "success",
          title: "Pengaturan Tersimpan",
          text: "Konfigurasi modul PKL dan informasi penandatangan sertifikat berhasil diperbarui.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error();
      }
    } catch {
      updateSettings(formData);
      Swal.fire({
        icon: "success",
        title: "Pengaturan Tersimpan Lokal",
        text: "Konfigurasi modul PKL berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm">
            <FontAwesomeIcon icon={faGear} />
          </span>
          <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            Pengaturan Sistem Praktik Kerja Lapangan (PKL)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan identitas aplikasi, periode aktif, syarat kehadiran minimum, serta pejabat penandatangan sertifikat digital.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Identitas Aplikasi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FontAwesomeIcon icon={faBriefcase} className="text-[#4F46E5]" />
            <span>Identitas & Nama Modul</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Aplikasi PKL</label>
              <input
                type="text"
                required
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline Singkat</label>
              <input
                type="text"
                required
                value={formData.app_tagline}
                onChange={(e) => setFormData({ ...formData, app_tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-medium text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Deskripsi Sistem</label>
              <textarea
                rows={3}
                value={formData.app_description}
                onChange={(e) => setFormData({ ...formData, app_description: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Kebijakan PKL & Periode */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarDays} className="text-[#4F46E5]" />
            <span>Periode & Kebijakan Sertifikasi</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimal Kehadiran (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.min_attendance_pct}
                  onChange={(e) => setFormData({ ...formData, min_attendance_pct: parseInt(e.target.value) || 85 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-bold text-slate-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Syarat penerbitan sertifikat kelulusan</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran PKL</label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester Pelaksanaan</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] bg-white font-semibold text-slate-800"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Penandatangan Sertifikat Resmi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FontAwesomeIcon icon={faSignature} className="text-[#4F46E5]" />
            <span>Pejabat Penandatangan Sertifikat PKL</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                placeholder="Contoh: Drs. I Ketut Wijaya, M.Pd."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-semibold text-slate-800"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tercantum pada lembar sertifikat resmi PKL</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principal_nip}
                onChange={(e) => setFormData({ ...formData, principal_nip: e.target.value })}
                placeholder="Contoh: 197508122002121003"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] font-mono text-slate-800"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            <span>Simpan Pengaturan Sistem</span>
          </button>
        </div>
      </form>
    </div>
  );
}
