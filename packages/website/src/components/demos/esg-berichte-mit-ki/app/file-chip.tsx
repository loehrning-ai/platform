import { GlasIcon, type GlasIconName } from "@/components/demos/glas";
import { sizeLabel, type AppFile, type AppFileKind } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";

/** An outlined icon at a pixel size (the Glas icons are drawn on a 20px grid). */
export function Icon({ name, size = 16 }: { readonly name: GlasIconName; readonly size?: number }) {
  return <GlasIcon name={name} width={size} height={size} />;
}

const KIND_LABEL: Readonly<Record<AppFileKind, string>> = { csv: "CSV", md: "MD", txt: "TXT", png: "PNG", xlsx: "XLSX", zip: "ZIP" };

/** "CSV, 1,9 KB": the type and size Claude prints under a file's name (no words in the visitor's language inside the app). */
export function fileMeta(file: AppFile, locale: "de" | "en"): string {
  return `${KIND_LABEL[file.kind]}, ${sizeLabel(file.bytes, locale)}`;
}

/** The small file badge Claude draws for a file type. */
export function FileIcon({ kind }: { readonly kind: AppFileKind }) {
  return (
    <span className="w4a-fileicon" data-kind={kind} aria-hidden="true">
      {KIND_LABEL[kind]}
    </span>
  );
}

/** An attached file as Claude shows it in a message: badge, name, type and size. Tapping opens it beside the chat. */
export function FileChip({ file, locale, onOpen, label }: { readonly file: AppFile; readonly locale: "de" | "en"; readonly onOpen?: () => void; readonly label?: string }) {
  const inner = (
    <>
      <FileIcon kind={file.kind} />
      <span className="w4a-chip-text">
        <span className="w4a-chip-name">{file.name}</span>
        <span className="w4a-chip-meta">{fileMeta(file, locale)}</span>
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" className="w4a-chip" onClick={onOpen} aria-label={label} data-w4a-chip={file.path}>
      {inner}
    </button>
  ) : (
    <span className="w4a-chip" data-w4a-chip={file.path}>
      {inner}
    </span>
  );
}
