import type { Locale } from "@/lib/i18n/locale";
import { AGENT_ACCOUNT_COPY_DE } from "./ki-copy.de";
import { AGENT_ACCOUNT_COPY_EN } from "./ki-copy.en";

/**
 * Every learner-facing string on /konto/ki, in both locales.
 *
 * The page is a set of independent regions and each one can be empty, off, or
 * broken on its own, so every region carries its own empty state, its own
 * "not configured" state, and its own failure state. A region that cannot
 * answer says so; it never renders a confident-looking empty list.
 */

export interface AgentAccountCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly backToAccount: string;
  readonly sectionNavigationLabel: string;
  readonly sections: {
    readonly chat: string;
    readonly tokens: string;
    readonly grants: string;
    readonly activity: string;
  };

  readonly accountUnavailableTitle: string;
  readonly accountUnavailableBody: string;

  readonly endpointHeading: string;
  readonly endpointBody: string;
  readonly endpointLabel: string;
  /** Link out to the setup guide that walks each client through connecting. */
  readonly endpointHelpLink: string;
  readonly endpointOffTitle: string;
  readonly endpointOffBody: string;

  readonly chatHeading: string;
  readonly chatIntro: string;
  readonly chatOffTitle: string;
  readonly chatOffBody: string;

  readonly keyHeading: string;
  readonly keyDisclosure: string;
  readonly keyStored: (hint: string) => string;
  readonly keyValidated: (moment: string) => string;
  readonly keyMissing: string;
  readonly keyLabel: string;
  readonly keyPlaceholder: string;
  readonly keySave: string;
  readonly keyReplace: string;
  readonly keySaving: string;
  readonly keyDelete: string;
  readonly keyDeleting: string;
  readonly keySavedNotice: string;
  readonly keyDeletedNotice: string;
  readonly keyShapeError: string;
  readonly keyUnknownError: string;
  readonly keyStateUnavailable: string;

  readonly modelLabel: string;
  readonly modelHint: string;

  readonly chatLabel: string;
  readonly chatPlaceholder: string;
  readonly chatSend: string;
  readonly chatSending: string;
  readonly chatStop: string;
  readonly chatClear: string;
  readonly chatEmpty: string;
  readonly chatNeedsKey: string;
  readonly chatRoleUser: string;
  readonly chatRoleAssistant: string;
  readonly chatToolUsed: (tool: string) => string;
  readonly chatLessonChip: (lesson: string) => string;
  readonly chatLessonRemove: string;
  readonly chatTranscriptNote: string;
  readonly chatUnknownError: string;
  readonly chatLogLabel: string;

  readonly tokensHeading: string;
  readonly tokensIntro: string;
  readonly tokenNameLabel: string;
  readonly tokenNamePlaceholder: string;
  readonly tokenCreate: string;
  readonly tokenCreating: string;
  readonly tokenOnceTitle: string;
  readonly tokenOnceBody: string;
  readonly tokenCopy: string;
  readonly tokenCopied: string;
  readonly tokenDismiss: string;
  readonly tokensEmpty: string;
  readonly tokenCreated: (moment: string) => string;
  readonly tokenLastUsed: (moment: string) => string;
  readonly tokenNeverUsed: string;
  readonly tokenRevokedAt: (moment: string) => string;
  readonly tokenRevoke: string;
  readonly tokenRevoking: string;
  readonly tokenActiveCount: (active: number, limit: number) => string;
  readonly tokenLimitReached: string;
  readonly tokenNameRequired: string;
  readonly tokenUnknownError: string;
  readonly tokensUnavailable: string;

  readonly grantsHeading: string;
  readonly grantsIntro: string;
  readonly grantsEmpty: string;
  readonly grantScopesLabel: string;
  readonly grantNoScopes: string;
  readonly grantGranted: (moment: string) => string;
  readonly grantRevoke: string;
  readonly grantRevoking: string;
  readonly grantRevokedNotice: string;
  readonly grantUnknownError: string;
  readonly grantsSetupTitle: string;
  readonly grantsSetupBody: string;
  readonly grantsUnavailable: string;
  readonly grantsListLabel: string;

  readonly activityHeading: string;
  readonly activityIntro: string;
  readonly activityEmpty: string;
  readonly activityRetention: string;
  readonly activityUnavailable: string;
  readonly activityTableLabel: string;
  readonly activityColumnMoment: string;
  readonly activityColumnClient: string;
  readonly activityColumnTool: string;
  readonly activityColumnResult: string;
  readonly activityColumnDuration: string;
  readonly activityOk: string;
  readonly activityFailed: string;
  readonly activityDuration: (milliseconds: number) => string;
}

export const AGENT_ACCOUNT_COPY: Readonly<Record<Locale, AgentAccountCopy>> = {
  de: AGENT_ACCOUNT_COPY_DE,
  en: AGENT_ACCOUNT_COPY_EN,
};
