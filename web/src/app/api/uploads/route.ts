import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getSession, primaryRole } from "@/lib/auth/current-user";

/**
 * Forwards a chunked upload to the API.
 *
 * The browser has to drive this one — it is the only party that can slice a
 * File — so unlike everything else in this app the requests originate in the
 * client. They still do not carry a token: the browser talks to this route,
 * and this route attaches the bearer server-side.
 *
 * Three operations, distinguished by method and query string rather than by
 * three separate files, because they share the same forwarding logic:
 *
 *   POST   /api/uploads                     begin
 *   PATCH  /api/uploads?id=…&offset=…       append a chunk (raw binary)
 *   POST   /api/uploads?id=…&complete=1     finish
 *   DELETE /api/uploads?id=…                abandon
 *
 * The chunk body is streamed straight through. Buffering it here would put a
 * 5 MiB copy of every chunk into this process for no reason.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorise() {
  const session = await getSession();
  const role = primaryRole(session?.user.roles ?? []);

  // Only staff upload course material. The API checks this too; failing here
  // saves a pointless round trip and keeps the error legible.
  if (!session || (role !== "admin" && role !== "enseignant")) {
    return null;
  }

  return session;
}

export async function POST(request: NextRequest) {
  const session = await authorise();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const isComplete = request.nextUrl.searchParams.get("complete") === "1";

  const path = isComplete && id ? `/uploads/${encodeURIComponent(id)}/complete` : "/uploads";

  const body = await request.text();

  return forward(request, path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: body || "{}",
  });
}

export async function PATCH(request: NextRequest) {
  const session = await authorise();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const offset = request.nextUrl.searchParams.get("offset");

  if (!id || offset === null) {
    return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
  }

  // The chunk is read into a buffer rather than piped, because Node's fetch
  // requires a known length or an explicit duplex stream, and a 5 MiB ceiling
  // is small enough that the simpler path is the right trade.
  const chunk = await request.arrayBuffer();

  return forward(
    request,
    `/uploads/${encodeURIComponent(id)}?offset=${encodeURIComponent(offset)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
    },
  );
}

export async function DELETE(request: NextRequest) {
  const session = await authorise();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
  }

  return forward(request, `/uploads/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}

async function forward(_request: NextRequest, path: string, init: RequestInit) {
  let upstream: Response;

  try {
    upstream = await fetch(`${env.apiUrl}${path}`, { ...init, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "upload_unavailable", message: "The upload service is not responding." },
      { status: 503 },
    );
  }

  const text = await upstream.text();

  // The API's JSON is passed through intact: its validation messages ("that
  // file is 5 GB, the limit is 4 GB") are written for the person uploading.
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
