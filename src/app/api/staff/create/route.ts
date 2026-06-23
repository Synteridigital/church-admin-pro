import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSBClient } from "@supabase/supabase-js";
import { sendStaffInvite } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    // 1. Authenticate the caller
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify caller is super-admin and get their org_id (server-derived)
    const { data: callerProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("org_id, is_super_admin")
      .eq("id", user.id)
      .single();

    if (profileErr || !callerProfile?.is_super_admin) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const orgId = callerProfile.org_id;

    // 3. Parse & validate body
    const body = await request.json();
    const fullName = (body.fullName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const roleKeys: string[] = Array.isArray(body.roleKeys) ? body.roleKeys : [];

    if (!fullName || !email || roleKeys.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Full name, email, and at least one role are required." },
        { status: 400 }
      );
    }

    // 4. Service-role client for admin operations
    const serviceRole = createSBClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Create the auth user (pre-confirmed, random temp password)
    const tempPassword =
      crypto.randomUUID() + crypto.randomUUID().slice(0, 8);

    const { data: newUser, error: createErr } =
      await serviceRole.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        return NextResponse.json(
          { ok: false, error: "A user with this email already exists." },
          { status: 409 }
        );
      }
      throw createErr;
    }

    // 6. Call handle_new_staff RPC
    const { error: rpcErr } = await serviceRole.rpc("handle_new_staff", {
      p_user_id: newUser.user.id,
      p_org_id: orgId,
      p_full_name: fullName,
      p_email: email,
      p_role_keys: roleKeys,
    });

    if (rpcErr) throw rpcErr;

    // 7. Generate password-set recovery link
    const origin = new URL(request.url).origin;

    const { data: linkData, error: linkErr } =
      await serviceRole.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${origin}/auth/confirm?next=/set-password` },
      });

    if (linkErr) throw linkErr;

    // Build the full link from the token hash
    const tokenHash = linkData.properties.hashed_token;
    const setPasswordLink = `${origin}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=/set-password`;

    // 8. Get church name for the email
    const { data: org } = await serviceRole
      .from("orgs")
      .select("name")
      .eq("id", orgId)
      .single();

    // 9. Send invite email via Resend
    await sendStaffInvite({
      to: email,
      fullName,
      churchName: org?.name ?? "Your Church",
      link: setPasswordLink,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/staff/create]", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
