import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/current-user";

/**
 * Streams an uploaded file from the API to the browser.
 *
 * This exists because of a genuine tension in the design. Everything else in
 * this app is fetched server-side so the access token never reaches the
 * browser — but a `<video src>` is fetched *by the browser*, which has no token
 * to send. Two ways out: hand the browser a short-lived signed URL, or proxy.
 *
 * Proxying wins here. A signed URL is a bearer credential in a query string:
 * it lands in browser history and any intermediary's logs, and once issued it
 * cannot be revoked before it expires. Proxying keeps the token on the server
 * and means the API re-checks enrolment on every single range request — so
 * revoking access stops playback mid-video rather than at the end of a
 * signature's lifetime.
 *
 * Range headers are forwarded in both directions, which is what makes seeking
 * work: the browser asks for a byte window, the API answers 206 with a
 * Content-Range, and both pass through untouched. The body is piped as a
 * stream, so a 700 MB video never lands in this process's memory.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Response headers worth forwarding. Everything else is ours to decide. */
const FORWARDED = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;

  // The id is opaque and fixed-format; anything else is not worth a round trip.
  if (!/^[a-f0-9]{32}$/.test(publicId)) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await getSession();

  const headers: Record<string, string> = {};
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;

  // Forwarded verbatim. The API is the one that decides whether a partial
  // request is satisfiable, and re-deriving that here would be a second
  // implementation of the same rule.
  const range = request.headers.get("range");
  if (range) headers.Range = range;

  let upstream: Response;

  try {
    upstream = await fetch(`${env.apiUrl}/assets/${publicId}`, {
      headers,
      cache: "no-store",
      // No timeout: a large video legitimately takes minutes to stream, and an
      // AbortSignal here would cut off long playback mid-lesson.
    });
  } catch {
    return NextResponse.json(
      { error: "media_unavailable", message: "The video could not be loaded." },
      { status: 503 },
    );
  }

  if (!upstream.ok && upstream.status !== 206) {
    // Pass the status through so the player can tell "not allowed" from
    // "not found", but never the API's body — it is JSON, and a <video>
    // element trying to decode an error payload produces nothing useful.
    return new NextResponse(null, { status: upstream.status });
  }

  const responseHeaders = new Headers();

  for (const name of FORWARDED) {
    const value = upstream.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }

  responseHeaders.set("Cache-Control", "private, no-store");
  responseHeaders.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
