"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardUser,
  faPlus,
  faSearch,
  faBuilding,
  faCalendarDay,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

interface MonitoringRecord {
  id: number;
  teacher_name: string;
  company_name: string;
  date: string;
  visit_phase: string;
  student_count: number;
  progress_notes: string;
  recommendation: string;
}

const INITIAL_MONITORING: MonitoringRecord[] = [
  {
    id: 1,
    teacher_name: "Drs. I Wayan Sugiarta, M.Pd.",
    company_name: "PT Bali Cyber Solusindo",
    date: "2024-09-20",
    visit_phase: "Monitoring Tahap 1 (Bulan Ke-2)",
    student_count: 4,
    progress_notes: "Siswa beradaptasi sangat baik dengan tim pengembang. Menguasai alur kerja Git dan FastAPI dengan baik.",
    recommendation: "Lanjutkan tugas pembuatan modul pelaporan dan persiapan draft laporan PKL.",
  },
  {
    id: 2,
    teacher_name: "Kadek Dwi Putra, S.Kom.",
    company_name: "Telkom Witel Singaraja",
    date: "2024-09-22",
    visit_phase: "Monitoring Tahap 1 (Bulan Ke-2)",
    student_count: 4,
    progress_notes: "Siswa sering ikut tim teknisi lapangan untuk maintenance ODP dan instalasi IndiHome. Disiplin waktu sangat baik.",
    recommendation: "Perhatikan keselamatan kerja (K3) saat penarikan kabel tiang.",
  },
  {
    id: 3,
    teacher_name: "I Nyoman Muliarta, S.T.",
    company_name: "Auto2000 Singaraja",
    date: "2024-10-10",
    visit_phase: "Monitoring Tahap 2 (Evaluasi Progres)",
    student_count: 6,
    progress_notes: "Semua siswa mampu melakukan servis berkala dan overhaul rem secara mandiri dengan pengawasan mekanik senior.",
    recommendation: "Tingkatkan ketelitian pada dokumentasi lembar check sheet kendaraan.",
  },
];

export default function MonitoringPklPage() {
  const [records] = useState<MonitoringRecord[]>(INITIAL_MONITORING);
  const [search, setSearch] = useState("");

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.teacher_name.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            Monitoring & Kunjungan Supervisi Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan kunjungan pembimbing sekolah ke lokasi industri serta evaluasi perkembangan siswa
          </p>
        </div>

        <button
          onClick={() => Swal.fire("Input Kunjungan", "Formulir pencatatan monitoring baru siap digunakan.", "info")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          <span>+ Catat Kunjungan Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari guru atau industri..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: <strong className="text-slate-800">{filtered.length}</strong> Riwayat Kunjungan
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-indigo-200 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-[#4F46E5]">
                  {r.visit_phase}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                  {r.company_name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FontAwesomeIcon icon={faCalendarDay} className="text-[#4F46E5]" />
                <span className="font-semibold">{r.date}</span>
                <span>•</span>
                <span className="font-bold text-slate-700">{r.student_count} Siswa Dimonitor</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <p className="font-bold text-slate-700 mb-1">Catatan Perkembangan Siswa:</p>
                <p className="text-slate-600 leading-relaxed">{r.progress_notes}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <p className="font-bold text-[#1e1b4b] mb-1">Rekomendasi Pembimbing:</p>
                <p className="text-slate-700 leading-relaxed">{r.recommendation}</p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Guru Pembimbing: <strong className="text-slate-700">{r.teacher_name}</strong></span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <FontAwesomeIcon icon={faCheckCircle} />
                Laporan Kunjungan Terverifikasi
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
