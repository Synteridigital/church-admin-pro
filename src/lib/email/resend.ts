import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendStaffInvite({
  to,
  fullName,
  churchName,
  link,
}: {
  to: string;
  fullName: string;
  churchName: string;
  link: string;
}) {
  const { error } = await getResend().emails.send({
    from: "Church Admin Pro <welcome@mailsend.synteridigital.com>",
    replyTo: "sony@synteridigital.com",
    to,
    subject: `You've been added to ${churchName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #eaeaea;padding:32px;">
        <tr><td>
          <div style="width:40px;height:40px;border-radius:10px;background:#7A1E2B;color:#fff;font-size:18px;line-height:40px;text-align:center;margin-bottom:20px;">⛪</div>
          <h1 style="font-size:18px;font-weight:600;margin:0 0 8px;">Welcome to ${churchName}</h1>
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
            Hi ${fullName},<br><br>
            An administrator at <strong>${churchName}</strong> has created an account for you
            on Church Admin Pro. To get started, set your password using the button below.
          </p>
          <a href="${link}" style="display:inline-block;padding:12px 28px;background:#7A1E2B;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
            Set your password
          </a>
          <p style="font-size:12px;color:#999;margin-top:24px;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color:#7A1E2B;word-break:break-all;">${link}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    text: `Hi ${fullName},\n\nYou've been added to ${churchName} on Church Admin Pro.\n\nSet your password here: ${link}\n\nIf you didn't expect this email, you can safely ignore it.`,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
