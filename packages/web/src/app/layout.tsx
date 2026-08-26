import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";


export const metadata: Metadata = {
  title: "Oradent | Gestão de clínicas odontológicas",
  description:
    "Sistema de gestão para clínicas odontológicas com pacientes, consultas, faturamento e planos de tratamento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
