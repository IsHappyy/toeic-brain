"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/study", label: "Study" },
  { href: "/progress", label: "Progress" },
];

export default function NavClient() {
  const path = usePathname();
  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(9,9,11,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        <span style={{
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginRight: 20,
          userSelect: "none",
        }}>
          TOEIC Brain
        </span>

        {links.map(({ href, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--text)" : "var(--muted)",
              background: active ? "var(--elevated)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
              border: active ? "1px solid var(--border-2)" : "1px solid transparent",
            }}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
