import { NextResponse, type NextRequest } from "next/server";

import { apiCsv } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { getSession, primaryRole } from "@/lib/auth/current-user";

/**
 * Streams a CSV export to the browser.
 *
 * A route handler rather than a server action, for two reasons:
 *
 *  - It charges the API's export quota exactly once. An action that fetched
 *    the file and then redirected to a page that fetched it again would burn
 *    two of the user's hourly allowance for one download.
 *
 *  - It is a real file response, so the browser's own download machinery
 *    handles it — no base64 data URL, no blob, nothing held in memory by the
 *    page.
 *
 * The access token still never leaves the server: this endpoint is reached
 * with the session cookie, and the bearer token is attached server-side.
 *
 * Reached by a GET form submit rather than a <Link>, so Next's prefetching can
 * never trigger a download — or spend quota — on hover.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATASETS = new Set(["enrollments", "courses", "learners", "export_audit"]);

export async function GET(request: NextRequest) {
  const session = await getSession();
  const role = primaryRole(session?.user.roles ?? []);

  if (!session || (role !== "admin" && role !== "enseignant")) {
    return NextResponse.redirect(new URL("/not-allowed", request.url));
  }

  const params = request.nextUrl.searchParams;
  const dataset = params.get("dataset") ?? "";

  if (!DATASETS.has(dataset)) {
    return backWithNotice(request, "That export does not exist.");
  }

  const course = params.get("course") ?? "";
  const includePersonal = params.get("include_personal_data") === "on";

  try {
    const result = await apiCsv(`/exports/${dataset}`, {
      include_personal_data: includePersonal ? "1" : undefined,
      course: /^\d{1,10}$/.test(course) ? course : undefined,
    });

    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        // These travel back to the page that requested the download so the UI
        // can say what actually happened — how many rows, and whether the
        // ceiling truncated it.
        "X-Export-Rows": String(result.rows),
        "X-Export-Truncated": String(result.truncated),
        "X-Export-Masked": String(result.masked),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return backWithNotice(
      request,
      describeError(error, "The export could not be produced."),
    );
  }
}

function backWithNotice(request: NextRequest, message: string) {
  const url = new URL("/dashboard/exports", request.url);
  url.searchParams.set("notice", message);
  return NextResponse.redirect(url);
}
