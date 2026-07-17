import type { Metadata } from "next";
import localFont from "next/font/local";

import "./_styles/blog.css";
import "./_styles/blog-index.css";
import "./_styles/post.css";

const typing = localFont({
  src: [
    { path: "../../fonts/typing/Typing-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/typing/Typing-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/typing/Typing-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../fonts/typing/Typing-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-typing",
  display: "swap",
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
