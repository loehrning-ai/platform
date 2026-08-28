export const SITE_ORIGIN = "https://loehrning.ai" as const;
export const SITE_NAME = "loehrning.ai" as const;
export const SITE_LANGUAGE = "de-DE" as const;
export const SITE_LANGUAGES = ["de-DE", "en-GB"] as const;
export const SITE_REGION = "DE" as const;

export const TIM_ENTITY = {
  displayName: "Tim Löhr",
  asciiName: "Tim Loehr",
  givenName: "Tim",
  familyName: "Löhr",
  profilePath: "/ueber-mich",
  profileUrl: `${SITE_ORIGIN}/ueber-mich`,
  portraitPath: "/ueber-mich/tim-loehr.jpg",
  portraitUrl: `${SITE_ORIGIN}/ueber-mich/tim-loehr.jpg`,
  email: "tim@loehrning.ai",
  role: "Kurator von loehrning.ai",
  linkedInUrl: "https://www.linkedin.com/in/tim-loehr-821ba8188/",
  personalGithubUrl: "https://github.com/Mavengence",
  knowsAbout: [
    "KI-Kompetenz",
    "EU AI Act",
    "Data Engineering",
    "AI-native Workflows",
    "Workflow-Automatisierung",
    "Dateninfrastruktur",
  ],
  noEndorsementNotice:
    "Genannte frühere Arbeitgeber oder Plattformen dienen nur der biografischen Einordnung. Sie bestätigen oder unterstützen loehrning.ai nicht.",
} as const;

export const GITHUB_ORG = {
  slug: "loehrning-ai",
  displayName: "loehrning.ai",
  url: "https://github.com/loehrning-ai",
} as const;

export const SITE_ENTITY = {
  name: SITE_NAME,
  origin: SITE_ORIGIN,
  profileUrl: TIM_ENTITY.profileUrl,
  openSourcePath: "/open-source",
  openSourceUrl: `${SITE_ORIGIN}/open-source`,
  description:
    "Freie KI- und Daten-Lernplattform von Tim Löhr mit Kursen, Büchern, Workshops, Demos und offenen Quellartefakten auf Deutsch und Englisch.",
  publisherType: "Organization",
  editorialOwner: TIM_ENTITY.displayName,
  socialHandlePolicy:
    "sameAs enthält nur aktuell verifizierte persönliche Profile und Organisationen.",
} as const;

/** Profiles that unambiguously identify Tim Löhr as a person. */
export const PERSON_SAME_AS_URLS = [
  TIM_ENTITY.linkedInUrl,
  TIM_ENTITY.personalGithubUrl,
] as const;

/** Profiles that unambiguously identify the loehrning.ai organization. */
export const ORGANIZATION_SAME_AS_URLS = [
  GITHUB_ORG.url,
] as const;

export const ENTITY_IDS = {
  organization: `${SITE_ORIGIN}/#org`,
  person: `${SITE_ORIGIN}/#tim`,
  website: `${SITE_ORIGIN}/#website`,
} as const;

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized === "/" ? "" : normalized}`;
}
