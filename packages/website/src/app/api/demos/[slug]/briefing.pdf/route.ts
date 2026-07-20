import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return new NextResponse("Demo PDF briefings are disabled in the learning platform.", {
    status: 410,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
