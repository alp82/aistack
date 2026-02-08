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
    const ctaUrl = `${process.env.SITE_URL || "https://aistack.to"}/waitlist/${args.lookupId}`;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eceef5">
        <h1 style="font-size:28px;margin:0 0 12px">You're on the list!</h1>
        <p style="font-size:16px;line-height:24px;margin:0 0 16px">Thanks for joining the AI Stack waitlist.</p>
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-size:14px;font-weight:600">Check your status</a>
      </div>
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
