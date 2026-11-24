"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPlus,
  faSearch,
  faLocationDot,
  faPhone,
  faUserTie,
  faCheckCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

interface Company {
  id: number;
  company_name: string;
  sector: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  pic_name: string;
  pic_phone: string;
  quota: number;
  placed_count?: number;
  mou_number?: string;
  is_active: number;
}

const INITIAL_COMPANIES: Company[] = [
  {
    id: 1,
    company_name: "PT Bali Cyber Solusindo",
    sector: "Teknologi Informasi & Software",
    address: "Jl. Diponegoro No. 45",
    city: "Singaraja",
    phone: "0362-21445",
    email: "hrd@balicyber.id",
    pic_name: "Gede Aditya",
    pic_phone: "081234567891",
    quota: 6,
    placed_count: 4,
    mou_number: "MOU/SMK/2024/001",
    is_active: 1,
  },
  {
    id: 2,
    company_name: "Telkom Witel Singaraja",
    sector: "Telekomunikasi & Jaringan",
    address: "Jl. Ngurah Rai No. 12",
    city: "Singaraja",
    phone: "0362-22100",
    email: "witel.singaraja@telkom.co.id",
    pic_name: "Made Hendra",
    pic_phone: "081234567892",
    quota: 4,
    placed_count: 4,
    mou_number: "MOU/SMK/2024/002",
    is_active: 1,
  },
  {
    id: 3,
    company_name: "Auto2000 Singaraja",
    sector: "Otomotif & Servis Kendaraan",
    address: "Jl. Ahmad Yani No. 88",
    city: "Singaraja",
    phone: "0362-23456",
    email: "service.singaraja@auto2000.co.id",
    pic_name: "Agus Pratama",
    pic_phone: "081234567893",
    quota: 8,
    placed_count: 6,
    mou_number: "MOU/SMK/2024/003",
    is_active: 1,
  },
  {
    id: 4,
    company_name: "BPR Luhur Singaraja",
    sector: "Keuangan & Perbankan",
    address: "Jl. Gajah Mada No. 15",
    city: "Singaraja",
    phone: "0362-25678",
    email: "sdm@bprluhur.co.id",
    pic_name: "Ibu Desak Rai",
    pic_phone: "081234567894",
    quota: 5,
    placed_count: 3,
    mou_number: "MOU/SMK/2024/004",
    is_active: 1,
  },
];

export default function MitraIndustriPage() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    sector: "Teknologi Informasi & Software",
    address: "",
    city: "Singaraja",
    phone: "",
    email: "",
    pic_name: "",
    pic_phone: "",
    quota: 5,
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/backend/api/pkl/companies");
      if (res.ok) {
        const json = await res.json();
        if (json.companies && json.companies.length > 0) {
          setCompanies(json.companies);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      Swal.fire("Peringatan", "Nama mitra industri wajib diisi", "warning");
      return;
    }

    try {
      const res = await fetch("/api/backend/api/pkl/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        Swal.fire("Berhasil", "Mitra industri baru berhasil disimpan", "success");
        setIsModalOpen(false);
        fetchCompanies();
      } else {
        throw new Error();
      }
    } catch {
      const newCompany: Company = {
        id: Date.now(),
        ...formData,
        placed_count: 0,
        mou_number: `MOU/SMK/2024/00${companies.length + 1}`,
        is_active: 1,
      };
      setCompanies([newCompany, ...companies]);
      setIsModalOpen(false);
      Swal.fire("Berhasil", "Mitra industri tersimpan secara lokal", "success");
    }
  };

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            Mitra Industri & Dunia Kerja (DUDI)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data perusahaan tempat magang/PKL siswa SMK
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          <span>Tambah Mitra Industri</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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
            placeholder="Cari nama perusahaan, sektor, kota..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-500 font-semibold">
          <span>Total: <strong className="text-slate-800">{filtered.length}</strong> Mitra Aktif</span>
        </div>
      </div>

      {/* Grid Cards of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((c) => {
          const quota = c.quota || 5;
          const placed = c.placed_count || 0;
          const remaining = quota - placed;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center text-base shrink-0">
                    <FontAwesomeIcon icon={faBuilding} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[9px]" />
                    Kerja Sama Aktif
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-3 line-clamp-1" title={c.company_name}>
                  {c.company_name}
                </h3>
                <p className="text-[11px] text-[#4F46E5] font-semibold">{c.sector}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLocationDot} className="text-slate-400 text-[11px] w-3.5" />
                    <span className="truncate">{c.address}, {c.city}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserTie} className="text-slate-400 text-[11px] w-3.5" />
                    <span>PIC: <strong>{c.pic_name}</strong> ({c.pic_phone})</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faPhone} className="text-slate-400 text-[11px] w-3.5" />
                    <span>{c.phone}</span>
                  </p>
                </div>
              </div>

              {/* Footer Kuota */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500 font-medium">Kapasitas Kuota</span>
                  <span className="font-bold text-slate-800">{placed} / {quota} Siswa</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${remaining <= 0 ? "bg-red-500" : "bg-[#4F46E5]"}`}
                    style={{ width: `${Math.min(100, (placed / quota) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className={remaining <= 0 ? "text-red-500 font-bold" : "text-emerald-600 font-semibold"}>
                    {remaining <= 0 ? "Kuota Penuh" : `Tersisa ${remaining} slot`}
                  </span>
                  <span className="text-slate-400 font-mono">{c.mou_number || "MoU Terdaftar"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Mitra Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800">Tambah Mitra Industri (DUDI)</h3>
                <p className="text-[11px] text-slate-400">Masukkan data instansi / dunia kerja mitra PKL</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Instansi *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Contoh: PT Telkom Indonesia Witel Singaraja"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bidang / Sektor</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5] bg-white font-medium"
                  >
                    <option value="Teknologi Informasi & Software">Teknologi Informasi (RPL)</option>
                    <option value="Telekomunikasi & Jaringan">Jaringan Komputer (TKJ)</option>
                    <option value="Otomotif & Servis Kendaraan">Teknik Otomotif (TKRO)</option>
                    <option value="Keuangan & Perbankan">Akuntansi & Keuangan (AKL)</option>
                    <option value="Pariwisata & Perhotelan">Pariwisata & Perhotelan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kuota Siswa PKL</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor / Bengkel</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nama jalan, kawasan industri"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC / Instruktur</label>
                  <input
                    type="text"
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    placeholder="Nama lengkap PIC"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp PIC</label>
                  <input
                    type="text"
                    value={formData.pic_phone}
                    onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold shadow-sm"
                >
                  Simpan Mitra Industri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
