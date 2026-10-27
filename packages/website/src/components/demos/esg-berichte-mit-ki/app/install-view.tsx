"use client";

import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import type { AppData } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { FileIcon, Icon } from "./file-chip";

export const INSTALL_STEPS = 4;

/**
 * „Dein Claude": the four steps of the kit's „Claude einrichten", reenacted
 * inside the depicted window (claude-desktop-spec 1.4). Each step shows the
 * screen with the control to use ringed; the dock's caption says it in a
 * sentence. Labels are Claude's English ones, as the help pages print them.
 */
export function InstallView({ copy, data, step }: { readonly copy: AppCopy; readonly data: AppData; readonly step: number }) {
  const c = copy.install;
  return (
    <div className="w4a-install" data-w4a-install={step}>
      {step === 0 ? (
        <div className="w4a-settings">
          <ul className="w4a-settings-nav" aria-hidden="true">
            <li>General</li>
            <li>Account</li>
            <li>Privacy</li>
            <li data-active="">{c.capabilities}</li>
            <li>Connectors</li>
          </ul>
          <div className="w4a-settings-body">
            <p className="w4a-install-h">{c.capabilities}</p>
            <div className="w4a-setting" data-ring="">
              <span className="w4a-setting-text">
                <span className="w4a-setting-name">{c.capability}</span>
                <span className="w4a-setting-note">{c.capabilityNote}</span>
              </span>
              <span className="w4a-switch" data-on="" data-animate="" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w4a-skills">
          <div className="w4a-skills-head">
            <p className="w4a-install-h">{copy.ui.skills}</p>
            <span className="w4a-skills-add" data-ring={step === 1 ? "" : undefined} aria-hidden="true">
              <Icon name="plus" size={16} />
            </span>
          </div>
          <p className="w4a-tabs" aria-hidden="true">
            <span data-active="">{c.yourSkills}</span>
            <span>{c.discover}</span>
          </p>
          <p className="w4a-skills-group">{c.createdByYou}</p>
          {step >= 3 ? (
            <div className="w4a-skill-row" data-ring="" data-w4a-skill-row="">
              <span className="w4a-skill-text">
                <span className="w4a-skill-name">{data.skill.name}</span>
                <span className="w4a-skill-desc">{data.skill.description}</span>
              </span>
              <span className="w4a-switch" data-on="" data-animate="" aria-hidden="true" />
            </div>
          ) : (
            <div className="w4a-skill-empty" aria-hidden="true" />
          )}
          {step === 2 ? (
            <div className="w4a-upload" data-w4a-upload="">
              <ul className="w4a-menu" aria-hidden="true">
                <li>{c.add}</li>
                <li data-ring="">{c.upload}</li>
              </ul>
              <div className="w4a-drop">
                <span className="w4a-drop-file">
                  <FileIcon kind="zip" />
                  {data.skill.name}.zip
                </span>
                <span className="w4a-drop-text">{c.drop}</span>
              </div>
            </div>
          ) : null}
          {step >= 3 ? (
            <div className="w4a-slash" aria-hidden="true">
              <p className="w4a-slash-menu">
                <span className="w4a-skill-name">/{data.skill.name}</span>
              </p>
              <p className="w4a-slash-input">/esg</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
