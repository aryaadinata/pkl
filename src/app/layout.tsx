import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PklProvider } from "@/context/PklContext";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Si-PKL | Sistem Manajemen Praktik Kerja Lapangan SMK",
  description: "Manajemen Penempatan DUDI, Logbook Jurnal Harian, Presensi & Sertifikasi PKL Siswa SMK Vokasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-800">
        <AuthProvider>
          <PklProvider>
            <DashboardShell>{children}</DashboardShell>
          </PklProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
