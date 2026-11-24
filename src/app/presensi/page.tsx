"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faSearch,
  faDownload,
  faBuilding,
  faClock,
  faLocationDot,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

interface AttendanceRecord {
  id: number;
  placement_id: number;
  student_name: string;
  nisn: string;
  major: string;
  company_name: string;
  teacher_mentor_name?: string;
  date: string;
  time_in: string;
  time_out: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
  notes?: string;
}

export default function PresensiPklPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendances = async () => {
    try {
      setIsLoading(true);
      let url = "/api/backend/api/pkl/attendances";
      const params = new URLSearchParams();

      if (isTeacher && user?.teacher_id) {
        params.append("teacher_id", user.teacher_id.toString());
      }
      if (selectedDate) {
        params.append("date_filter", selectedDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.attendances) {
          setRecords(data.attendances);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [role, user, selectedDate]);

  const handleExport = () => {
    Swal.fire({
      icon: "success",
      title: "Mengekspor Rekap Presensi",
      text: "Data rekapitulasi presensi siswa sedang diproses dalam format lembar cetak.",
      timer: 1500,
      showConfirmButton: false,
    });
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faCalendarCheck} />
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              {isStudent
                ? "Catatan Presensi PKL Saya"
                : isTeacher
                ? "Rekapitulasi Kehadiran Siswa Binaan"
                : "Rekapitulasi Kehadiran PKL Seluruh Siswa"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? "Memantau kedisiplinan dan absensi harian seluruh siswa binaan di tempat kerja DUDI."
              : isStudent
              ? "Rekam jejak kehadiran harian Anda selama pelaksanaan praktik kerja lapangan."
              : "Rekap absensi seluruh siswa SMK yang melakukan kegiatan praktik kerja di mitra industri."}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98 shrink-0"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          <span>Ekspor / Cetak Rekap</span>
        </button>
      </div>

      {/* Filter Tanggal & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="px-2.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Semua Tanggal
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa, DUDI, status..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </div>
      </div>

      {/* Tabel Presensi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Memuat data kehadiran...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Tidak ada catatan presensi yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">Mitra DUDI</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-center">Jam Kerja</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center font-bold text-xs shrink-0">
                          {r.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{r.student_name}</p>
                          <p className="text-[10px] text-slate-500">{r.major}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faBuilding} className="text-[#4F46E5] text-xs" />
                        {r.company_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px]">
                      {r.time_in || "07:55"} - {r.time_out || "16:30"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === "Hadir"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "Izin"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : r.status === "Sakit"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.notes || "Presensi harian industri"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
