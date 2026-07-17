export const SITE_ORIGIN = "https://loehrning.ai" as const;
export const SITE_NAME = "loehrning.ai" as const;
export const SITE_LANGUAGE = "de-DE" as const;
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
  role: "Data Engineer und Betreiber von loehrning.ai",
  linkedInUrl: "https://www.linkedin.com/in/timloehr/",
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
    "Freie deutsche KI-Lernplattform von Tim Löhr mit Kursen, Büchern, Demos, Vorlagen und technischen Laboren.",
  publisherType: "Organization",
  editorialOwner: TIM_ENTITY.displayName,
  socialHandlePolicy:
    "sameAs enthält nur aktuell verifizierte persönliche Profile und Organisationen.",
} as const;

export const SAME_AS_URLS = [
  TIM_ENTITY.linkedInUrl,
  TIM_ENTITY.personalGithubUrl,
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
