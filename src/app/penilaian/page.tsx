"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAward,
  faSearch,
  faCertificate,
  faEdit,
  faCheckCircle,
  faDownload,
  faPrint,
  faXmark,
  faBuilding,
  faUserGraduate,
  faChalkboardUser,
  faQrcode,
  faFileContract,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { usePkl } from "@/context/PklContext";

interface Assessment {
  id: number;
  placement_id: number;
  student_name: string;
  nisn: string;
  major: string;
  class_name?: string;
  company_name: string;
  company_city?: string;
  company_pic?: string;
  teacher_mentor_name?: string;
  start_date?: string;
  end_date?: string;
  industry_technical_score: number;
  industry_discipline_score: number;
  industry_teamwork_score: number;
  school_report_score: number;
  school_presentation_score: number;
  final_score: number;
  predicate: string;
  notes?: string;
  certificate_number?: string;
  certificate_qr_hash?: string;
  is_certified: number;
  issued_at?: string;
}

export default function PenilaianPklPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const { settings } = usePkl();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Form State Input Nilai (Role Guru)
  const [formPlacementId, setFormPlacementId] = useState<number>(0);
  const [techScore, setTechScore] = useState<number>(90);
  const [discScore, setDiscScore] = useState<number>(90);
  const [teamScore, setTeamScore] = useState<number>(90);
  const [reportScore, setReportScore] = useState<number>(88);
  const [presScore, setPresScore] = useState<number>(90);
  const [evalNotes, setEvalNotes] = useState<string>("");

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      let url = "/api/backend/api/pkl/assessments";
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
        if (data.success && data.assessments) {
          setAssessments(data.assessments);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [role, user]);

  // Buka Modal Input Nilai
  const handleOpenInputModal = (a: Assessment) => {
    setSelectedAssessment(a);
    setFormPlacementId(a.placement_id);
    setTechScore(Number(a.industry_technical_score) || 90);
    setDiscScore(Number(a.industry_discipline_score) || 90);
    setTeamScore(Number(a.industry_teamwork_score) || 90);
    setReportScore(Number(a.school_report_score) || 88);
    setPresScore(Number(a.school_presentation_score) || 90);
    setEvalNotes(a.notes || "");
    setIsInputModalOpen(true);
  };

  // Hitung Nilai Akhir & Predikat Dinamis
  const calculatedFinal = Number(
    (
      techScore * 0.3 +
      discScore * 0.15 +
      teamScore * 0.15 +
      reportScore * 0.2 +
      presScore * 0.2
    ).toFixed(2)
  );

  const calculatedPredicate =
    calculatedFinal >= 90
      ? "A (Sangat Baik)"
      : calculatedFinal >= 80
      ? "B (Baik)"
      : calculatedFinal >= 70
      ? "C (Cukup)"
      : "D (Kurang)";

  // Simpan Nilai (Guru Pembimbing)
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/backend/api/pkl/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement_id: formPlacementId,
          industry_technical_score: techScore,
          industry_discipline_score: discScore,
          industry_teamwork_score: teamScore,
          school_report_score: reportScore,
          school_presentation_score: presScore,
          notes: evalNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Nilai Tersimpan!",
          text: `Nilai akhir ${calculatedFinal} (${calculatedPredicate}) berhasil dicatat.`,
          timer: 1500,
          showConfirmButton: false,
        });
        setIsInputModalOpen(false);
        fetchAssessments();
      } else {
        Swal.fire("Gagal", json.error || "Gagal menyimpan nilai", "error");
      }
    } catch {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    }
  };

  // Penerbitan Sertifikat (Admin)
  const handleIssueCertificate = async (a: Assessment) => {
    Swal.fire({
      title: "Terbitkan Sertifikat Resmi?",
      html: `
        <div class="text-left text-xs space-y-1.5 mt-2">
          <p><strong>Nama Siswa:</strong> ${a.student_name}</p>
          <p><strong>Mitra DUDI:</strong> ${a.company_name}</p>
          <p><strong>Nilai Akhir:</strong> ${a.final_score} (${a.predicate})</p>
          <p class="text-indigo-600 mt-2 font-semibold">Sertifikat akan mendapatkan nomor resmi dan QR Code validasi keaslian.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4F46E5",
      confirmButtonText: "Ya, Terbitkan Sertifikat",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/backend/api/pkl/certificates/issue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placement_id: a.placement_id,
            }),
          });
          const json = await res.json();
          if (json.success) {
            Swal.fire({
              icon: "success",
              title: "Sertifikat Diterbitkan!",
              text: json.message,
            });
            fetchAssessments();
          } else {
            Swal.fire("Gagal", json.error || "Gagal menerbitkan sertifikat", "error");
          }
        } catch {
          Swal.fire("Error", "Gagal menerbitkan sertifikat", "error");
        }
      }
    });
  };

  // Buka Modal Cetak Sertifikat (Guru & Siswa & Admin)
  const handleOpenCertificateModal = (a: Assessment) => {
    setSelectedAssessment(a);
    setIsCertModalOpen(true);
  };

  const filtered = assessments.filter(
    (a) =>
      a.student_name.toLowerCase().includes(search.toLowerCase()) ||
      a.company_name.toLowerCase().includes(search.toLowerCase()) ||
      a.major.toLowerCase().includes(search.toLowerCase()) ||
      (a.certificate_number && a.certificate_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-sm">
                <FontAwesomeIcon icon={faAward} />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {isStudent
                  ? "Transparansi Nilai & Sertifikat PKL"
                  : isTeacher
                  ? "Input Nilai PKL & Sertifikat Siswa Binaan"
                  : "Rekapitulasi Nilai & Penerbitan Sertifikat PKL"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isStudent
                ? "Melihat rincian nilai kinerja dari mitra industri, nilai sekolah, serta cetak sertifikat resmi digital."
                : isTeacher
                ? "Input nilai hasil kolaborasi DUDI (kinerja teknis, disiplin) dan nilai laporan sekolah siswa binaan."
                : "Admin memvalidasi penilaian dan menerbitkan nomor sertifikat resmi kelulusan PKL."}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Statistics Bar */}
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
            placeholder="Cari nama siswa, DUDI, jurusan, atau no. sertifikat..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium">
            Total Siswa: <strong className="text-slate-900">{filtered.length}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] font-bold">
            Tersertifikasi: {filtered.filter((x) => x.is_certified === 1).length}
          </span>
        </div>
      </div>

      {/* Grid Kartu Penilaian & Sertifikat */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Memuat data penilaian dan sertifikat PKL...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-lg mx-auto mb-3">
            <FontAwesomeIcon icon={faAward} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Data Penilaian</h3>
          <p className="text-xs text-slate-500 mt-1">
            Data penilaian akan tampil setelah penempatan siswa diproses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Siswa */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#4F46E5] flex items-center justify-center text-xs font-black shrink-0">
                      {s.student_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{s.student_name}</h4>
                      <p className="text-[10px] text-slate-500">
                        NISN: {s.nisn} • {s.major}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.is_certified === 1
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {s.is_certified === 1 ? "Sertifikat Terbit" : "Draft Nilai"}
                  </span>
                </div>

                {/* Mitra DUDI */}
                <div className="my-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium truncate">
                    <FontAwesomeIcon icon={faBuilding} className="text-[#4F46E5]" />
                    {s.company_name}
                  </span>
                  {s.certificate_number && (
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {s.certificate_number}
                    </span>
                  )}
                </div>

                {/* Rincian Komponen Nilai */}
                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Nilai DUDI (60%)</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {s.industry_technical_score || 0}
                    </p>
                    <p className="text-[9px] text-slate-400">Teknis & Disiplin</p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Sekolah (40%)</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {s.school_report_score || 0}
                    </p>
                    <p className="text-[9px] text-slate-400">Laporan & Responsi</p>
                  </div>

                  <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100">
                    <p className="text-[9px] uppercase font-bold text-indigo-700">Nilai Akhir</p>
                    <p className="text-sm font-black text-[#4F46E5] mt-0.5">
                      {s.final_score || 0}
                    </p>
                    <p className="text-[9px] font-bold text-indigo-600 line-clamp-1">{s.predicate || "Belum Dinilai"}</p>
                  </div>
                </div>
              </div>

              {/* Tindakan Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Guru: Tombol Input Nilai */}
                {(isTeacher || isAdmin) && (
                  <button
                    onClick={() => handleOpenInputModal(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-[#4F46E5] text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-[10px]" />
                    <span>Input / Edit Nilai</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Admin: Tombol Terbitkan Sertifikat */}
                  {isAdmin && s.is_certified === 0 && (
                    <button
                      onClick={() => handleIssueCertificate(s)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faCertificate} />
                      <span>Terbitkan Sertifikat</span>
                    </button>
                  )}

                  {/* Cetak / Download Sertifikat (Bisa dibuka oleh Guru, Siswa, dan Admin jika sudah certified) */}
                  {s.is_certified === 1 ? (
                    <button
                      onClick={() => handleOpenCertificateModal(s)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faPrint} />
                      <span>Lihat / Cetak Sertifikat</span>
                    </button>
                  ) : isStudent ? (
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      Menunggu Terbit Admin
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Input Nilai PKL (Role Guru Pembimbing) */}
      {isInputModalOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs">
                  <FontAwesomeIcon icon={faAward} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Input Nilai PKL Siswa
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {selectedAssessment.student_name} ({selectedAssessment.company_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-3.5 mt-3.5 text-xs">
              {/* Bagian 1: Nilai DUDI / Industri */}
              <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2.5">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBuilding} className="text-[#4F46E5]" />
                  <span>Komponen Nilai Pembimbing DUDI / Industri (Bobot 60%)</span>
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Keterampilan Teknis (30%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={techScore}
                      onChange={(e) => setTechScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#6366F1]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Disiplin Kerja (15%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discScore}
                      onChange={(e) => setDiscScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#6366F1]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Kerjasama Tim (15%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={teamScore}
                      onChange={(e) => setTeamScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#6366F1]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Nilai Sekolah / Guru Pembimbing */}
              <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 space-y-2.5">
                <p className="font-bold text-purple-900 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faChalkboardUser} className="text-purple-700" />
                  <span>Komponen Nilai Guru Pembimbing Sekolah (Bobot 40%)</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Laporan & Portofolio (20%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reportScore}
                      onChange={(e) => setReportScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#6366F1]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Responsi / Presentasi (20%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={presScore}
                      onChange={(e) => setPresScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#6366F1]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Nilai Akhir */}
              <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Kalkulasi Nilai Akhir</p>
                  <p className="text-xs text-indigo-300 font-semibold">{calculatedPredicate}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">{calculatedFinal}</span>
                  <span className="text-xs text-slate-400"> / 100</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Evaluasi Pembimbing
                </label>
                <textarea
                  rows={2}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Catatan perkembangan kompetensi, inisiatif, atau rekomendasi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
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
                  Simpan Nilai PKL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak / Preview Sertifikat Resmi PKL */}
      {isCertModalOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faCertificate} />
                </span>
                <h3 className="text-sm font-black text-slate-800">
                  Sertifikat Resmi Praktik Kerja Lapangan (PKL)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FontAwesomeIcon icon={faPrint} />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  onClick={() => setIsCertModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Template Desain Sertifikat Resmi */}
            <div className="mt-4 p-8 sm:p-12 border-8 border-double border-[#1e1b4b] rounded-2xl text-slate-900 bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20 relative">
              {/* Kop Sertifikat */}
              <div className="text-center pb-4 border-b-2 border-slate-800 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  PEMERINTAH PROVINSI BALI • DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                </p>
                <h2 className="text-base sm:text-xl font-extrabold uppercase text-slate-900 mt-1">
                  SEKOLAH MENENGAH KEJURUAN NEGERI VOKASI
                </h2>
                <p className="text-[11px] text-slate-600">
                  Alamat Kampus Vokasi: Jl. Udayana No. 11, Singaraja, Bali • Telp: (0362) 22543
                </p>
              </div>

              {/* Judul Sertifikat */}
              <div className="text-center my-6">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#1e1b4b]">
                  SERTIFIKAT
                </h1>
                <p className="text-xs sm:text-sm font-bold uppercase text-slate-700 tracking-wide mt-0.5">
                  PRAKTIK KERJA LAPANGAN (PKL)
                </p>
                <p className="text-xs font-mono font-semibold text-slate-600 mt-1">
                  Nomor: {selectedAssessment.certificate_number || "421.5/084/SMK-PKL/2024"}
                </p>
              </div>

              {/* Badan Pernyataan */}
              <div className="text-center max-w-2xl mx-auto space-y-3 text-xs leading-relaxed">
                <p className="text-slate-600">Diberikan kepada:</p>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 border-b border-slate-300 pb-1 inline-block">
                  {selectedAssessment.student_name}
                </h3>
                <p className="text-slate-700 font-semibold">
                  NISN: {selectedAssessment.nisn} • Program Keahlian: {selectedAssessment.major}
                </p>

                <p className="text-slate-700 pt-2">
                  Telah melaksanakan Praktik Kerja Lapangan (PKL) di Dunia Usaha / Dunia Industri:
                </p>
                <p className="text-base font-black text-[#4F46E5]">
                  {selectedAssessment.company_name} ({selectedAssessment.company_city || "Singaraja"})
                </p>
                <p className="text-slate-600 text-[11px]">
                  Terhitung mulai tanggal {selectedAssessment.start_date || "15 Juli 2024"} sampai dengan {selectedAssessment.end_date || "15 Oktober 2024"} dengan hasil evaluasi:
                </p>

                {/* Nilai Akhir Badge */}
                <div className="py-2.5 px-6 rounded-2xl bg-slate-50 border border-slate-200 inline-block my-2">
                  <span className="text-xs font-bold text-slate-600 uppercase">Nilai Akhir Kelulusan: </span>
                  <span className="text-base font-black text-[#1e1b4b] ml-1">{selectedAssessment.final_score}</span>
                  <span className="text-xs font-bold text-emerald-700 ml-2">[{selectedAssessment.predicate}]</span>
                </div>
              </div>

              {/* Tanda Tangan & QR Code */}
              <div className="grid grid-cols-3 gap-4 items-end text-center text-xs pt-8 mt-6">
                <div>
                  <p className="text-slate-500 mb-14">
                    Pimpinan / Pembimbing DUDI,<br />
                    <span className="font-bold text-slate-800">{selectedAssessment.company_name}</span>
                  </p>
                  <p className="font-bold underline text-slate-900">
                    {selectedAssessment.company_pic || "Gede Aditya"}
                  </p>
                  <p className="text-[10px] text-slate-500">Pimpinan Mitra Industri</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-white border-2 border-slate-800 rounded-xl p-1 flex items-center justify-center shadow-xs">
                    <FontAwesomeIcon icon={faQrcode} className="text-5xl text-slate-800" />
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 mt-1">
                    Validasi Digital: {selectedAssessment.certificate_qr_hash?.slice(0, 12) || "PKL-VALID-2024"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 mb-14">
                    Singaraja, {selectedAssessment.issued_at ? selectedAssessment.issued_at.slice(0, 10) : "15 Oktober 2024"}<br />
                    Kepala Sekolah SMKN Vokasi,
                  </p>
                  <p className="font-bold underline text-slate-900">
                    {settings?.principal_name || "Drs. I Ketut Wijaya, M.Pd."}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NIP. {settings?.principal_nip || "197508122002121003"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
