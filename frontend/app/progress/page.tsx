"use client";
import { useEffect, useState } from "react";
import { fetchAllWords, WordEntry } from "@/lib/api";

const CATS = ["ทั้งหมด", "Business", "Finance", "HR", "Marketing", "Travel", "Manufacturing", "General"];
const CAT_COLOR: Record<string, string> = {
  Business: "#7c3aed", Finance: "#f59e0b", HR: "#ec4899",
  Marketing: "#06b6d4", Travel: "#10b981", Manufacturing: "#f97316", General: "#8b5cf6",
};

export default function ProgressPage() {
  const [words, setWords]   = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]       = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"due"|"mastered"|"new">("all");

  useEffect(() => { fetchAllWords().then(setWords).finally(() => setLoading(false)); }, []);

  const filtered = words.filter(w => {
    if (cat !== "ทั้งหมด" && w.category !== cat) return false;
    if (search && !w.word.toLowerCase().includes(search.toLowerCase()) && !w.definition_th.includes(search)) return false;
    if (statusFilter === "due" && !w.is_due) return false;
    if (statusFilter === "mastered" && w.repetitions < 4) return false;
    if (statusFilter === "new" && w.is_learned) return false;
    return true;
  });

  const learned   = words.filter(w => w.is_learned).length;
  const due       = words.filter(w => w.is_due).length;
  const mastered  = words.filter(w => w.repetitions >= 4).length;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.4px" }}>ความคืบหน้า</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Targeted Practice — โฟกัสเฉพาะคำที่ยังอ่อน</p>
      </div>

      {/* Summary */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 76 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <MiniStat label="คำทั้งหมด" value={words.length} />
          <MiniStat label="เรียนแล้ว"  value={learned}      color="var(--accent-2)" onClick={() => setStatusFilter("all")} />
          <MiniStat label="ค้างรีวิว"  value={due}          color="var(--orange)"   onClick={() => setStatusFilter("due")} />
          <MiniStat label="เชี่ยวชาญ" value={mastered}     color="var(--green)"    onClick={() => setStatusFilter("mastered")} />
        </div>
      )}

      {/* Category breakdown */}
      <div className="card">
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>แยกตามหมวดหมู่</p>
        {loading
          ? [1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 14 }} />)
          : CATS.slice(1).map(c => {
              const cw = words.filter(w => w.category === c);
              const cl = cw.filter(w => w.is_learned).length;
              const pct = cw.length ? Math.round(cl / cw.length * 100) : 0;
              const color = CAT_COLOR[c] ?? "var(--accent-2)";
              return (
                <div key={c} style={{ marginBottom: 14, cursor: "pointer" }} onClick={() => setCat(c)}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500, color: cat === c ? color : "var(--text-2)" }}>{c}</span>
                    <span style={{ color: "var(--muted)" }}>{cl}/{cw.length} · {pct}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาคำศัพท์..."
          style={{
            background: "var(--card)", border: "1px solid var(--border-2)",
            borderRadius: 10, padding: "8px 14px", color: "var(--text)",
            fontSize: 13, outline: "none", width: 180,
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
              border: "1px solid var(--border)",
              background: cat === c ? "var(--accent)" : "var(--card)",
              color: cat === c ? "#fff" : "var(--muted)",
              transition: "all 0.15s",
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Word list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>ไม่พบคำศัพท์</div>
          ) : filtered.map((w, i) => (
            <div key={w.word_id} style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{w.word}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 10 }}>{w.definition_th}</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                background: `${CAT_COLOR[w.category] ?? "#888"}18`,
                color: CAT_COLOR[w.category] ?? "var(--muted)",
              }}>
                {w.category}
              </span>
              {w.accuracy !== null
                ? <span style={{ fontSize: 12, fontWeight: 600, color: w.accuracy >= 70 ? "var(--green)" : "var(--orange)", minWidth: 40, textAlign: "right" }}>
                    {w.accuracy}%
                  </span>
                : <span style={{ minWidth: 40 }} />
              }
              <StatusPill entry={w} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function MiniStat({ label, value, color = "var(--text)", onClick }: { label: string; value: number; color?: string; onClick?: () => void }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "14px 10px", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function StatusPill({ entry }: { entry: WordEntry }) {
  if (!entry.is_learned)    return <Pill label="ใหม่"       bg="var(--surface)"           color="var(--muted)"    />;
  if (entry.is_due)         return <Pill label="ค้างรีวิว" bg="var(--orange-bg)"          color="var(--orange)"   />;
  if (entry.repetitions>=4) return <Pill label="เชี่ยวชาญ" bg="var(--green-bg)"           color="var(--green)"    />;
  return                           <Pill label="กำลังเรียน" bg="rgba(124,58,237,0.12)"    color="var(--accent-2)" />;
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: bg, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
