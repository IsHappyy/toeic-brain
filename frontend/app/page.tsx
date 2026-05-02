"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStats, DashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setError(true));
  }, []);

  if (error) return <ErrorState />;
  if (!stats) return <LoadingSkeleton />;

  const pct = Math.min(100, Math.round((stats.total_learned / (stats.goal ?? 3000)) * 100));
  const totalDue = stats.due_today + stats.new_available;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ paddingBottom: 4 }}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
          {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>
          {stats.streak > 0 ? `🔥 ${stats.streak} วันต่อเนื่อง` : "เริ่มเรียนวันแรก!"}
        </h1>
      </div>

      {/* Study CTA */}
      <div style={{
        background: "linear-gradient(135deg, #1a1030 0%, var(--card) 100%)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: 20,
        padding: "28px 28px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 12, color: "var(--accent-2)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Session วันนี้
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 6 }}>
                {stats.due_today > 0 && `${stats.due_today} คำรอทบทวน`}
                {stats.due_today > 0 && stats.new_available > 0 && " + "}
                {stats.new_available > 0 && `${stats.new_available} คำใหม่`}
                {totalDue === 0 && "เสร็จแล้ว! ✓"}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-2)" }}>
                {totalDue > 0
                  ? "Active Recall — ทดสอบตัวเองเพื่อล็อคความจำ"
                  : "กลับมาพรุ่งนี้เพื่อทบทวนตามกำหนด SRS"}
              </p>
            </div>
            {totalDue > 0 && (
              <Link href="/study" className="btn-primary" style={{ flexShrink: 0 }}>
                เริ่มเรียน →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard value={stats.total_words} label="คำทั้งหมด" />
        <StatCard value={stats.total_learned} label="เรียนแล้ว" color="var(--accent-2)" />
        <StatCard value={stats.today_reviews} label="รีวิววันนี้" color="var(--orange)" />
        <StatCard value={`${stats.accuracy_overall}%`} label="ความแม่นยำ" color="var(--green)" />
      </div>

      {/* Progress to goal */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>ความคืบหน้าสู่ 3,000 คำ</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent-2)" }}>{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          <span>{stats.total_learned.toLocaleString()} คำ</span>
          <span>เหลือ {(3000 - stats.total_learned).toLocaleString()} คำ</span>
        </div>
      </div>

      {/* Science tips */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🧠</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-2)", marginBottom: 4 }}>Ebbinghaus Forgetting Curve</p>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
            สมองลืมข้อมูลใหม่ไปกว่า 70% ภายใน 24 ชม. SM-2 Algorithm คำนวณช่วงทบทวนที่พอดีกับจังหวะ "กำลังจะลืม" เพื่อฝังความจำระยะยาวอย่างมีประสิทธิภาพสูงสุด
          </p>
        </div>
      </div>

    </div>
  );
}

function StatCard({ value, label, color = "var(--text)" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "16px 12px" }}>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="skeleton" style={{ height: 36, width: 200 }} />
      <div className="skeleton" style={{ height: 130 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
      </div>
      <div className="skeleton" style={{ height: 90 }} />
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>เชื่อมต่อ Backend ไม่ได้</p>
      <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 20 }}>ตรวจสอบว่า backend กำลังรัน</p>
      <code style={{
        display: "inline-block",
        background: "var(--elevated)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        color: "var(--accent-2)",
      }}>
        uvicorn main:app --reload
      </code>
    </div>
  );
}
