import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal FC — سامانه جامع مدیریت مالی و سرمایه‌گذاری",
  description: "مرکز فرماندهی پیشرفته مدیریت دارایی‌ها، تحلیل پورتفولیو، رصد بودجه و جریان نقدینگی شخصی.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
