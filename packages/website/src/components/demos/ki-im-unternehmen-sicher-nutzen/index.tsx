/*
 * DEMO CONTRACT · /demos/ki-im-unternehmen-sicher-nutzen (and /en/demos/ki-im-unternehmen-sicher-nutzen)
 *
 * Workshop 05 "Darf das in diesen Chat?": eight pastes at an invented firm.
 * The learner gives each a light (the kit's Rule 2), then sees where the data
 * goes and turns the account and the content to find out what would have to
 * change. Then Friday (deck slide 12) and three templates to copy.
 *
 * - Logic, data, copy and motion frames: src/lib/demo-cases/ki-im-unternehmen-sicher-nutzen.
 * - The island gets its words as a prop (textFor, one language), so its
 *   script carries no copy and the page ships only its own language.
 * - Every section, the question, Friday, the full "Zum Mitnehmen" and the
 *   sources render on the server. Only the learner's own results need playing.
 * - No collapsible UI. Motion is seek(t); reduced motion shows the end state.
 */
import { textFor } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { PasteLightDemo } from "./paste-light-demo";
import { Sources } from "./sources";
import "./paste-light.css";

interface Props {
  readonly locale: Locale;
}

const SLUG = "ki-im-unternehmen-sicher-nutzen";

export default function AiAtWorkDemo({ locale }: Props) {
  const workshopHref = localizeHref(`/workshops/${SLUG}`, locale);
  const kitHref = localizeHref(`/workshops/${SLUG}/kit`, locale);

  return (
    <div className="w05 grid gap-10 sm:gap-16" data-w05-demo="">
      {/* The scenes start right here, so there is no start button: the kit
          line and the jump to the templates sit under the section heading. */}
      <PasteLightDemo text={textFor(locale)} workshopHref={workshopHref} kitHref={kitHref} />

      <Sources locale={locale} />
    </div>
  );
}
