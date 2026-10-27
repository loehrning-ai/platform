"use client";

import { useState } from "react";
import { GlasButton } from "@/components/demos/glas/button";
import { GlasProgress } from "@/components/demos/glas/progress";
import { GlasSheet } from "@/components/demos/glas/sheet";
import type { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";

type SceneCopy = (typeof DEMOS_PAGE_COPY)[keyof typeof DEMOS_PAGE_COPY]["claudeScene"];

/** A small drawn view of the Claude window for each install step (decoration; the sentence carries the step). */
function StepPicture({ step, skillName }: { readonly step: number; readonly skillName: string }) {
  return (
    <div className="cds-mini" data-step={step} aria-hidden="true">
      <div className="cds-mini-side">
        <span />
        <span />
        <span data-on={step === 1 ? "" : undefined}>Customize</span>
        <span />
      </div>
      <div className="cds-mini-main">
        {step === 0 ? (
          <div className="cds-mini-row">
            <span className="cds-mini-label">Code execution and file creation</span>
            <span className="cds-mini-switch" data-on="" />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="cds-mini-list">
            <span>Connectors</span>
            <span data-on="">Skills</span>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="cds-mini-menu">
            <span>Create skill</span>
            <span data-on="">Upload a skill</span>
            <span className="cds-mini-file">{skillName}.zip</span>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="cds-mini-row">
            <span className="cds-mini-label">{skillName}</span>
            <span className="cds-mini-switch" data-on="" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The install walkthrough: four steps in a Glas sheet, each a sentence with
 * a small drawing. The labels follow Anthropic's help pages at the date in
 * installFoot; they are named in English because the app shows them so.
 */
export function SceneInstall({ copy, skillName, onClose }: { readonly copy: SceneCopy; readonly skillName: string; readonly onClose: () => void; readonly theme?: string }) {
  const [step, setStep] = useState(0);
  const steps = copy.installSteps(skillName);
  const last = step === steps.length - 1;
  return (
    <GlasSheet
      open
      onClose={onClose}
      title={copy.installTitle}
      closeLabel={copy.close}
      resizeLabel={copy.resize}
      detent="medium"
      footer={
        <div className="cds-install-foot">
          <GlasButton variant="plain" icon="back" disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))}>
            {copy.back}
          </GlasButton>
          {last ? (
            <GlasButton variant="prominent" icon="check" onClick={onClose}>
              {copy.done}
            </GlasButton>
          ) : (
            <GlasButton variant="prominent" trailingIcon="forward" onClick={() => setStep((n) => Math.min(steps.length - 1, n + 1))}>
              {copy.next}
            </GlasButton>
          )}
        </div>
      }
    >
      <div className="cds-install" data-scene-install-step={step}>
        <GlasProgress value={(step + 1) / steps.length} label={copy.installTitle} valueText={copy.installStep(step + 1, steps.length)} />
        <p className="cds-install-count">{copy.installStep(step + 1, steps.length)}</p>
        <StepPicture step={step} skillName={skillName} />
        <p className="cds-install-text" aria-live="polite">
          {steps[step]}
        </p>
        <p className="cds-fine">{copy.installFoot}</p>
      </div>
    </GlasSheet>
  );
}
