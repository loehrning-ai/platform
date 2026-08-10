"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useMotionAllowed } from "@/lib/animation-policy";
import type { DefChapterId } from "@/lib/data-engineering-fundamentals/types";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

// ─── PipelineBar / StageIcon ──────────────────────
// Ported from `src/chapters/Ch_Overview.js`: the horizontal 10-stop
// pipeline diagram driven by an animated token stream, used by the
// overview chapter's hero flow section.

export interface OverviewStage {
  readonly id: string;
  readonly chap: DefChapterId;
  readonly n: string;
  readonly title: string;
  readonly tag: string;
  readonly hex: string;
  readonly ink: string;
  readonly icon: string;
  readonly body: string;
}

export const OV_STAGES: readonly OverviewStage[] = [
  {
    id: "ingest",
    chap: "ingest",
    n: "01",
    title: "Ingest",
    tag: "where data is born",
    hex: "#7C5CFF",
    ink: "#6E4BFF",
    icon: "ingest",
    body: "Each event has event time and processing time. The configured late-data policy determines whether records update, reroute, or drop.",
  },
  {
    id: "stream",
    chap: "stream",
    n: "02",
    title: "Streaming",
    tag: "real-time bridge",
    hex: "#22D3EE",
    ink: "#0B798A",
    icon: "stream",
    body: "Kafka transports events in the course scenario; Flink applies window and delivery semantics before publication.",
  },
  {
    id: "store",
    chap: "store",
    n: "03",
    title: "Store",
    tag: "where data lives",
    hex: "#2D7DFF",
    ink: "#0060FD",
    icon: "store",
    body: "In the additive example, each partition depends on prior state. Rebuild the affected range after a faulty input or rule.",
  },
  {
    id: "comp",
    chap: "comp",
    n: "04",
    title: "Compute",
    tag: "how data is read",
    hex: "#FF7A59",
    ink: "#D32A00",
    icon: "comp",
    body: "Statistics and configuration guide join planning. Skew can concentrate work on one worker while others finish earlier.",
  },
  {
    id: "orch",
    chap: "orch",
    n: "05",
    title: "Orchestrate",
    tag: "Airflow & idempotency",
    hex: "#31A24C",
    ink: "#267E3B",
    icon: "orch",
    body: "Airflow may repeat tasks through retries or backfills. Write semantics and stable inputs determine idempotency.",
  },
  {
    id: "qual",
    chap: "qual",
    n: "06",
    title: "Quality",
    tag: "ran ≠ right",
    hex: "#E41E3F",
    ink: "#D81A39",
    icon: "qual",
    body: "Row-count, freshness, schema, and uniqueness checks provide evidence about selected dataset properties.",
  },
  {
    id: "disc",
    chap: "disc",
    n: "07",
    title: "Discover",
    tag: "catalog practice",
    hex: "#B8770A",
    ink: "#986308",
    icon: "disc",
    body: "The course palette, DatasetSpec, and lineage graph expose declared ownership and known dependencies.",
  },
  {
    id: "serve",
    chap: "serve",
    n: "08",
    title: "Serve",
    tag: "metrics & semantic",
    hex: "#0091FF",
    ink: "#0070C5",
    icon: "serve",
    body: "A versioned metric registry reduces formula drift when consumers resolve the same registered definition.",
  },
  {
    id: "gov",
    chap: "gov",
    n: "09",
    title: "Govern",
    tag: "the deploy gate",
    hex: "#8B5CF6",
    ink: "#7D48F5",
    icon: "gov",
    body: "The reference gate blocks metadata that violates its configured classification and ACL rules.",
  },
  {
    id: "cap",
    chap: "cap",
    n: "10",
    title: "Capstone",
    tag: "one pipeline, six gates",
    hex: "#E85D04",
    ink: "#BB4B03",
    icon: "cap",
    body: "Six modeled controls connect input, state, checks, and serving. Compare outputs with their recorded evidence.",
  },
];

