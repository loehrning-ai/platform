"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { GlasSheet, type GlasIconName } from "@/components/demos/glas";
import { modelShortName, recordedOn } from "@/lib/claude-runs";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { sizeLabel, type AppData, type AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { FileIcon, Icon } from "./file-chip";

/** Below this width the window is drawn as the Claude phone app: chat full screen, the panel as a sheet. */
export const PHONE_MAX = 720;

export interface AppPanel {
  readonly key: string;
  readonly title: string;
  /** One short line under the title: where the thing comes from ("Von Claude erstellt"). */
  readonly meta: string;
  readonly kind: "check" | "file";
  readonly body: ReactNode;
  /** Back from a file to the step's check. */
  readonly onBack?: () => void;
  readonly backLabel?: string;
}

export interface SidebarChat {
  readonly chat: number;
  readonly title: string;
}

function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(1024);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Keeps the chat pinned to its newest line while an answer streams, unless the visitor scrolled up. */
function usePinnedScroll(ref: React.RefObject<HTMLElement | null>, contentRef: React.RefObject<HTMLElement | null>, key: string) {
  const pinned = useRef(true);
  useEffect(() => {
    pinned.current = true;
  }, [key]);
  useEffect(() => {
    const scroller = ref.current;
    const content = contentRef.current;
    if (!scroller || !content || typeof ResizeObserver === "undefined") return;
    // Only a scroll up by the visitor unpins; our own jumps (and a stream that grows faster than the scroll event) never do.
    let last = scroller.scrollTop;
    const onScroll = () => {
      if (scroller.scrollTop >= last - 2) {
        last = Math.max(last, scroller.scrollTop);
        if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48) pinned.current = true;
        return;
      }
      last = scroller.scrollTop;
      pinned.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
    };
    const observer = new ResizeObserver(() => {
      if (!pinned.current) return;
      scroller.scrollTop = scroller.scrollHeight;
      last = scroller.scrollTop;
    });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(content);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [ref, contentRef]);
  return pinned;
}

/** When an answer has landed, the chat shows it from its start (the activity line above it), not from its end. */
function useAnswerStart(ref: React.RefObject<HTMLElement | null>, pinned: React.RefObject<boolean>, answer: string | null) {
  useLayoutEffect(() => {
    const scroller = ref.current;
    if (!scroller || !answer) return;
    const turn = scroller.querySelector<HTMLElement>(`[data-w4a-turn="${answer}"]`);
    const start = turn?.querySelector<HTMLElement>("[data-w4a-activity], [data-w4a-answer]");
    if (!start) return;
    pinned.current = false;
    scroller.scrollTop += start.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8;
  }, [ref, pinned, answer]);
}

function NavItem({ icon, label, active }: { readonly icon: GlasIconName; readonly label: string; readonly active?: boolean }) {
  return (
    <span className="w4a-nav" data-active={active ? "" : undefined} aria-hidden="true">
      <Icon name={icon} size={16} />
      <span className="w4a-nav-label">{label}</span>
    </span>
  );
}

function Sidebar({
  data,
  copy,
  chats,
  chat,
  onChat,
  onFile,
  customize,
  onCustomize,
}: {
  readonly data: AppData;
  readonly copy: AppCopy;
  readonly chats: readonly SidebarChat[];
  readonly chat: number | null;
  readonly onChat: (chat: number) => void;
  readonly onFile: (file: AppFile) => void;
  readonly customize: boolean;
  /** Customize is the one live entry of the depicted sidebar (claude-desktop-spec 4.1): it opens the skill setup. */
  readonly onCustomize?: () => void;
}) {
  const knowledge = data.files.filter((file) => file.where === "knowledge");
  const instructions = data.files.find((file) => file.where === "instructions");
  // The depicted entries answer a pointer but stay out of the tab order and the accessibility tree
  // (claude-desktop-spec 7), so the keyboard reaches the message box before fifteen file names.
  return (
    <nav className="w4a-side" aria-label={data.project}>
      <div className="w4a-side-top" aria-hidden="true">
        <span className="w4a-brand">Claude</span>
        <Icon name="sidebar" size={16} />
      </div>
      <div className="w4a-side-nav">
        <span className="w4a-nav w4a-new" aria-hidden="true">
          <span className="w4a-new-dot">
            <Icon name="plus" size={14} />
          </span>
          <span className="w4a-nav-label">{copy.ui.newChat}</span>
        </span>
        <NavItem icon="search" label={copy.ui.chats} />
        <NavItem icon="folder" label={copy.ui.projects} active={!customize} />
        <NavItem icon="doc" label={copy.ui.artifacts} />
        {onCustomize ? (
          <button type="button" className="w4a-nav w4a-nav-live" data-active={customize ? "" : undefined} aria-label={copy.ui.customizeOpen} onClick={onCustomize} data-w4a-customize="">
            <Icon name="sliders" size={16} />
            <span className="w4a-nav-label">{copy.ui.customize}</span>
          </button>
        ) : (
          <NavItem icon="sliders" label={copy.ui.customize} active={customize} />
        )}
      </div>
      <div className="w4a-side-scroll" aria-hidden="true">
        <p className="w4a-side-project">
          <Icon name="folder" size={14} />
          <span>{data.project}</span>
        </p>
        {chats.length > 0 ? (
          <ul className="w4a-side-chats">
            {chats.map((item) => (
              <li key={item.chat}>
                <button type="button" tabIndex={-1} className="w4a-side-chat" aria-current={item.chat === chat ? "page" : undefined} onClick={() => onChat(item.chat)} data-w4a-chat={item.chat}>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="w4a-side-head">{copy.ui.instructions}</p>
        {instructions ? (
          <button type="button" tabIndex={-1} className="w4a-side-file" onClick={() => onFile(instructions)} data-w4a-file={instructions.path}>
            <FileIcon kind={instructions.kind} />
            <span>{instructions.name}</span>
          </button>
        ) : null}
        <p className="w4a-side-head">
          {copy.ui.knowledge}
          <span className="w4a-side-count">{fill(copy.ui.files, { n: knowledge.length })}</span>
        </p>
        <ul className="w4a-side-files">
          {knowledge.map((file) => (
            <li key={file.path}>
              <button type="button" tabIndex={-1} className="w4a-side-file" onClick={() => onFile(file)} data-w4a-file={file.path}>
                <FileIcon kind={file.kind} />
                <span>{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="w4a-side-head">{copy.ui.skills}</p>
        <p className="w4a-side-skill" data-w4a-skill="">
          <span className="w4a-skill-name">{data.skill.name}</span>
          <span className="w4a-switch" data-on="" />
          <span className="sr-only">{copy.ui.on}</span>
        </p>
      </div>
      <div className="w4a-account" aria-hidden="true">
        <span className="w4a-avatar">CZ</span>
        <span className="w4a-account-name">Crvena Zemja</span>
      </div>
    </nav>
  );
}

/**
 * The depicted Claude app (claude-desktop-spec 4): a desktop window with the
 * sidebar, the chat and the panel; under 720px wide the Claude phone app with
 * the chat full screen, the sidebar as a drawer and the panel as a sheet.
 * Opaque like the real app; the only glass is the sheet. The chrome that does
 * nothing in the demo is aria-hidden. A file opens in Claude's own panel; the
 * check by hand is our exercise, drawn as a separate card over the window.
 */
export function ClaudeApp({
  data,
  copy,
  chats,
  chat,
  title,
  empty,
  turns,
  composer,
  panel,
  panelOpen,
  onPanelOpen,
  onChat,
  onFile,
  onCustomize,
  overlay,
  overlayLabel,
  main,
  mainTitle,
  sheetLead,
  scrollKey,
  answerKey,
  onLayout,
}: {
  readonly data: AppData;
  readonly copy: AppCopy;
  readonly chats: readonly SidebarChat[];
  readonly chat: number | null;
  readonly title: string;
  /** No message yet in this chat: the project greeting and the composer sit in the middle. */
  readonly empty: boolean;
  readonly turns: ReactNode;
  readonly composer: ReactNode;
  readonly panel: AppPanel | null;
  readonly panelOpen: boolean;
  readonly onPanelOpen: (open: boolean) => void;
  readonly onChat: (chat: number) => void;
  readonly onFile: (file: AppFile) => void;
  /** Customize in the sidebar opens the skill setup. */
  readonly onCustomize?: () => void;
  /** Our own card over the dimmed window (the measurement, the take-home): not part of the app. */
  readonly overlay?: ReactNode;
  /** The name of the card over the window, for its scrollable region. */
  readonly overlayLabel?: string;
  /** Replaces the chat (Settings and Customize in the install walkthrough). */
  readonly main?: ReactNode;
  /** The title of the screen `main` shows ("Settings", "Customize"). */
  readonly mainTitle?: string;
  /** Phone: what the sheet shows above the check (the whole caption). */
  readonly sheetLead?: ReactNode;
  /** Changes when a new turn starts, so the chat pins to its end again. */
  readonly scrollKey: string;
  /** The step whose answer has just landed: the chat shows it from its start. */
  readonly answerKey?: string | null;
  /** Tells the demo whether the window is drawn as the phone app (the panel opens only on request there). */
  readonly onLayout?: (phone: boolean) => void;
}) {
  const windowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const width = useWidth(windowRef);
  const phone = width < PHONE_MAX;
  const [drawer, setDrawer] = useState(false);
  const pinned = usePinnedScroll(scrollRef, contentRef, scrollKey);
  useAnswerStart(scrollRef, pinned, answerKey ?? null);
  useEffect(() => {
    onLayout?.(phone);
  }, [onLayout, phone]);
  const date = recordedOn(data.recordedAt, data.locale);
  const showPanel = !phone && panel !== null && panelOpen && !main;
  const screenTitle = main ? (mainTitle ?? copy.ui.customize) : empty ? copy.ui.newChat : title;
  const sheetOpen = phone && panelOpen;

  const sidebar = (
    <Sidebar
      data={data}
      copy={copy}
      chats={chats}
      chat={chat}
      customize={Boolean(main) && mainTitle !== copy.ui.settings}
      onChat={(next) => {
        setDrawer(false);
        onChat(next);
      }}
      onFile={(file) => {
        setDrawer(false);
        onFile(file);
      }}
      onCustomize={
        onCustomize
          ? () => {
              setDrawer(false);
              onCustomize();
            }
          : undefined
      }
    />
  );

  return (
    <div
      ref={windowRef}
      className="w4a-window"
      data-phone={phone ? "" : undefined}
      data-panel={showPanel ? "open" : undefined}
      data-panel-kind={showPanel && panel ? panel.kind : undefined}
      data-rail={showPanel && panel?.kind === "file" && width < 1180 ? "" : undefined}
      data-w4a-window=""
    >
      {phone ? (
        <header className="w4a-phonebar">
          <button type="button" className="w4a-icon-btn" aria-label={copy.ui.menu} aria-expanded={drawer} onClick={() => setDrawer(true)} data-w4a-menu="">
            <Icon name="menu" size={20} />
          </button>
          <p className="w4a-phonebar-title">
            <span className="w4a-phonebar-chat" data-w4a-title="">
              {screenTitle}
            </span>
            <span className="w4a-phonebar-model">{fill(copy.depiction, { date })}</span>
          </p>
        </header>
      ) : (
        <header className="w4a-titlebar">
          <span className="w4a-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <p className="w4a-depiction" data-w4a-depiction="">
            {fill(copy.depiction, { date })}
          </p>
        </header>
      )}
      <div className="w4a-body">
        {phone ? null : sidebar}
        <section className="w4a-main" aria-label={screenTitle}>
          {main ?? (
            <>
              {phone ? null : (
                <div className="w4a-chathead">
                  <span className="w4a-crumb">{data.project}</span>
                  <span className="w4a-crumb-sep" aria-hidden="true">
                    /
                  </span>
                  <span className="w4a-crumb-chat" data-w4a-title="">
                    {screenTitle}
                  </span>
                </div>
              )}
              <div ref={scrollRef} className="w4a-scroll" data-empty={empty ? "" : undefined}>
                <div ref={contentRef} className="w4a-column">
                  {empty ? (
                    <div className="w4a-greeting">
                      <p className="w4a-greeting-project">
                        <Icon name="folder" size={16} />
                        {data.project}
                      </p>
                      <p className="w4a-greeting-text">{copy.ui.start}</p>
                    </div>
                  ) : null}
                  {turns}
                </div>
              </div>
              <div className="w4a-composer-slot" data-empty={empty ? "" : undefined}>
                {composer}
              </div>
            </>
          )}
        </section>
        {showPanel && panel ? (
          <aside className="w4a-panel" data-kind={panel.kind} aria-label={panel.title} data-w4a-panel={panel.key}>
            <header className="w4a-panel-head">
              {panel.onBack ? (
                <button type="button" className="w4a-icon-btn" aria-label={panel.backLabel} onClick={panel.onBack} data-w4a-panel-back="">
                  <Icon name="back" size={16} />
                </button>
              ) : null}
              <p className="w4a-panel-title">
                {panel.kind === "check" ? <span className="w4a-panel-kicker">{copy.panel.exercise}</span> : null}
                <span>{panel.title}</span>
                <span className="w4a-panel-meta">{panel.meta}</span>
              </p>
              <button type="button" className="w4a-icon-btn" aria-label={copy.panel.close} onClick={() => onPanelOpen(false)} data-w4a-panel-close="">
                <Icon name="close" size={16} />
              </button>
            </header>
            <div className="w4a-panel-body">{panel.body}</div>
          </aside>
        ) : null}
        {phone && drawer ? (
          <div className="w4a-drawer" data-w4a-drawer="">
            {sidebar}
            <button type="button" className="w4a-scrim" aria-label={copy.ui.closeMenu} onClick={() => setDrawer(false)} />
          </div>
        ) : null}
      </div>
      {overlay ? (
        <div className="w4a-overlay" data-w4a-overlay="">
          <div className="w4a-overlay-card" role="region" aria-label={overlayLabel} tabIndex={0}>
            {overlay}
          </div>
        </div>
      ) : null}
      {phone && ((panel && !main) || sheetLead) ? (
        <GlasSheet
          open={sheetOpen}
          onClose={() => onPanelOpen(false)}
          title={panel?.kind === "file" ? panel.title : copy.sheet.title}
          closeLabel={copy.panel.close}
          resizeLabel={copy.panel.open}
          detent="large"
        >
          <div className="w4a-sheet" data-w4a-panel={panel?.key ?? "caption"}>
            {panel?.onBack ? (
              <button type="button" className="w4a-sheet-back" onClick={panel.onBack} data-w4a-panel-back="">
                <Icon name="back" size={16} />
                {panel.backLabel}
              </button>
            ) : null}
            {panel?.kind === "file" ? (
              <p className="w4a-panel-meta">{panel.meta}</p>
            ) : (
              <>
                {sheetLead ? <div className="w4a-sheet-lead">{sheetLead}</div> : null}
                {panel ? (
                  <p className="w4a-sheet-kicker">
                    <span className="w4a-panel-kicker">{copy.panel.exercise}</span>
                    <span className="w4a-sheet-title">{panel.title}</span>
                    <span className="w4a-panel-meta">{panel.meta}</span>
                  </p>
                ) : null}
              </>
            )}
            {panel?.body}
          </div>
        </GlasSheet>
      ) : null}
    </div>
  );
}

/** The model as the composer's menu shows it ("Sonnet 5.5"), from the recording. */
export function modelLabel(data: AppData): string {
  return modelShortName(data.model);
}

export { sizeLabel };
