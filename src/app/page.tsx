"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faBuilding,
  faBookOpen,
  faCalendarCheck,
  faPlus,
  faBriefcase,
  faLocationDot,
  faCheckCircle,
  faClock,
  faArrowRight,
  faDownload,
  faAward,
  faChalkboardUser,
  faUserGraduate,
  faPrint,
  faCertificate,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { usePkl } from "@/context/PklContext";

export default function PklDashboardPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const { settings } = usePkl();

  const [statsData, setStatsData] = useState<any>({
    total_students: 4,
    total_companies: 4,
    active_placements: 4,
    pending_journals: 2,
    certified_count: 1,
    today_attendance_pct: 96.5,
  });

  const [recentPlacements, setRecentPlacements] = useState<any[]>([]);
  const [studentPlacement, setStudentPlacement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const statsRes = await fetch(
          `/api/backend/api/pkl/stats?role=${role}&teacher_id=${user?.teacher_id || 1}&student_id=${user?.student_id || 2}`
        );
        if (statsRes.ok) {
          const sJson = await statsRes.json();
          if (sJson.stats) setStatsData(sJson.stats);
          if (sJson.placement) setStudentPlacement(sJson.placement);
        }

        // Placements
        let plUrl = "/api/backend/api/pkl/placements";
        if (isTeacher && user?.teacher_id) {
          plUrl += `?teacher_id=${user.teacher_id}`;
        }
        const plRes = await fetch(plUrl);
        if (plRes.ok) {
          const plJson = await plRes.json();
          if (plJson.placements) {
            setRecentPlacements(plJson.placements.slice(0, 5));
            if (isStudent && plJson.placements.length > 0) {
              setStudentPlacement(plJson.placements[0]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [role, user]);

  return (
    <div className="space-y-4">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white p-5 sm:p-6 shadow-sm border border-[#2e265c]">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46E5]/20 border border-[#6366F1]/30 text-[#A5B4FC] text-xs font-semibold">
              <FontAwesomeIcon icon={faBriefcase} className="text-[11px]" />
              <span>
                {isAdmin
                  ? "Portal Administrator Hubin Vokasi"
                  : isTeacher
                  ? "Portal Guru Pembimbing PKL"
                  : "Portal Siswa Praktik Kerja Lapangan"}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              {isAdmin
                ? "Selamat Datang di Si-PKL SMK"
                : isTeacher
                ? `Halo, ${user?.name || "Bpk/Ibu Guru Pembimbing"}`
                : `Semangat PKL, ${user?.name || "Siswa Vokasi"}!`}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              {isAdmin
                ? "Sistem terintegrasi untuk penugasan guru dari SIAK, plotting siswa ke DUDI mitra, verifikasi logbook harian, dan penerbitan sertifikat resmi."
                : isTeacher
                ? "Kelola siswa binaan Anda di industri DUDI, pantau absensi harian, verifikasi logbook kegiatan, dan input penilaian akhir."
                : "Dokumentasikan aktivitas industri harian Anda dengan foto geotag lokasi & waktu, pantau persentase kehadiran, dan unduh sertifikat resmi."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin ? (
              <>
                <Link
                  href="/mitra"
                  className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Tambah DUDI</span>
                </Link>
                <Link
                  href="/pembimbing"
                  className="px-4 py-2.5 rounded-xl bg-white text-[#1e1b4b] hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faChalkboardUser} />
                  <span>Tugaskan Guru SIAK</span>
                </Link>
              </>
            ) : isTeacher ? (
              <>
                <Link
                  href="/jurnal"
                  className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span>Review Jurnal Siswa</span>
                </Link>
                <Link
                  href="/penilaian"
                  className="px-4 py-2.5 rounded-xl bg-white text-[#1e1b4b] hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faAward} />
                  <span>Input Nilai DUDI</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/jurnal"
                  className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Input Jurnal Harian</span>
                </Link>
                <Link
                  href="/penilaian"
                  className="px-4 py-2.5 rounded-xl bg-white text-[#1e1b4b] hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCertificate} />
                  <span>Cek Nilai & Sertifikat</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isAdmin ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Siswa PKL</span>
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.total_students || 4}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Siswa terdaftar aktif</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Mitra DUDI</span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faBuilding} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.total_companies || 4}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Perusahaan MoU aktif</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Jurnal Review</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.pending_journals || 0}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Menunggu verifikasi guru</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Sertifikat Terbit</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faAward} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.certified_count || 1}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tervalidasi & ber-QR code</p>
            </div>
          </>
        ) : isTeacher ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Siswa Binaan</span>
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.total_students || 4}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Di bawah bimbingan Anda</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">DUDI Diampu</span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faBuilding} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.total_companies || 2}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lokasi mitra industri</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Perlu Disetujui</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.pending_journals || 0}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Logbook jurnal siswa binaan</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Kehadiran Binaan</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">98.0%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rata-rata kehadiran industri</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Jurnal Saya</span>
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.total_journals || 2}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Aktivitas terlaporkan</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Kehadiran</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.attendance_pct || 96.5}%</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Memenuhi syarat min. 85%</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Progres PKL</span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faClock} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{statsData.progress || 85}%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Periode Juli - Oktober</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Sertifikat</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xs font-black">
                  <FontAwesomeIcon icon={faCertificate} />
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 mt-2.5">
                {statsData.is_certified ? "Diterbitkan" : "Dalam Proses"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {statsData.is_certified ? "Siap Diunduh" : "Menunggu nilai akhir"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Detail Penempatan Siswa (Khusus Siswa) */}
      {isStudent && studentPlacement && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-[#4F46E5]" />
            <span>Informasi Penempatan Magang Industri Anda</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Mitra DUDI</p>
              <p className="text-sm font-black text-slate-900">{studentPlacement.company_name}</p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <FontAwesomeIcon icon={faLocationDot} className="text-[#4F46E5]" />
                {studentPlacement.company_city || "Singaraja"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Guru Pembimbing Sekolah</p>
              <p className="text-sm font-black text-slate-900">
                {studentPlacement.teacher_mentor_name || "Drs. Leonard Snyder, M.Pd."}
              </p>
              <p className="text-slate-500 text-[11px]">Koordinator Bimbingan Akademik</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Mentor Lapangan Industri</p>
              <p className="text-sm font-black text-slate-900">
                {studentPlacement.industry_mentor_name || studentPlacement.company_pic || "PIC DUDI"}
              </p>
              <p className="text-slate-500 text-[11px]">Instruktur / Kepala Divisi Industri</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Penempatan & Monitoring (Untuk Admin & Guru Pembimbing) */}
      {(isAdmin || isTeacher) && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTeacher ? "Daftar Siswa Binaan Anda" : "Penempatan Siswa Terbaru"}
              </h3>
              <p className="text-xs text-slate-800 font-bold mt-0.5">
                Monitoring progres kerja dan status sertifikasi siswa di industri
              </p>
            </div>

            <Link
              href="/penempatan"
              className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua Penempatan</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Siswa</th>
                  <th className="py-2.5 px-3">Mitra DUDI</th>
                  <th className="py-2.5 px-3">Guru Pembimbing</th>
                  <th className="py-2.5 px-3 text-center">Progres PKL</th>
                  <th className="py-2.5 px-3 text-center">Sertifikat</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentPlacements.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{p.student_name}</p>
                      <p className="text-[10px] text-slate-500">{p.nisn} • {p.major}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-800">{p.company_name}</p>
                      <p className="text-[10px] text-slate-500">{p.company_city || "Singaraja"}</p>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {p.teacher_mentor_name || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span>{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[#4F46E5] rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          p.is_certified === 1
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.is_certified === 1 ? "Terbit" : "Draft"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/jurnal?placement_id=${p.id}`}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#4F46E5] hover:text-white text-[#4F46E5] font-bold text-[11px] transition inline-flex items-center gap-1"
                      >
                        <span>Jurnal</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