export const OV_STAGES_DE: readonly OverviewStage[] = [
  {
    id: "ingest",
    chap: "ingest",
    n: "01",
    title: "Aufnahme",
    tag: "hier entstehen Daten",
    hex: "#7C5CFF",
    ink: "#6E4BFF",
    icon: "ingest",
    body: "Jedes Ereignis hat Ereignis- und Verarbeitungszeit. Die konfigurierte Nachzüglerregel bestimmt Aktualisierung, Umleitung oder Verwerfen.",
  },
  {
    id: "stream",
    chap: "stream",
    n: "02",
    title: "Streaming",
    tag: "Brücke in Echtzeit",
    hex: "#22D3EE",
    ink: "#0B798A",
    icon: "stream",
    body: "Im Kursszenario transportiert Kafka Ereignisse; Flink wendet Fenster- und Zustellungssemantik vor der Veröffentlichung an.",
  },
  {
    id: "store",
    chap: "store",
    n: "03",
    title: "Speicherung",
    tag: "hier liegen Daten",
    hex: "#2D7DFF",
    ink: "#0060FD",
    icon: "store",
    body: "Im additiven Beispiel hängt jede Partition vom vorherigen Zustand ab. Nach einer fehlerhaften Eingabe oder Regel wird der betroffene Bereich neu aufgebaut.",
  },
  {
    id: "comp",
    chap: "comp",
    n: "04",
    title: "Verarbeitung",
    tag: "so werden Daten gelesen",
    hex: "#FF7A59",
    ink: "#D32A00",
    icon: "comp",
    body: "Statistiken und Konfiguration steuern die Join-Planung. Skew kann Arbeit auf einen Worker konzentrieren, während andere früher fertig sind.",
  },
  {
    id: "orch",
    chap: "orch",
    n: "05",
    title: "Orchestrierung",
    tag: "Airflow und Idempotenz",
    hex: "#31A24C",
    ink: "#267E3B",
    icon: "orch",
    body: "Airflow kann Tasks durch Wiederholungen oder Backfills mehrfach ausführen. Schreibsemantik und stabile Eingaben bestimmen die Idempotenz.",
  },
  {
    id: "qual",
    chap: "qual",
    n: "06",
    title: "Qualität",
    tag: "ausgeführt ≠ korrekt",
    hex: "#E41E3F",
    ink: "#D81A39",
    icon: "qual",
    body: "Prüfungen für Zeilenzahl, Aktualität, Schema und Eindeutigkeit liefern Nachweise zu ausgewählten Datensatzeigenschaften.",
  },
  {
    id: "disc",
    chap: "disc",
    n: "07",
    title: "Ermittlung",
    tag: "Katalogübung",
    hex: "#B8770A",
    ink: "#986308",
    icon: "disc",
    body: "Kurspalette, DatasetSpec und Lineage-Graph zeigen deklarierte Zuständigkeit und bekannte Abhängigkeiten.",
  },
  {
    id: "serve",
    chap: "serve",
    n: "08",
    title: "Bereitstellung",
    tag: "Metriken und Semantik",
    hex: "#0091FF",
    ink: "#0070C5",
    icon: "serve",
    body: "Ein versioniertes Metrikregister reduziert Formelabweichung, wenn Verbraucher dieselbe registrierte Definition auflösen.",
  },
  {
    id: "gov",
    chap: "gov",
    n: "09",
    title: "Governance",
    tag: "Freigabeschranke",
    hex: "#8B5CF6",
    ink: "#7D48F5",
    icon: "gov",
    body: "Die Referenzschranke blockiert Metadaten, die gegen konfigurierte Klassifikations- und ACL-Regeln verstoßen.",
  },
  {
    id: "cap",
    chap: "cap",
    n: "10",
    title: "Abschlussprojekt",
    tag: "eine Pipeline, sechs Schranken",
    hex: "#E85D04",
    ink: "#BB4B03",
    icon: "cap",
    body: "Sechs modellierte Kontrollen verbinden Eingabe, Zustand, Prüfungen und Bereitstellung. Ausgaben werden mit ihren Nachweisen verglichen.",
  },
];

