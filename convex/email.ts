import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WaitlistConfirm } from "../src/emails/WaitlistConfirm";

export const sendWaitlistConfirmEmail = action({
  args: {
    email: v.string(),
    lookupId: v.string(),
  },
  handler: async (_, args) => {
    // Check for required environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return { success: false, error: "Email service not configured" };
    }

    // Initialize Resend inside the action to ensure env vars are loaded
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = await render(
      WaitlistConfirm({ 
        productName: "AI Stack", 
        ctaUrl: `${process.env.SITE_URL || "https://aistack.to"}/waitlist/${args.lookupId}`,
      })
    );

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev", // fallback to Resend's default
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
