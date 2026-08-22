import { NextResponse } from "next/server";

/**
 * Liveness, and which build is answering.
 *
 * Deploys are pull-based: CI pushes images and the instance reconciles itself
 * on a timer, so the workflow has no way to observe the result directly. This
 * is that observation — CI polls until the SHA it just built is the one
 * answering, which turns "the images were pushed" into "the change is live".
 *
 * Unauthenticated on purpose. It reveals a commit SHA of a public repository
 * and nothing else: no version numbers of anything an attacker could match to
 * an advisory, no configuration, no dependency inventory. A monitor that needs
 * a credential is a monitor that stops working when credentials rotate.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      // Baked in at image build time. "unknown" when the image was built
      // outside CI, which is the normal case locally.
      sha: process.env.BUILD_SHA ?? "unknown",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
