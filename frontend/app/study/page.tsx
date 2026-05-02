"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchDueWords, fetchNewWords, submitReview, StudyWord } from "@/lib/api";

type Card = StudyWord & { source: "due" | "new" };

const QUALITY_CONFIG = [
  { key: 0, label: "Again", sub: "ลืม",   cls: "rate-again" },
  { key: 1, label: "Hard",  sub: "ยาก",   cls: "rate-hard"  },
  { key: 2, label: "Good",  sub: "พอได้", cls: "rate-good"  },
  { key: 3, label: "Easy",  sub: "จำดี",  cls: "rate-easy"  },
];

export default function StudyPage() {
  const [queue, setQueue]       = useState<Card[]>([]);
  const [current, setCurrent]   = useState<Card | null>(null);
  const [flipped, setFlipped]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [done, setDone]         = useState(false);
  const [count, setCount]       = useState(0);
  const [total, setTotal]       = useState(0);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating]     = useState(false);

  useEffect(() => {
    Promise.all([fetchDueWords(20), fetchNewWords(10)]).then(([due, fresh]) => {
      const q: Card[] = [
        ...due.map(w => ({ ...w, source: "due" as const })),
        ...fresh.map(w => ({ ...w, source: "new" as const })),
      ];
      setTotal(q.length);
      setQueue(q.slice(1));
      setCurrent(q[0] ?? null);
      setLoading(false);
    });
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!flipped) { if (e.code === "Space") { e.preventDefault(); setFlipped(true); } return; }
      const map: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
      if (map[e.code] !== undefined && !rating) handleRate(map[e.code]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, rating]);

  const handleRate = useCallback(async (quality: number) => {
    if (!current || rating) return;
    setRating(true);
    const res = await submitReview(current.word_id, quality);
    setFeedback(res.message);
    setCount(c => c + 1);
    setTimeout(() => {
      setFeedback("");
      setFlipped(false);
      setRating(false);
      if (queue.length === 0) { setDone(true); return; }
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
    }, 900);
  }, [current, queue, rating]);

  if (loading) return <LoadingState />;
  if (done || !current) return <DoneState count={count} />;

  const progress = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="animate-fade-up" style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="badge" style={{
            background: current.source === "due" ? "rgba(124,58,237,0.15)" : "var(--green-bg)",
            color: current.source === "due" ? "var(--accent-2)" : "var(--green)",
            border: `1px solid ${current.source === "due" ? "rgba(124,58,237,0.25)" : "rgba(34,197,94,0.25)"}`,
          }}>
            {current.source === "due" ? "SRS Review" : "New Word"}
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{current.category}</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}/{total}</span>
      </div>

      {/* Progress */}
      <div className="progress-track" style={{ height: 3 }}>
        <div className="progress-fill" style={{ width: `${progress}%`, transition: "width 0.5s ease" }} />
      </div>

      {/* 3D Flashcard */}
      <div className="flip-scene" onClick={() => !flipped && setFlipped(true)}>
        <div className={`flip-inner ${flipped ? "is-flipped" : ""}`}>

          {/* Front */}
          <div className="flip-face flip-face-front">
            <div style={{ position: "absolute", top: 16, right: 16 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--elevated)", padding: "3px 8px", borderRadius: 6 }}>
                {current.part_of_speech}
              </span>
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 10, lineHeight: 1 }}>
              {current.word}
            </div>
            <div style={{ fontSize: 16, color: "var(--text-2)", marginBottom: 28 }}>
              {current.pronunciation}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 12 }}>
              <span style={{ width: 28, height: 1, background: "var(--border-2)" }} />
              กดเพื่อดูความหมาย
              <span style={{ width: 28, height: 1, background: "var(--border-2)" }} />
            </div>
          </div>

          {/* Back */}
          <div className="flip-face flip-face-back">
            <div style={{ position: "absolute", top: 16, left: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-2)" }}>{current.word}</span>
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>{current.pronunciation}</span>
            </div>
            <div style={{ width: "100%", maxHeight: "100%", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)" }}>
                {current.definition_th}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center" }}>
                {current.definition_en}
              </div>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "4px 0" }} />
              <div style={{ fontSize: 13, color: "var(--text-2)", fontStyle: "italic", textAlign: "center" }}>
                "{current.example_sentence}"
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                {current.example_sentence_th}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="animate-fade-in" style={{
          background: "var(--elevated)",
          border: "1px solid var(--border-2)",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 13,
          color: "var(--text-2)",
          textAlign: "center",
        }}>
          {feedback}
        </div>
      )}

      {/* Rating buttons */}
      {flipped ? (
        <div className="animate-fade-in">
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {QUALITY_CONFIG.map(({ key, label, sub, cls }) => (
              <button key={key} className={`rate-btn ${cls}`} onClick={() => handleRate(key)} disabled={rating}>
                {label}
                <span className="sub">{sub}</span>
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
            ⌨️ กด 1–4 · Space เพื่อพลิกการ์ด
          </p>
        </div>
      ) : (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
          พยายามนึกความหมายก่อนดูเฉลย — Desirable Difficulty Effect
        </p>
      )}

    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 100, height: 22 }} />
        <div className="skeleton" style={{ width: 40, height: 22 }} />
      </div>
      <div className="skeleton" style={{ height: 3 }} />
      <div className="skeleton" style={{ height: 360, borderRadius: 20 }} />
    </div>
  );
}

function DoneState({ count }: { count: number }) {
  return (
    <div className="animate-fade-up" style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Session เสร็จแล้ว!</h2>
      <p style={{ color: "var(--text-2)", marginBottom: 4 }}>ทบทวนไป {count} คำ</p>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 32 }}>
        SRS จะนัดทบทวนในจังหวะที่เหมาะสมตาม Forgetting Curve
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/" className="btn-ghost">← Dashboard</Link>
        <button className="btn-primary" onClick={() => window.location.reload()}>เรียนต่อ</button>
      </div>
    </div>
  );
}
