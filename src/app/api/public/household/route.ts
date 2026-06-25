import { NextResponse } from "next/server";
import { createClient as createSBClient } from "@supabase/supabase-js";
import { z } from "zod";

// ─── Rate limiting (in-memory, per-process) ───
const submissions = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissions.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return false;
}

// ─── Server-side validation ───
const personSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
}).passthrough();

const payloadSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  submission_type: z.enum(["self", "household", "child"]),
}).passthrough();

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Resolve org from slug or token — NEVER trust org_id from body
    const slug = (body._slug ?? "").trim();
    const token = (body._token ?? "").trim();

    if (!slug && !token) {
      return NextResponse.json(
        { ok: false, error: "Missing church identifier." },
        { status: 400 }
      );
    }

    // Validate required fields
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid form data. Please check your entries." },
        { status: 400 }
      );
    }

    // Validate spouse if present
    if (body.spouse && typeof body.spouse === "object") {
      const spouseParsed = personSchema.safeParse(body.spouse);
      if (!spouseParsed.success) {
        return NextResponse.json(
          { ok: false, error: "Invalid spouse data. Please check the entries." },
          { status: 400 }
        );
      }
    }

    // Service-role client — bypasses RLS
    const serviceRole = createSBClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let orgId: string | null = null;

    if (token) {
      const { data: tokenRow, error: tokenErr } = await serviceRole
        .from("public_form_tokens")
        .select("id, org_id, form_type, expires_at")
        .eq("token", token)
        .single();

      if (tokenErr || !tokenRow) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired link." },
          { status: 404 }
        );
      }

      if (tokenRow.form_type !== "household") {
        return NextResponse.json(
          { ok: false, error: "This link is not for household registration." },
          { status: 400 }
        );
      }

      if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
        return NextResponse.json(
          { ok: false, error: "This link has expired." },
          { status: 410 }
        );
      }

      orgId = tokenRow.org_id;

      await serviceRole
        .from("public_form_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenRow.id);
    } else {
      const { data: org, error: orgErr } = await serviceRole
        .from("orgs")
        .select("id")
        .eq("slug", slug)
        .single();

      if (orgErr || !org) {
        return NextResponse.json(
          { ok: false, error: "Church not found." },
          { status: 404 }
        );
      }

      orgId = org.id;
    }

    // Strip internal/routing fields before passing to the function
    const { _slug: _s, _token: _t, ...payload } = body;

    // Call the public intake function with server-resolved org_id
    const { data, error } = await serviceRole.rpc("handle_public_household_intake", {
      p_org_id: orgId,
      p_payload: payload,
    });

    if (error) {
      console.error("[POST /api/public/household]", error);
      return NextResponse.json(
        { ok: false, error: "Submission failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/public/household]", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
