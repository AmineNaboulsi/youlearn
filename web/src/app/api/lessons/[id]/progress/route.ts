import { NextResponse, type NextRequest } from "next/server";

import { api, ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/current-user";
import type { Envelope, LessonProgress } from "@/lib/api/types";

/**
 * Forwards a playback progress report to the API.
 *
 * A route handler rather than a server action, for one reason: the player has
 * to report where the learner got to when the page goes away, and the only
 * thing that reliably survives `pagehide` is `navigator.sendBeacon` or a
 * `fetch(..., { keepalive: true })`. Neither can invoke a server action. Both
 * can POST to a URL.
 *
 * Everything that matters — enrolment, clamping watch time, deciding
 * completion — is enforced by the API. This is a courier.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d{1,10}$/.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // sendBeacon sends a Blob with no useful content type, so the body is parsed
  // rather than trusted to arrive as JSON.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { position_seconds: position, watched_delta_seconds: delta } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof position !== "number" || !Number.isFinite(position) || position < 0) {
    return NextResponse.json({ error: "invalid_position" }, { status: 400 });
  }

  try {
    const result = await api<Envelope<LessonProgress>>(`/lessons/${id}/progress`, {
      method: "POST",
      body: {
        position_seconds: Math.floor(position),
        watched_delta_seconds:
          typeof delta === "number" && Number.isFinite(delta) && delta > 0
            ? Math.floor(delta)
            : 0,
      },
    });

    return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;

    // A failed progress report is not worth interrupting playback over. The
    // player ignores the status and carries on; the next tick tries again.
    return NextResponse.json({ error: "not_recorded" }, { status });
  }
}