export function StageIcon({
  kind,
  color,
  size = 18,
}: {
  readonly kind: string;
  readonly color: string;
  readonly size?: number;
}) {
  const s = size;
  switch (kind) {
    case "ingest":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16 L8 11 L14 13 L20 7"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="4" cy="16" r="1.6" fill={color} />
          <circle cx="8" cy="11" r="1.6" fill={color} />
          <circle cx="14" cy="13" r="1.6" fill={color} />
          <circle cx="20" cy="7" r="1.6" fill={color} />
        </svg>
      );
    case "stream":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 8 Q8 2 12 8 T21 8"
            stroke={color}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M3 16 Q8 10 12 16 T21 16"
            stroke={color}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            opacity=".55"
          />
        </svg>
      );
    case "store":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="6"
            width="16"
            height="3"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <rect
            x="4"
            y="11"
            width="16"
            height="3"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <rect
            x="4"
            y="16"
            width="16"
            height="3"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
      );
    case "comp":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke={color}
            strokeWidth="1.6"
          />
          <path
            d="M10 6.5 L14 6.5 M10 17.5 L14 17.5 M6.5 10 L6.5 14 M17.5 10 L17.5 14"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="1.5 1.5"
          />
        </svg>
      );
    case "orch":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="6" r="2.2" stroke={color} strokeWidth="1.6" />
          <circle cx="19" cy="6" r="2.2" stroke={color} strokeWidth="1.6" />
          <circle cx="12" cy="18" r="2.2" stroke={color} strokeWidth="1.6" />
          <path
            d="M6.8 7.3 L10.5 16.5 M17.2 7.3 L13.5 16.5"
            stroke={color}
            strokeWidth="1.4"
          />
        </svg>
      );
    case "qual":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 L20 6 V12 Q20 17 12 21 Q4 17 4 12 V6 Z"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d="M8 12 L11 15 L16 9"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "disc":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6" stroke={color} strokeWidth="1.8" />
          <path
            d="M15.5 15.5 L20 20"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "serve":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19 V10 M10 19 V5 M16 19 V13 M22 19 V7"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="20"
            x2="23"
            y2="20"
            stroke={color}
            strokeWidth="1.2"
          />
        </svg>
      );
    case "gov":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="1.5"
            stroke={color}
            strokeWidth="1.6"
          />
          <path
            d="M8 10 V7 a4 4 0 0 1 8 0 V10"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx="12" cy="15" r="1.4" fill={color} />
        </svg>
      );
    case "cap":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 L19 7 V14 Q19 19 12 21 Q5 19 5 14 V7 Z"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d="M9 12 L11 14 L15 9"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

interface Token {
  readonly id: number;
  readonly t0: number;
  readonly dur: number;
  readonly hue: string;
  readonly wobble: number;
}

interface PipelineBarProps {
  readonly activeId: string;
  readonly setActiveId: (id: string) => void;
  readonly locale: Locale;
  readonly stages?: readonly OverviewStage[];
  readonly chapterLabel?: string;
}

