import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Academia Digital",
    template: "%s · Academia Digital",
  },
  description:
    "Plataforma white-label de gestão de formação profissional certificada DGERT — catálogo público, portal do formando, dossier técnico-pedagógico digital.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          "font-sans bg-background text-foreground antialiased"
        )}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
