"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardUser,
  faPlus,
  faSearch,
  faUsers,
  faBuilding,
  faTrashCan,
  faPhone,
  faIdCard,
  faCheck,
  faXmark,
  faArrowsRotate,
  faUserCheck,
  faSpinner,
  faCheckSquare,
  faSquare,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

interface Mentor {
  id: number;
  teacher_id: number;
  teacher_name: string;
  nip: string;
  phone: string | null;
  academic_year: string;
  is_active: number;
  total_students: number;
  total_companies: number;
  photo?: string | null;
  created_at?: string;
}

interface AvailableTeacher {
  id: number;
  nip: string;
  name: string;
  full_name: string;
  phone?: string | null;
  photo?: string | null;
  is_mentor: number;
  total_students?: number;
}

export default function PembimbingPage() {
  const { isAdmin } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/backend/api/pkl/mentors");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.mentors) {
          setMentors(data.mentors);
        }
      }
    } catch (e) {
      console.error("Gagal memuat data pembimbing:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const res = await fetch("/api/backend/api/pkl/teachers-available?exclude_mentors=true");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.teachers) {
          setAvailableTeachers(data.teachers);
          return data.teachers as AvailableTeacher[];
        }
      }
    } catch (e) {
      console.error("Gagal memuat guru SIAK:", e);
    }
    return [];
  };

  useEffect(() => {
    fetchMentors();
    fetchAvailableTeachers();
  }, []);

  // Filter guru yang BELUM menjadi pembimbing PKL (guru yang sudah menjadi pembimbing tidak ditampilkan lagi di modal)
  const unassignedTeachers = useMemo(() => {
    const mentorTeacherIds = new Set(mentors.map((m) => m.teacher_id));
    return availableTeachers.filter(
      (t) => (t.is_mentor === 0 || !t.is_mentor) && !mentorTeacherIds.has(t.id)
    );
  }, [availableTeachers, mentors]);

  // Buka modal penugasan
  const handleOpenModal = async () => {
    setModalSearch("");
    setSelectedTeacherIds([]);
    await fetchAvailableTeachers();
    setIsModalOpen(true);
  };

  // Toggle pilihan guru satu per satu
  const handleToggleTeacher = (id: number) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter guru di dalam modal berdasarkan pencarian
  const filteredModalTeachers = useMemo(() => {
    if (!modalSearch.trim()) return unassignedTeachers;
    const q = modalSearch.toLowerCase();
    return unassignedTeachers.filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        (t.nip && t.nip.toLowerCase().includes(q))
    );
  }, [unassignedTeachers, modalSearch]);

  // Tombol Pilih Semua guru yang tampil di modal
  const handleSelectAllVisible = () => {
    const visibleIds = filteredModalTeachers.map((t) => t.id);
    setSelectedTeacherIds((prev) => {
      const merged = new Set([...prev, ...visibleIds]);
      return Array.from(merged);
    });
  };

  // Tombol Kosongkan pilihan guru yang tampil di modal
  const handleDeselectAllVisible = () => {
    const visibleIdsSet = new Set(filteredModalTeachers.map((t) => t.id));
    setSelectedTeacherIds((prev) => prev.filter((id) => !visibleIdsSet.has(id)));
  };

  // Simpan penugasan guru secara massal (batch)
  const handleSaveBulkMentors = async () => {
    if (selectedTeacherIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Guru",
        text: "Silakan centang setidaknya satu guru yang akan ditugaskan sebagai pembimbing PKL.",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/backend/api/pkl/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_ids: selectedTeacherIds,
          academic_year: "2024/2025",
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: json.message || "Penugasan guru pembimbing PKL berhasil disimpan.",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        setSelectedTeacherIds([]);
        fetchMentors();
        fetchAvailableTeachers();
      } else {
        Swal.fire("Gagal", json.error || "Gagal menyimpan penugasan guru", "error");
      }
    } catch {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus satu pembimbing dari tabel
  const handleDeleteMentor = (mentor: Mentor) => {
    if (mentor.total_students > 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Dapat Dihapus",
        text: `Guru ${mentor.teacher_name} saat ini masih membina ${mentor.total_students} siswa PKL. Harap alihkan atau lepaskan penempatan siswanya terlebih dahulu di menu Penempatan.`,
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    Swal.fire({
      title: "Hapus Penugasan?",
      text: `Apakah Anda yakin ingin menghapus ${mentor.teacher_name} dari daftar Guru Pembimbing PKL?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/backend/api/pkl/mentors/${mentor.id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (res.ok && json.success) {
            Swal.fire({
              icon: "success",
              title: "Dihapus!",
              text: json.message || "Penugasan guru pembimbing berhasil dihapus.",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchMentors();
            fetchAvailableTeachers();
          } else {
            Swal.fire("Gagal", json.error || "Gagal menghapus penugasan", "error");
          }
        } catch {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  // Filter pembimbing untuk tabel utama
  const filteredMentors = useMemo(() => {
    if (!search.trim()) return mentors;
    const q = search.toLowerCase();
    return mentors.filter(
      (m) =>
        m.teacher_name.toLowerCase().includes(q) ||
        (m.nip && m.nip.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q))
    );
  }, [mentors, search]);

  // Statistik Ringkasan
  const totalStudents = useMemo(
    () => mentors.reduce((acc, m) => acc + (m.total_students || 0), 0),
    [mentors]
  );
  const totalCompanies = useMemo(
    () => mentors.reduce((acc, m) => acc + (m.total_companies || 0), 0),
    [mentors]
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-base">
                <FontAwesomeIcon icon={faChalkboardUser} />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800">
                  Guru Pembimbing PKL
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola penugasan guru pembimbing PKL yang terintegrasi langsung dari master guru{" "}
                  <strong>SIAK Cendekia</strong>.
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98 shrink-0"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Tugaskan Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faChalkboardUser} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Total Pembimbing
              </p>
              <p className="text-base font-black text-slate-800">
                {mentors.length}{" "}
                <span className="text-xs font-semibold text-slate-500">Guru</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] border border-indigo-200">
            T.A. 2024/2025
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Siswa Terbina
              </p>
              <p className="text-base font-black text-slate-800">
                {totalStudents}{" "}
                <span className="text-xs font-semibold text-slate-500">Siswa PKL</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Aktif
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Mitra Terhubung
              </p>
              <p className="text-base font-black text-slate-800">
                {totalCompanies}{" "}
                <span className="text-xs font-semibold text-slate-500">DUDI</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Kerjasama
          </span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama guru pembimbing, NIP, atau nomor kontak..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            fetchMentors();
            fetchAvailableTeachers();
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          title="Segarkan Data"
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
          <span>Refresh</span>
        </button>
      </div>

      {/* TABEL DATA PEMBIMBING PKL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg text-[#4F46E5]" />
            <span>Memuat data guru pembimbing PKL...</span>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-lg mx-auto mb-3">
              <FontAwesomeIcon icon={faChalkboardUser} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {search ? "Guru Tidak Ditemukan" : "Belum Ada Guru Pembimbing Ditugaskan"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {search
                ? "Tidak ada data guru pembimbing yang cocok dengan pencarian kata kunci Anda."
                : "Klik tombol \"Tugaskan Guru\" di atas untuk memilih guru dari master SIAK yang akan menjadi pembimbing PKL."}
            </p>
            {isAdmin && !search && (
              <button
                onClick={handleOpenModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Tugaskan Guru Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">No.</th>
                  <th className="py-3 px-4">Guru Pembimbing</th>
                  <th className="py-3 px-4">Kontak / No. HP</th>
                  <th className="py-3 px-4 text-center">Siswa Binaan</th>
                  <th className="py-3 px-4 text-center">DUDI Diampu</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMentors.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {/* No */}
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Guru Pembimbing & NIP */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.teacher_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center font-black text-xs shrink-0">
                            {m.teacher_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {m.teacher_name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <FontAwesomeIcon icon={faIdCard} className="text-[10px]" />
                            <span>NIP: {m.nip || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kontak / No HP dari SIAK */}
                    <td className="py-3 px-4">
                      {m.phone && m.phone.trim() && m.phone !== "-" ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 text-[10px]">
                            <FontAwesomeIcon icon={faPhone} />
                          </span>
                          <span>{m.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Siswa Binaan */}
                    <td className="py-3 px-4 text-center">
                      {m.total_students > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                          <span>{m.total_students} Siswa</span>
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs text-slate-400 bg-slate-100 border border-slate-200">
                          0 Siswa
                        </span>
                      )}
                    </td>

                    {/* DUDI Diampu */}
                    <td className="py-3 px-4 text-center">
                      {m.total_companies > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                          <span>{m.total_companies} DUDI</span>
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs text-slate-400 bg-slate-100 border border-slate-200">
                          0 DUDI
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Aktif</span>
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/penempatan?teacher_id=${m.teacher_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200"
                          title="Plotting DUDI & Siswa Binaan"
                        >
                          <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                          <span>Binaan</span>
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteMentor(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Hapus Penugasan Pembimbing"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {filteredMentors.length > 0 && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Menampilkan <strong>{filteredMentors.length}</strong> dari{" "}
              <strong>{mentors.length}</strong> guru pembimbing PKL
            </span>
            <span className="text-[11px] text-slate-400">
              * Guru yang memiliki siswa binaan aktif dilindungi dari penghapusan tidak sengaja.
            </span>
          </div>
        )}
      </div>

      {/* MODAL TUGASKAN GURU DENGAN CHECKBOX DAFTAR GURU YANG BELUM MENJADI PEMBIMBING */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm font-bold">
                  <FontAwesomeIcon icon={faUserCheck} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Tugaskan Guru Pembimbing PKL
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih guru dari SIAK yang belum menjadi pembimbing PKL, lalu klik Simpan Penugasan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Filter & Selection Toolbar */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              {/* Search */}
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Cari guru yang belum ditugaskan..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  disabled={unassignedTeachers.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition cursor-pointer disabled:opacity-40"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllVisible}
                  disabled={selectedTeacherIds.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-40"
                >
                  Kosongkan
                </button>
                <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-700">
                  {selectedTeacherIds.length} Dipilih dari {unassignedTeachers.length} Guru
                </span>
              </div>
            </div>

            {/* List Guru yang BELUM menjadi Pembimbing dengan Checkbox */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {unassignedTeachers.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-lg mx-auto mb-3">
                    <FontAwesomeIcon icon={faCheck} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Seluruh Guru Sudah Ditugaskan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Semua data guru aktif di SIAK saat ini sudah berstatus sebagai Guru Pembimbing PKL.
                  </p>
                </div>
              ) : filteredModalTeachers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Tidak ada guru yang cocok dengan pencarian &ldquo;{modalSearch}&rdquo;.
                </div>
              ) : (
                filteredModalTeachers.map((t) => {
                  const isChecked = selectedTeacherIds.includes(t.id);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTeacher(t.id)}
                      className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200/80 my-1"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox Icon */}
                        <div className="text-base shrink-0">
                          {isChecked ? (
                            <FontAwesomeIcon
                              icon={faCheckSquare}
                              className="text-[#4F46E5]"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faSquare}
                              className="text-slate-300"
                            />
                          )}
                        </div>

                        {/* Avatar */}
                        {t.photo ? (
                          <img
                            src={t.photo}
                            alt={t.full_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isChecked
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.name.charAt(0)}
                          </div>
                        )}

                        {/* Info Guru */}
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-800 truncate">
                            {t.full_name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>NIP: {t.nip || "Non-NIP"}</span>
                            {t.phone && t.phone.trim() ? (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-medium">{t.phone}</span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-300">No HP belum ada di SIAK</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                        Tersedia
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-b-2xl">
              <div className="text-xs text-slate-500">
                Total dipilih:{" "}
                <strong className="text-indigo-600 font-black">
                  {selectedTeacherIds.length}
                </strong>{" "}
                guru
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkMentors}
                  disabled={isSaving || unassignedTeachers.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                      <span>Simpan Penugasan ({selectedTeacherIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
