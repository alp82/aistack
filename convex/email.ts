import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendWaitlistConfirmEmail = action({
  args: {
    email: v.string(),
    lookupId: v.string(),
  },
  handler: async (_, args) => {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return { success: false, error: "Email service not configured" };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const ctaUrl = `${process.env.APP_URL || "https://aistack.to"}/waitlist/${args.lookupId}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @keyframes buttonGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(163, 230, 53, 0); }
      50% { box-shadow: 0 0 24px 6px rgba(163, 230, 53, 0.5); }
    }
  </style>
</head>
<body style="background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;padding:48px 16px;margin:0">
  <div style="background-color:#ffffff;padding:0;margin:0 auto;width:100%;max-width:560px;overflow:hidden">
    <div style="background-color:#111111;padding:28px 40px">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:16px;height:16px;background-color:#a3e635;vertical-align:middle"></td>
        <td style="padding-left:12px;vertical-align:middle"><span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#fafafa;text-transform:uppercase;line-height:1">AI STACK</span></td>
      </tr></table>
    </div>
    <div style="padding:48px 40px 56px">
      <p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#737373;text-transform:uppercase;margin:0 0 12px">// Waitlist Confirmed</p>
      <h1 style="font-size:32px;font-weight:800;color:#0a0a0a;margin:0 0 24px;line-height:1.1;letter-spacing:-0.02em;text-transform:uppercase">You're on the list!</h1>
      <p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0 0 32px">Thanks for joining the AI Stack waitlist. We'll notify you when it's your turn to get access.</p>
      <div style="margin-top:16px;margin-bottom:16px">
        <a href="${ctaUrl}" style="display:inline-block;padding:16px 32px;background-color:#a3e635;color:#0a1f02;text-decoration:none;font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;animation:buttonGlow 2s ease-in-out infinite">CHECK YOUR STATUS  ⟶</a>
      </div>
      <p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:#737373;line-height:20px;margin:32px 0 0;letter-spacing:0.01em">Check your waitlist position anytime using the link above.</p>
    </div>
    <div style="background-color:#111111;padding:24px 40px">
      <p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:13px;color:#737373;line-height:20px;margin:0;letter-spacing:0.01em"><a href="https://aistack.to" style="color:#a3e635;text-decoration:none">AI Stack</a> · ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: args.email,
        subject: "You're on the AI Stack waitlist",
        html,
      });

      if (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }
  },
});
