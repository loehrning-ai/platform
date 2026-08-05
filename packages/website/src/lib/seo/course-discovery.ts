import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseFacts } from "@/lib/courses/tracks";
import { ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

const COURSE_ITEMS = [
  ...COURSE_CATALOG.map((course) => ({
    title: course.title,
    description: course.description,
    href: course.href,
    language: courseFacts(course.slug).language === "Englisch" ? "en" : "de",
    launchHref: course.startHref,
    licenseHref: course.licenseHref,
  })),
  ...IMPORTED_COURSE_CATALOG.map((course) => ({
    title: course.title,
    description: course.description,
    href: course.href,
    language: course.language === "Englisch" ? "en" : "de",
    launchHref: course.launchHref,
    licenseHref: course.licenseHref,
  })),
];

export const COURSES_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Kurse",
          item: `${SITE_URL}/kurse`,
        },
      ],
    },
    {
      "@type": "ItemList",
      name: "Kostenlose KI-Kurse von loehrning.ai",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: COURSE_ITEMS.length,
      itemListElement: COURSE_ITEMS.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${course.href}`,
        item: {
          "@type": "Course",
          name: course.title,
          description: course.description,
          url: `${SITE_URL}${course.href}`,
          provider: { "@id": ORG_ID },
          inLanguage: course.language,
          isAccessibleForFree: true,
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            url: course.launchHref.startsWith("http")
              ? course.launchHref
              : `${SITE_URL}${course.launchHref}`,
          },
          ...(course.licenseHref
            ? {
                license: course.licenseHref.startsWith("/")
                  ? `${SITE_URL}${course.licenseHref}`
                  : course.licenseHref,
              }
            : {}),
        },
      })),
    },
  ],
};
