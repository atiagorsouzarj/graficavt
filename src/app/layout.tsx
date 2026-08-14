import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrafCenter — ERP + CRM para Gráfica",
  description:
    "Sistema completo de gestão, precificação e CRM para gráfica rápida, papelaria personalizada e 3D.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f4f7fb] text-slate-800 antialiased">{children}</body>
    </html>
  );
}
