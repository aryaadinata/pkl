"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faSearch,
  faBuilding,
  faCalendarDays,
  faDownload,
  faLocationDot,
  faChalkboardUser,
  faPhone,
  faCheckCircle,
  faTrashCan,
  faXmark,
  faArrowRight,
  faUserTie,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

interface Placement {
  id: number;
  company_id: number;
  teacher_id?: number;
  student_id?: number;
  student_name: string;
  nisn: string;
  major: string;
  class_name: string;
  company_name: string;
  company_city?: string;
  company_address?: string;
  company_pic?: string;
  company_pic_phone?: string;
  company_sector?: string;
  teacher_mentor_name: string;
  industry_mentor_name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  total_journals?: number;
  pending_journals?: number;
}

interface Company {
  id: number;
  company_name: string;
  city: string;
  pic_name: string;
  quota: number;
}

interface StudentOption {
  id: number;
  name: string;
  nisn: string;
  company_name?: string;
}

interface TeacherOption {
  id: number;
  full_name: string;
}

interface MajorOption {
  id: number;
  code: string;
  name: string;
}

export default function PenempatanSiswaPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<TeacherOption[]>([]);
  const [majorsList, setMajorsList] = useState<MajorOption[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Admin
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [major, setMajor] = useState("Rekayasa Perangkat Lunak (RPL)");
  const [className, setClassName] = useState("XII RPL 1");
  const [startDate, setStartDate] = useState("2024-07-15");
  const [endDate, setEndDate] = useState("2024-10-15");

  const fetchPlacements = async () => {
    try {
      setIsLoading(true);
      let url = "/api/backend/api/pkl/placements";
      const params = new URLSearchParams();

      if (isTeacher && user?.teacher_id) {
        params.append("teacher_id", user.teacher_id.toString());
      } else if (isStudent && user?.student_id) {
        params.append("student_id", user.student_id.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.placements) {
          setPlacements(data.placements);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [cRes, sRes, tRes, mRes] = await Promise.all([
        fetch("/api/backend/api/pkl/companies"),
        fetch("/api/backend/api/pkl/students-available"),
        fetch("/api/backend/api/pkl/teachers-available"),
        fetch("/api/backend/api/majors"),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCompanies(cData.companies || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setAvailableStudents(sData.students || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setAvailableTeachers(tData.teachers || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.data && Array.isArray(mData.data)) {
          setMajorsList(mData.data);
          if (mData.data.length > 0) {
            setMajor(`${mData.data[0].name} (${mData.data[0].code})`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlacements();
    if (isAdmin) {
      fetchOptions();
    }
  }, [role, user]);

  const handleCreatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCompanyId || !selectedTeacherId) {
      Swal.fire("Peringatan", "Lengkapi pilihan Siswa, Mitra DUDI, dan Guru Pembimbing", "warning");
      return;
    }

    try {
      const res = await fetch("/api/backend/api/pkl/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: parseInt(selectedStudentId),
          company_id: parseInt(selectedCompanyId),
          teacher_id: parseInt(selectedTeacherId),
          major,
          class_name: className,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: json.message,
          timer: 1500,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        fetchPlacements();
      } else {
        Swal.fire("Gagal", json.error || "Gagal menyimpan penempatan", "error");
      }
    } catch {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    }
  };

  const handleDeletePlacement = (p: Placement) => {
    Swal.fire({
      title: "Hapus Penempatan?",
      text: `Hapus penempatan ${p.student_name} di ${p.company_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/backend/api/pkl/placements/${p.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            Swal.fire("Dihapus!", "Penempatan berhasil dihapus.", "success");
            fetchPlacements();
          }
        } catch {
          Swal.fire("Error", "Gagal menghapus penempatan", "error");
        }
      }
    });
  };

  const handlePrintSuratTugas = (studentName: string, company: string) => {
    Swal.fire({
      icon: "success",
      title: "Mencetak Surat Tugas",
      text: `Surat Tugas PKL untuk ${studentName} di ${company} sedang digenerate.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filtered = placements.filter(
    (p) =>
      p.student_name.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name.toLowerCase().includes(search.toLowerCase()) ||
      p.major.toLowerCase().includes(search.toLowerCase()) ||
      (p.teacher_mentor_name && p.teacher_mentor_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm">
                <FontAwesomeIcon icon={faUsers} />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {isTeacher
                  ? "Daftar Siswa Binaan & Mitra DUDI"
                  : isStudent
                  ? "Informasi Penempatan PKL Saya"
                  : "Penempatan Siswa & Pembimbing DUDI"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isTeacher
                ? `Menampilkan daftar seluruh siswa yang berada di bawah bimbingan Anda (${user?.name || "Guru Pembimbing"}).`
                : isStudent
                ? "Rincian lokasi DUDI tempat Anda melaksanakan PKL, mentor industri, dan guru pembimbing."
                : "Admin memplot siswa dari SIAK ke mitra industri DUDI dan menetapkan guru pembimbingnya."}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                fetchOptions();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98 shrink-0"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Tambah Penempatan Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96 relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa, DUDI, jurusan, atau pembimbing..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> Siswa Terdaftar
        </div>
      </div>

      {/* Grid Kartu Penempatan */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Memuat data penempatan siswa...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-lg mx-auto mb-3">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Data Penempatan</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? "Belum ada siswa yang ditugaskan di bawah bimbingan Anda."
              : "Belum ada data penempatan yang sesuai dengan filter pencarian."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Siswa & Status */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm font-bold shrink-0">
                      {p.student_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight">
                        {p.student_name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        NISN: {p.nisn} • {p.class_name || p.major}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePlacement(p)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="Hapus penempatan"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mitra DUDI & Lokasi */}
                <div className="my-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Mitra Industri (DUDI)
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                      <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" />
                      {p.company_city || "Singaraja"}
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faBuilding} className="text-indigo-600 text-xs" />
                    <span>{p.company_name}</span>
                  </h5>
                  {p.company_address && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{p.company_address}</p>
                  )}
                </div>

                {/* Info Pembimbing */}
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                    <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <FontAwesomeIcon icon={faChalkboardUser} className="text-[#4F46E5]" />
                      Guru Pembimbing
                    </p>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                      {p.teacher_mentor_name || "Belum Ditentukan"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                    <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <FontAwesomeIcon icon={faUserTie} className="text-purple-600" />
                      Mentor Industri
                    </p>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                      {p.industry_mentor_name || p.company_pic || "PIC DUDI"}
                    </p>
                  </div>
                </div>

                {/* Progres & Periode */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[#4F46E5] text-[10px]" />
                    {p.start_date} s/d {p.end_date}
                  </span>
                  <span className="font-bold text-slate-700">{p.progress}% Selesai</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handlePrintSuratTugas(p.student_name, p.company_name)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-300 font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-[10px]" />
                  <span>Surat Tugas</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/jurnal?placement_id=${p.id}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-[#4F46E5] hover:text-white text-[#4F46E5] font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Logbook Jurnal</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                  </Link>

                  {isTeacher && (
                    <Link
                      href={`/penilaian?placement_id=${p.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[11px] shadow-2xs transition"
                    >
                      <span>Input Nilai</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Penempatan (Role Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <h3 className="text-sm font-black text-slate-800">
                  Plotting Siswa ke DUDI & Guru Pembimbing
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCreatePlacement} className="space-y-3.5 mt-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Siswa (Database SIAK) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] bg-white font-medium"
                  required
                >
                  <option value="">-- Pilih Siswa Aktif --</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NISN: {s.nisn}) {s.company_name ? `[Sudah di ${s.company_name}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Mitra Industri (DUDI) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] bg-white font-medium"
                  required
                >
                  <option value="">-- Pilih DUDI Mitra --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.city}) - Kuota: {c.quota} siswa
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Guru Pembimbing (SIAK) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] bg-white font-medium"
                  required
                >
                  <option value="">-- Pilih Guru Pembimbing --</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program Keahlian</label>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1] bg-white font-medium"
                  >
                    {majorsList.length > 0 ? (
                      majorsList.map((m) => (
                        <option key={m.id} value={`${m.name} (${m.code})`}>
                          {m.name} ({m.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Rekayasa Perangkat Lunak (RPL)">Rekayasa Perangkat Lunak (RPL)</option>
                        <option value="Teknik Komputer & Jaringan (TKJ)">Teknik Komputer & Jaringan (TKJ)</option>
                        <option value="Akuntansi & Keuangan Lembaga (AKL)">Akuntansi & Keuangan Lembaga (AKL)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold shadow-sm transition"
                >
                  Simpan Penempatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