export function PipelineBar({
  activeId,
  setActiveId,
  locale,
  stages = OV_STAGES,
  chapterLabel = "Chapter",
}: PipelineBarProps) {
  const W = 1000;
  const H = 70;
  const PAD_L = 24;
  const PAD_R = 24;
  const trackY = H / 2;

  const positions = useMemo(() => {
    const span = W - PAD_L - PAD_R;
    return stages.map((s, i) => ({
      ...s,
      x: PAD_L + (span * i) / (stages.length - 1),
      y: trackY,
    }));
  }, [stages, trackY]);
  const STAGE_HUES = useMemo(() => stages.map((s) => s.hex), [stages]);

  const [tokens, setTokens] = useState<readonly Token[]>([]);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const idSeq = useRef(0);
  const [, setTick] = useState(0);
  const motionAllowed = useMotionAllowed();

  useEffect(() => {
    if (!motionAllowed) return;
    let last = performance.now();
    let spawn = 0.2;
    const step = (now: number) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      spawn += dt;
      const EVERY = 1.6;
      while (spawn >= EVERY) {
        spawn -= EVERY;
        setTokens((prev) => [
          ...prev.slice(-12),
          {
            id: idSeq.current++,
            t0: tRef.current,
            dur: 11 + Math.random() * 3,
            hue: STAGE_HUES[Math.floor(Math.random() * STAGE_HUES.length)],
            wobble: (Math.random() - 0.5) * 3.5,
          },
        ]);
      }
      setTick((k) => k + 1);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [STAGE_HUES, motionAllowed]);

  useEffect(() => {
    if (!motionAllowed) return;
    const iv = setInterval(() => {
      setTokens((prev) => prev.filter((tk) => tRef.current - tk.t0 < tk.dur));
    }, 1500);
    return () => clearInterval(iv);
  }, [motionAllowed]);

  const pulse: Record<string, number> = {};
  for (const tk of tokens) {
    const u = Math.max(0, Math.min(1, (tRef.current - tk.t0) / tk.dur));
    const x = PAD_L + u * (W - PAD_L - PAD_R);
    for (const p of positions) {
      const d = Math.abs(p.x - x);
      if (d < 22) pulse[p.id] = Math.max(pulse[p.id] ?? 0, 1 - d / 22);
    }
  }

  return (
    <div className="ov-pipe">
      <svg
        className="ov-pipe-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ovTrack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2D7DFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E85D04" stopOpacity="0.4" />
          </linearGradient>
          <filter id="ovTokGlow">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <line
          x1={PAD_L}
          y1={trackY}
          x2={W - PAD_R}
          y2={trackY}
          stroke="url(#ovTrack)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {tokens.map((tk) => {
          const u = Math.max(0, Math.min(1, (tRef.current - tk.t0) / tk.dur));
          const x = PAD_L + u * (W - PAD_L - PAD_R);
          const y = trackY + Math.sin(u * 12 + tk.id) * tk.wobble;
          const fadeIn = Math.min(1, u * 8);
          const fadeOut = Math.min(1, (1 - u) * 8);
          const op = Math.max(0, Math.min(1, fadeIn * fadeOut));
          return (
            <g key={tk.id} opacity={op}>
              <circle
                cx={x}
                cy={y}
                r="2.8"
                fill={tk.hue}
                filter="url(#ovTokGlow)"
                opacity="0.6"
              />
              <circle cx={x} cy={y} r="1.6" fill={tk.hue} />
            </g>
          );
        })}
      </svg>
      <div className="ov-pipe-stops">
        {positions.map((p) => {
          const isActive = activeId === p.id;
          const pulseV = pulse[p.id] ?? 0;
          return (
            <Link
              key={p.id}
              className={`ov-stop ${isActive ? "on" : ""}`}
              style={{ "--hex": p.hex, "--ink": p.ink } as CSSProperties}
              href={technicalCourseHref(
                "data-engineering-fundamentals",
                locale,
                { kind: "chapter", chapterId: p.chap },
              )}
              onMouseEnter={() => setActiveId(p.id)}
              onFocus={() => setActiveId(p.id)}
              aria-label={`${chapterLabel} ${p.n} · ${p.title}`}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="ov-stop-n">{p.n}</div>
              <div
                className="ov-stop-dot"
                style={
                  pulseV > 0.15
                    ? {
                        boxShadow: `0 0 0 ${3 + pulseV * 6}px color-mix(in oklab, ${p.hex} ${Math.round(pulseV * 40)}%, transparent)`,
                      }
                    : undefined
                }
              >
                <StageIcon kind={p.icon} color={p.hex} size={16} />
              </div>
              <div className="ov-stop-title">{p.title}</div>
              <div className="ov-stop-tag">{p.tag}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineBar;
