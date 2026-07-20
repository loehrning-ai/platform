import { NextResponse, type NextRequest } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

async function signOut(request: NextRequest) {
  const supabase = await createAuthServerClient();
  if (supabase) await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export async function POST(request: NextRequest) {
  return signOut(request);
}

export function GET() {
  return new NextResponse("Use POST to sign out.", {
    status: 405,
    headers: {
      Allow: "POST",
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
