import type { Metadata } from "next";
import "./globals.css";
import NavClient from "./NavClient";

export const metadata: Metadata = {
  title: "TOEIC Brain",
  description: "เรียนคำศัพท์ TOEIC ด้วยหลักวิทยาศาสตร์สมอง",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <NavClient />
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
