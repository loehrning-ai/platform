import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { courseFacts } from "@/lib/courses/tracks";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

type CourseDiscoveryItem = Readonly<{
  title: string;
  description: string;
  href: string;
  language: "de" | "en";
  launchHref: string;
  licenseHref?: string;
  group: "spine" | "deeper";
}>;

function absoluteHref(href: string): string {
  return href.startsWith("http") ? href : `${SITE_URL}${href}`;
}

function courseItems(locale: Locale): readonly CourseDiscoveryItem[] {
  const nativeCourses = localizeCatalog(COURSE_CATALOG, locale).map(
    (course) => {
      const facts = courseFacts(course.slug);
      return {
        title: course.title,
        description: course.description,
        href: localizeHref(course.href, locale),
        language: locale,
        launchHref: localizeHref(course.startHref, locale),
        licenseHref: course.licenseHref,
        group: facts.group,
      };
    },
  );

  const importedCourses = localizeCatalog(IMPORTED_COURSE_CATALOG, locale).map(
    (course) => ({
      title: course.title,
      description: course.description,
      href: localizeHref(course.href, locale),
      language: locale,
      launchHref: course.launchHref,
      licenseHref: course.licenseHref,
      group: "deeper" as const,
    }),
  );

  return [...nativeCourses, ...importedCourses];
}

function courseListItem(course: CourseDiscoveryItem, index: number) {
  const url = absoluteHref(course.href);
  return {
    "@type": "ListItem" as const,
    position: index + 1,
    url,
    item: {
      "@type": "Course" as const,
      name: course.title,
      description: course.description,
      url,
      provider: { "@id": ORG_ID },
      inLanguage: course.language,
      isAccessibleForFree: true,
      hasCourseInstance: {
        "@type": "CourseInstance" as const,
        courseMode: "online",
        inLanguage: course.language,
        url: absoluteHref(course.launchHref),
      },
      ...(course.licenseHref
        ? { license: absoluteHref(course.licenseHref) }
        : {}),
    },
  };
}

export function createCoursesGraph(locale: Locale) {
  const items = courseItems(locale);
  const foundationItems = items.filter((course) => course.group === "spine");
  const technicalItems = items.filter((course) => course.group === "deeper");
  const catalogPath = localizeHref("/kurse", locale);
  const catalogUrl = absoluteHref(catalogPath);

  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList" as const,
        itemListElement: [
          {
            "@type": "ListItem" as const,
            position: 1,
            name: locale === "de" ? "Start" : "Home",
            item: absoluteHref(localizeHref("/", locale)),
          },
          {
            "@type": "ListItem" as const,
            position: 2,
            name: locale === "de" ? "Kurse" : "Courses",
            item: catalogUrl,
          },
        ],
      },
      {
        "@type": "ItemList" as const,
        name:
          locale === "de"
            ? "Grundlagenpfad von loehrning.ai"
            : "loehrning.ai foundation path",
        itemListOrder: "https://schema.org/ItemListOrderAscending" as const,
        numberOfItems: foundationItems.length,
        itemListElement: foundationItems.map(courseListItem),
      },
      {
        "@type": "ItemList" as const,
        name:
          locale === "de"
            ? "Technikkurse von loehrning.ai"
            : "loehrning.ai technical courses",
        itemListOrder: "https://schema.org/ItemListUnordered" as const,
        numberOfItems: technicalItems.length,
        itemListElement: technicalItems.map(courseListItem),
      },
    ],
  };
}

/** German canonical graph retained for machine endpoints and compatibility. */
export const COURSES_GRAPH = createCoursesGraph("de");
