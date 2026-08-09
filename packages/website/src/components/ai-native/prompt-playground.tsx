"use client";

import { useEffect, useState } from "react";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import { cn } from "@/lib/utils";

/* PromptPlayground — 3 presets (bad / good / great) with editable prompt
 * + simulated Claude output + quality rating. Presets baked in — this is
 * design-only content for a didactic demo. */

type PresetKey = "bad" | "good" | "great";

interface Preset {
  readonly key: PresetKey;
  readonly label: string;
  readonly prompt: string;
  readonly output: string;
  readonly critique: string;
  readonly quality: 1 | 2 | 3 | 4 | 5;
}

const PRESETS: readonly Preset[] = [
  {
    key: "bad",
    label: "unklare Anfrage",
    prompt: "schreib mir was zum marketing trend",
    output:
      "Hier sind einige Marketing-Trends: 1. Personalisierung 2. KI 3. Nachhaltigkeit 4. Video. Gerne kann ich auf einen dieser Punkte näher eingehen.",
    critique:
      "Zu allgemein: Kontext, Zweck, Empfänger, Quellen und Ausgabeformat fehlen.",
    quality: 1,
  },
  {
    key: "good",
    label: "kontext + format",
    prompt: `Rolle: Du bist unser Marketing-Lead.
Kontext: B2B-SaaS, Zielgruppe Mittelstand-Geschäftsführung, 50-500 MA.
Aufgabe: Entwurf für LinkedIn-Post (max 1200 Zeichen) über den Trend "AI-native Teams".
Constraints: Kein Hype-Sprech, kein "revolutionär", konkretes Beispiel, eine direkte Frage am Ende.
Voice: Tim Löhr, nüchtern, direkt, leicht ironisch.`,
    output: `Ein KI-gestützter Arbeitsablauf beginnt nicht beim Modell, sondern bei einer klaren Aufgabe.

Beispiel Controlling: Ausgangsdaten und Berechnungsregeln werden versioniert bereitgestellt. Das Modell erstellt einen Rechner-Entwurf. Ein Controller prüft Formeln, Stichproben und Abweichungen, bevor das Ergebnis verwendet wird.

Entscheidend sind nachvollziehbare Eingaben, ein festes Ausgabeformat und ein benannter Review-Schritt.

Welcher wiederkehrende Arbeitsablauf in eurem Team hat bereits eine messbare Ausgangslage und klare Prüfkriterien?`,
    critique:
      "Klarer Zweck und Review-Schritt. Vor Veröffentlichung fehlen noch ein belegtes Beispiel und die Freigabe der verwendeten Kennzahlen.",
    quality: 4,
  },
  {
    key: "great",
    label: "+ agentic briefing",
    prompt: `Rolle: Marketing-Lead B2B-SaaS.
Ziel: LinkedIn-Post über "AI-native Teams".

# Vor dem Schreiben, mache drei Runden:
1. Lies unsere letzten 10 Posts (anhängend als .md). Extrahiere Voice-Patterns.
2. Lies das Kundenfeedback-Doc (anhängend). Finde den EINEN konkreten Case.
3. Prüfe die bereitgestellten Redaktions- und Freigaberegeln.

# Dann schreibe:
- 3 Post-Varianten (hook-driven · story-driven · contrarian)
- Jede mit CTA-Frage
- Jede max 1200 Zeichen

# Output-Format: Markdown, H3 pro Variante, darunter der Post, darunter "Warum funktioniert's".`,
    output: `### Variante A · sachlicher Einstieg

Ein Rechner-Entwurf ist kein geprüftes Controlling-Instrument. Bei Fiktivwerk werden deshalb Datenstand, Formeln, Stichproben und Freigabe im selben Workflow dokumentiert.

**Belegstatus:** fiktives Kursbeispiel. Vor einer realen Veröffentlichung sind Quelle, Messmethode und Freigabe zu ergänzen.

**Warum diese Variante:** Sie trennt beobachtbare Prozessschritte von einer noch unbelegten Wirkungsbehauptung.`,
    critique:
      "Mehrstufig und prüfbar: Quellenstatus, Annahmen und Freigabe sind sichtbar. Der Entwurf behauptet keine erfundene Wirkung.",
    quality: 5,
  },
];

function QualityDots({ value }: { value: Preset["quality"] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Qualität: ${value} von 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-5 transition-colors",
            i <= value ? "bg-brand-orange" : "bg-border",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function AiNativePromptPlayground() {
  const [activeKey, setActiveKey] = useState<PresetKey>("good");
  const active = PRESETS.find((p) => p.key === activeKey) ?? PRESETS[1];
  const [edited, setEdited] = useState(active.prompt);

  useEffect(() => {
    setEdited(active.prompt);
  }, [active.prompt]);

  return (
    <SectionShell num="III" label="Prompt Playground">
      <Eyebrow>Praxisbeispiel · Lektion 1.3</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Eine unklare Anfrage.
        <br />
        Ein guter Prompt.
        <br />
        Ein prüfbares Briefing.
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[640px] text-[17px] text-muted-foreground">
          Wechsle die Presets und vergleiche, welche Angaben den Entwurf
          prüfbar machen.
        </p>
      </FadeBlock>

      <FadeBlock delay={2}>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* LEFT — editor */}
          <div className="flex flex-col border border-border bg-card/40">
            <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Prompt · editierbar</span>
              <span>{edited.length} Zeichen</span>
            </div>
            <div
              className="flex flex-wrap gap-2 border-b border-border px-5 py-3"
              role="group"
              aria-label="Prompt-Vorlage"
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setActiveKey(preset.key)}
                  aria-pressed={preset.key === activeKey}
                  className={cn(
                    "border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors",
                    preset.key === activeKey
                      ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              spellCheck={false}
              className="h-[360px] resize-none border-0 bg-transparent p-5 font-mono text-[12.5px] leading-[1.6] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
              aria-label="Prompt-Editor"
            />
          </div>

          {/* RIGHT — simulated output */}
          <div className="flex flex-col border border-border bg-card/40">
            <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Claude · simuliert</span>
              <QualityDots value={active.quality} />
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-[1.65] text-foreground">
                {active.output}
              </pre>
            </div>
            <div className="border-t border-border px-5 py-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-amber">
                Kritik
              </p>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted-foreground">
                {active.critique}
              </p>
            </div>
          </div>
        </div>
      </FadeBlock>

      <FadeBlock delay={3}>
        <p className="mt-6 font-mono text-[12.5px] tracking-[0.02em] text-muted-foreground">
          Der Output ist statisch simuliert. Im Kurs definierst du Briefings,
          Berechtigungen und Prüfkriterien für begrenzte Modellaufgaben.
        </p>
      </FadeBlock>
    </SectionShell>
  );
}
