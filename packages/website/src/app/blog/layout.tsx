import type { Metadata } from "next";
import localFont from "next/font/local";

import "./_styles/blog.css";
import "./_styles/blog-index.css";
import "./_styles/post.css";

const typing = localFont({
  src: [
    { path: "../../fonts/typing/Typing-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/typing/Typing-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/typing/Typing-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/typing/Typing-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-typing",
  display: "optional",
  // The root layout already preloads the platform fonts. Let the blog face load
  // only when CSS needs a specific weight instead of competing with LCP for
  // another four high-priority font transfers on every blog request. Optional
  // display also prevents a late editorial-face swap from moving article text.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Blog · Dispatches",
    template: "%s · loehrning.ai Blog",
  },
  description:
    "Lange, nachprüfbare Stücke über KI im Alltag, EU AI Act und KI in der Gesellschaft. Offen, mit Zahlen und Quellenangaben.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`blog-root ${typing.variable}`}>{children}</div>
  );
}
