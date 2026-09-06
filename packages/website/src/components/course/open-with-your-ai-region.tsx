import { MCP_ENDPOINT_PATH } from "@/lib/mcp/config";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { absoluteUrl } from "@/lib/seo/entity";
import { getAgentRuntimeFeatures } from "@/lib/runtime-features";
import { OpenWithYourAi } from "./open-with-your-ai";
import {
  AGENT_HELP_PATH,
  type OpenWithYourAiKind,
  type OpenWithYourAiResource,
} from "./open-with-your-ai-copy";

/**
 * Server-side gate for the "open with your AI" action.
 *
 * Renders nothing at all when the agent surface is not ready in this
 * deployment: an address that answers 503 is worse than no offer. The check
 * has to happen here, because the readiness predicate reads server
 * environment that never reaches the browser bundle.
 */

interface OpenWithYourAiRegionProps {
  readonly kind: OpenWithYourAiKind;
  readonly contextTitle: string;
  readonly resources: readonly OpenWithYourAiResource[];
  readonly locale: Locale;
}

export function OpenWithYourAiRegion({
  kind,
  contextTitle,
  resources,
  locale,
}: OpenWithYourAiRegionProps) {
  if (resources.length === 0) return null;
  if (!getAgentRuntimeFeatures().agentAccess) return null;

  return (
    <OpenWithYourAi
      kind={kind}
      contextTitle={contextTitle}
      resources={resources}
      serverUrl={absoluteUrl(MCP_ENDPOINT_PATH)}
      helpHref={localizeHref(AGENT_HELP_PATH, locale)}
      locale={locale}
    />
  );
}
