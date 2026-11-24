"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faPlus,
  faSearch,
  faCheck,
  faClock,
  faTriangleExclamation,
  faBuilding,
  faCalendarDay,
  faCheckCircle,
  faXmark,
  faCamera,
  faLocationDot,
  faPrint,
  faEye,
  faFilter,
  faUser,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { usePkl } from "@/context/PklContext";

interface JournalEntry {
  id: number;
  placement_id: number;
  student_name: string;
  nisn: string;
  major: string;
  class_name?: string;
  company_name: string;
  date: string;
  hours_spent: number;
  activity_title: string;
  activity_description: string;
  documentation_url?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  captured_at?: string;
  status: "Pending" | "Disetujui" | "Perlu Revisi";
  rejection_note?: string;
  verified_by?: string;
  verified_at?: string;
}

export default function JurnalPklPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const { settings } = usePkl();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal Input Jurnal (Role Siswa)
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedJournalForDetail, setSelectedJournalForDetail] = useState<JournalEntry | null>(null);

  // Form State
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [hoursSpent, setHoursSpent] = useState(8);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [capturedTime, setCapturedTime] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);

  const fetchJournals = async () => {
    try {
      setIsLoading(true);
      let url = "/api/backend/api/pkl/journals";
      const params = new URLSearchParams();

      if (isTeacher && user?.teacher_id) {
        params.append("teacher_id", user.teacher_id.toString());
      } else if (isStudent && user?.student_id) {
        params.append("student_id", user.student_id.toString());
      }

      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.journals) {
          setJournals(data.journals);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [role, user, filterStatus]);

  // Deteksi Geolocation GPS & Waktu Otomatis
  const handleDetectLocationAndTime = () => {
    setIsLocating(true);
    const nowStr = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
    setCapturedTime(nowStr);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = parseFloat(pos.coords.latitude.toFixed(6));
          const longitude = parseFloat(pos.coords.longitude.toFixed(6));
          setLat(latitude);
          setLng(longitude);
          setLocationName(
            user?.company_name
              ? `${user.company_name} (GPS: ${latitude}, ${longitude})`
              : `Kantor Industri Mitra (GPS: ${latitude}, ${longitude})`
          );
          setIsLocating(false);
          Swal.fire({
            icon: "success",
            title: "Lokasi & Waktu Terdeteksi!",
            text: `Koordinat: ${latitude}, ${longitude} pada ${nowStr}`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
        () => {
          // Fallback bila ditolak user / emulator
          const fallbackLat = -8.11245;
          const fallbackLng = 115.08821;
          setLat(fallbackLat);
          setLng(fallbackLng);
          setLocationName(`${user?.company_name || "PT Mitra DUDI"} (${fallbackLat}, ${fallbackLng})`);
          setIsLocating(false);
          Swal.fire({
            icon: "info",
            title: "Lokasi Default DUDI",
            text: `Menggunakan koordinat DUDI: ${fallbackLat}, ${fallbackLng}`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      setLocationName(user?.company_name || "Lokasi DUDI");
    }
  };

  // Upload Foto Dokumentasi
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        if (!locationName || !capturedTime) {
          handleDetectLocationAndTime();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Jurnal Baru (Role Siswa)
  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle || !activityDesc) {
      Swal.fire("Peringatan", "Judul dan deskripsi kegiatan wajib diisi", "warning");
      return;
    }

    try {
      const res = await fetch("/api/backend/api/pkl/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement_id: user?.placement_id || 1,
          date: dateVal,
          hours_spent: hoursSpent,
          activity_title: activityTitle,
          activity_description: activityDesc,
          documentation_url: photoPreview,
          location_name: locationName || `${user?.company_name || "Mitra DUDI"} Singaraja`,
          latitude: lat || -8.11245,
          longitude: lng || 115.08821,
          captured_at: capturedTime || new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Jurnal Terkirim!",
          text: "Jurnal harian berhasil disimpan dan menunggu verifikasi guru pembimbing.",
        });
        setIsInputModalOpen(false);
        setActivityTitle("");
        setActivityDesc("");
        setPhotoPreview("");
        setLocationName("");
        fetchJournals();
      } else {
        Swal.fire("Gagal", json.error || "Gagal menyimpan jurnal", "error");
      }
    } catch {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    }
  };

  // Verifikasi Jurnal (Role Guru Pembimbing)
  const handleVerifyJournal = async (journalId: number, status: "Disetujui" | "Perlu Revisi") => {
    if (status === "Perlu Revisi") {
      const { value: note } = await Swal.fire({
        title: "Catatan Revisi Jurnal",
        input: "textarea",
        inputLabel: "Tuliskan arahan/koreksi untuk siswa binaan:",
        inputPlaceholder: "Contoh: Mohon lengkapi dokumentasi foto saat setting konfigurasi...",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        confirmButtonText: "Kirim Permintaan Revisi",
        cancelButtonText: "Batal",
      });

      if (!note) return;

      try {
        const res = await fetch(`/api/backend/api/pkl/journals/${journalId}/verify`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Perlu Revisi",
            rejection_note: note,
            verified_by: user?.name || "Guru Pembimbing",
          }),
        });
        if (res.ok) {
          Swal.fire("Berhasil", "Permintaan revisi jurnal telah dikirim ke siswa.", "success");
          fetchJournals();
        }
      } catch {
        Swal.fire("Error", "Gagal memperbarui status jurnal", "error");
      }
    } else {
      Swal.fire({
        title: "Setujui Jurnal Ini?",
        text: "Jurnal harian siswa akan disetujui dan masuk dalam penilaian kehadiran/aktivitas.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#4F46E5",
        confirmButtonText: "Ya, Setujui",
        cancelButtonText: "Batal",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await fetch(`/api/backend/api/pkl/journals/${journalId}/verify`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "Disetujui",
                verified_by: user?.name || "Guru Pembimbing",
              }),
            });
            if (res.ok) {
              Swal.fire("Disetujui!", "Jurnal siswa telah berhasil diverifikasi.", "success");
              fetchJournals();
            }
          } catch {
            Swal.fire("Error", "Gagal memverifikasi jurnal", "error");
          }
        }
      });
    }
  };

  const filtered = journals.filter((j) => {
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    const matchSearch =
      j.student_name.toLowerCase().includes(search.toLowerCase()) ||
      j.activity_title.toLowerCase().includes(search.toLowerCase()) ||
      j.activity_description.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm">
                <FontAwesomeIcon icon={faBookOpen} />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {isStudent
                  ? "Logbook & Jurnal Kegiatan Harian PKL"
                  : isTeacher
                  ? "Verifikasi & Review Jurnal Siswa Binaan"
                  : "Rekapitulasi Jurnal Harian Seluruh Siswa"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isStudent
                ? "Isi jurnal harian pekerjaan di industri beserta foto yang dilengkapi tag waktu dan lokasi GPS."
                : isTeacher
                ? "Tinjau dan setujui jurnal kegiatan harian siswa binaan untuk memastikan kesesuaian kompetensi."
                : "Monitoring seluruh logbook aktivitas harian siswa PKL dari seluruh mitra DUDI."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Cetak Jurnal (Role Siswa & Guru) */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer active:scale-98"
              title="Cetak format logbook PKL resmi"
            >
              <FontAwesomeIcon icon={faPrint} className="text-[#4F46E5]" />
              <span>Cetak Jurnal</span>
            </button>

            {/* Tombol Input Jurnal (Khusus Siswa atau Admin Demo) */}
            {(isStudent || isAdmin) && (
              <button
                onClick={() => {
                  handleDetectLocationAndTime();
                  setIsInputModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Input Jurnal Hari Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Status & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Semua Jurnal" },
            { id: "Pending", label: "Menunggu Review" },
            { id: "Disetujui", label: "Disetujui" },
            { id: "Perlu Revisi", label: "Perlu Revisi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80 relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas, siswa, atau DUDI..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </div>
      </div>

      {/* Feed List Jurnal */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Memuat logbook jurnal PKL...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-lg mx-auto mb-3">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Jurnal Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isStudent
              ? "Anda belum menginput jurnal pada filter ini. Klik tombol Input Jurnal untuk menambahkan aktivitas."
              : "Belum ada entri jurnal yang sesuai dengan status/pencarian."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <div
              key={j.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-indigo-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-xs font-black shrink-0">
                    {j.student_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{j.student_name}</h4>
                    <p className="text-[10px] text-slate-500">
                      {j.major} • <span className="font-semibold text-slate-700">{j.company_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <FontAwesomeIcon icon={faCalendarDay} className="text-[#4F46E5] text-[10px]" />
                    {j.date} ({j.hours_spent} Jam Kerja)
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      j.status === "Disetujui"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : j.status === "Perlu Revisi"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
              </div>

              {/* Konten Aktivitas */}
              <div className="my-3">
                <h3 className="text-sm font-bold text-slate-900 mb-1">{j.activity_title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{j.activity_description}</p>

                {/* Metadata Lokasi & Waktu Tag */}
                {(j.location_name || j.captured_at) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                    {j.location_name && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-100 text-[#4F46E5] font-medium">
                        <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                        <span>{j.location_name}</span>
                      </span>
                    )}
                    {j.captured_at && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        <span>Tag Waktu: {j.captured_at}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Catatan Revisi jika ada */}
                {j.rejection_note && (
                  <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <p className="font-bold flex items-center gap-1 mb-0.5">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      Catatan Pembimbing:
                    </p>
                    <p>{j.rejection_note}</p>
                  </div>
                )}
              </div>

              {/* Footer Tindakan */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400">
                  {j.verified_by ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                      Diverifikasi oleh: {j.verified_by}
                    </span>
                  ) : (
                    <span>Menunggu verifikasi guru pembimbing</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedJournalForDetail(j)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-1 text-slate-400" />
                    <span>Rincian & Foto</span>
                  </button>

                  {/* Tindakan Guru Pembimbing: Setujui / Revisi */}
                  {isTeacher && j.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleVerifyJournal(j.id, "Perlu Revisi")}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                      >
                        Minta Revisi
                      </button>
                      <button
                        onClick={() => handleVerifyJournal(j.id, "Disetujui")}
                        className="px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                        Setujui
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Input Jurnal Siswa (dengan Foto, Tag Lokasi & Waktu) */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
                <h3 className="text-sm font-black text-slate-800">
                  Input Jurnal Harian PKL
                </h3>
              </div>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmitJournal} className="space-y-3.5 mt-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi Kerja (Jam)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(parseInt(e.target.value) || 8)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Aktivitas / Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="Contoh: Pembuatan Modul Auth & Konfigurasi Router MikroTik"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Lengkap Kegiatan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Jelaskan secara rinci alat/bahan yang digunakan, langkah kerja, kendala yang dihadapi, dan hasil pekerjaan..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                  required
                />
              </div>

              {/* Upload Foto Dokumentasi & Watermark Geotag */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCamera} className="text-[#4F46E5]" />
                    <span>Upload Foto Dokumentasi</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocationAndTime}
                    disabled={isLocating}
                    className="text-[10px] font-bold text-[#4F46E5] hover:underline flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faLocationDot} />
                    <span>{isLocating ? "Mencari GPS..." : "Perbarui Lokasi GPS"}</span>
                  </button>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#4F46E5] hover:file:bg-indigo-100 cursor-pointer"
                />

                {/* Preview Foto dengan Geotag Watermark */}
                {photoPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 mt-2 bg-slate-900 max-h-48 flex items-center justify-center">
                    <img src={photoPreview} alt="Preview Dokumentasi" className="object-contain w-full h-full max-h-48" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 text-white text-[10px]">
                      <p className="font-bold flex items-center gap-1 truncate">
                        <FontAwesomeIcon icon={faLocationDot} className="text-amber-400" />
                        {locationName || "Lokasi DUDI Mitra"}
                      </p>
                      <p className="text-slate-300 flex items-center gap-1 truncate">
                        <FontAwesomeIcon icon={faClock} className="text-indigo-400" />
                        {capturedTime || "Waktu Lokal"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lokasi Manual / Display */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Tag Lokasi Terpasang:
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Nama lokasi atau alamat DUDI..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold shadow-sm transition"
                >
                  Kirim Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Foto Jurnal */}
      {selectedJournalForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">
                Rincian Logbook Jurnal PKL
              </h3>
              <button
                onClick={() => setSelectedJournalForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Siswa & DUDI</p>
                <p className="font-bold text-slate-800 text-sm">{selectedJournalForDetail.student_name}</p>
                <p className="text-slate-500">{selectedJournalForDetail.company_name} • {selectedJournalForDetail.major}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Judul Aktivitas</p>
                <p className="font-bold text-slate-900">{selectedJournalForDetail.activity_title}</p>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{selectedJournalForDetail.activity_description}</p>
              </div>

              {selectedJournalForDetail.documentation_url ? (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Foto Dokumentasi</p>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-56 flex items-center justify-center">
                    <img
                      src={selectedJournalForDetail.documentation_url}
                      alt="Dokumentasi Jurnal"
                      className="object-contain w-full h-full max-h-56"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 text-white text-[10px]">
                      <p className="font-bold flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="text-amber-400" />
                        {selectedJournalForDetail.location_name || "Lokasi DUDI"}
                      </p>
                      <p className="text-slate-300">
                        {selectedJournalForDetail.captured_at || selectedJournalForDetail.date}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-[#4F46E5]">
                  <p className="font-bold flex items-center gap-1">
                    <FontAwesomeIcon icon={faLocationDot} />
                    Tag Lokasi: {selectedJournalForDetail.location_name || "Kantor Industri DUDI"}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Waktu Dicatat: {selectedJournalForDetail.captured_at || selectedJournalForDetail.date}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedJournalForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Jurnal Resmi (Logbook Siap Print / PDF) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faPrint} />
                </span>
                <h3 className="text-sm font-black text-slate-800">
                  Cetak Lembar Jurnal PKL (Format Resmi)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FontAwesomeIcon icon={faPrint} />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Dokumen Printable */}
            <div className="mt-4 p-4 border border-slate-200 rounded-xl text-slate-900 text-xs font-sans">
              {/* Kop Surat */}
              <div className="text-center pb-3 border-b-2 border-slate-800 mb-4">
                <h2 className="text-sm font-extrabold uppercase tracking-wide">
                  LEMBAR JURNAL / LOGBOOK PRAKTIK KERJA LAPANGAN (PKL)
                </h2>
                <h3 className="text-xs font-bold text-slate-700 uppercase">
                  SEKOLAH MENENGAH KEJURUAN (SMK)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Tahun Ajaran {settings?.academic_year || "2024/2025"} • Semester {settings?.semester || "Ganjil"}
                </p>
              </div>

              {/* Identitas Siswa */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                <div>
                  <p><span className="font-bold">Nama Siswa:</span> {user?.name || "I Putu Arya Wira"}</p>
                  <p><span className="font-bold">NISN:</span> {user?.nisn || "0078100004"}</p>
                  <p><span className="font-bold">Program Keahlian:</span> {user?.major || "Rekayasa Perangkat Lunak (RPL)"}</p>
                </div>
                <div>
                  <p><span className="font-bold">Mitra DUDI:</span> {user?.company_name || "PT Bali Cyber Solusindo"}</p>
                  <p><span className="font-bold">Guru Pembimbing:</span> {user?.teacher_mentor_name || "Drs. Leonard Snyder, M.Pd."}</p>
                  <p><span className="font-bold">Total Jam Tercatat:</span> {journals.reduce((acc, j) => acc + (j.hours_spent || 0), 0)} Jam</p>
                </div>
              </div>

              {/* Tabel Logbook */}
              <table className="w-full border-collapse border border-slate-300 text-[10px] mb-6">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-300 p-2 w-8">No</th>
                    <th className="border border-slate-300 p-2 w-20">Tanggal</th>
                    <th className="border border-slate-300 p-2 w-16">Jam</th>
                    <th className="border border-slate-300 p-2">Uraian Pekerjaan / Kompetensi</th>
                    <th className="border border-slate-300 p-2 w-32">Lokasi / Geotag</th>
                    <th className="border border-slate-300 p-2 w-20">Status</th>
                    <th className="border border-slate-300 p-2 w-20">Paraf DUDI</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((j, idx) => (
                    <tr key={j.id}>
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 text-center whitespace-nowrap">{j.date}</td>
                      <td className="border border-slate-300 p-2 text-center">{j.hours_spent} Jam</td>
                      <td className="border border-slate-300 p-2">
                        <p className="font-bold text-[11px]">{j.activity_title}</p>
                        <p className="text-slate-600 line-clamp-2 mt-0.5">{j.activity_description}</p>
                      </td>
                      <td className="border border-slate-300 p-2 text-center text-[9px] text-slate-500">
                        {j.location_name || "-"}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {j.status}
                      </td>
                      <td className="border border-slate-300 p-2 text-center text-slate-300">
                        [ Paraf ]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Kolom Tanda Tangan */}
              <div className="grid grid-cols-3 gap-4 text-center text-[10px] pt-4">
                <div>
                  <p className="text-slate-500 mb-12">Siswa Pelaksana PKL,</p>
                  <p className="font-bold underline">{user?.name || "I Putu Arya Wira"}</p>
                  <p className="text-slate-500">NISN: {user?.nisn || "0078100004"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Pembimbing Industri (DUDI),</p>
                  <p className="font-bold underline">Bpk. Gede Aditya</p>
                  <p className="text-slate-500">Lead Engineer DUDI</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Guru Pembimbing Sekolah,</p>
                  <p className="font-bold underline">Drs. Leonard Snyder, M.Pd.</p>
                  <p className="text-slate-500">NIP: 198005122005011004</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
