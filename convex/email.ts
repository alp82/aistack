import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WaitlistLaunchEmail } from "../src/emails/WaitlistLaunchEmail";
import { FeatureUpdateEmail } from "../src/emails/FeatureUpdateEmail";
import { SyncBroadcastEmail } from "../src/emails/SyncBroadcastEmail";
import { UNSUBSCRIBE_PLACEHOLDER } from "../src/emails/styles";
import { signUnsubscribeToken } from "./emailToken";
import { getAppUrl } from "./httpCli";
import { isAdmin } from "./lib/admin";
import { EmailCategory } from "./schema";
import type { Infer } from "convex/values";
// @ts-ignore - components will be generated after convex dev restarts
import { internal, components } from "./_generated/api";

// Lowercase + dedupe email lists into their order-stable union (first lowercased occurrence wins; empty/blank dropped).
export function mergeAudience(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list) {
      const email = raw?.trim().toLowerCase();
      if (!email) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      out.push(email);
    }
  }
  return out;
}

// Remove suppressed (unsubscribed) addresses from an email list, case-insensitively.
// Order-stable, non-mutating, sync.
export function subtractSuppressed(
  emails: string[],
  suppressed: Set<string> | string[],
): string[] {
  const set = new Set<string>();
  for (const s of suppressed) set.add(s.trim().toLowerCase());
  return emails.filter((e) => !set.has(e.trim().toLowerCase()));
}

type Category = Infer<typeof EmailCategory>;

// The preferences column each category toggles. One name for one thing: the
// wire and the URL use "important-updates", the row uses `importantUpdates`.
const CATEGORY_FIELD = {
  newsletter: "newsletter",
  "important-updates": "importantUpdates",
} as const;

// Turn ONE category off for one address (#204). Every other category keeps
// whatever it had, which is the whole point of replacing the global list.
//
// Absent reads as subscribed to both, so the first refusal creates the row.
export const recordUnsubscribe = internalMutation({
  args: { email: v.string(), category: EmailCategory },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const field = CATEGORY_FIELD[args.category];
    const existing = await ctx.db
      .query("emailPreferences")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { [field]: false, updatedAt: Date.now() });
      return;
    }
    await ctx.db.insert("emailPreferences", {
      email,
      newsletter: args.category !== "newsletter",
      importantUpdates: args.category !== "important-updates",
      updatedAt: Date.now(),
    });
  },
});

// Every address that has turned THIS category off. Stored lowercased.
export const getSuppressedEmails = internalQuery({
  args: { category: EmailCategory },
  handler: async (ctx, args) => {
    const field = CATEGORY_FIELD[args.category];
    const rows = await ctx.db.query("emailPreferences").collect();
    return rows.filter((r) => r[field] === false).map((r) => r.email);
  },
});

const BROADCASTS: Record<
  string,
  {
    subject: string;
    render: () => Promise<string>;
    audience: "waitlist" | "waitlist+members";
    // Which toggle silences this send. A broadcast is a one-off announcement,
    // so every one of them is an important update, never the newsletter.
    category: Category;
    alreadySent?: boolean;
  }
> = {
  "waitlist-launch": {
    subject: "AI Stack is Live! 🚀",
    render: () => render(WaitlistLaunchEmail({})),
    audience: "waitlist",
    category: "important-updates",
    // When marking a broadcast sent, also add its id to SENT_BROADCASTS in EmailBroadcastsSection.tsx (UI gate).
    alreadySent: true,
  },
  // Registered and never sent. Its items (projects, accent colors) wait for
  // their own send; the owner keeps it visible in the admin UI meanwhile.
  "feature-update": {
    subject: "New on AI Stack: Promote, Share & Customize Your Stack",
    render: () => render(FeatureUpdateEmail({})),
    audience: "waitlist+members",
    category: "important-updates",
  },
  "sync-broadcast": {
    subject: "Show your real usage on your stack",
    render: () => render(SyncBroadcastEmail({})),
    audience: "waitlist+members",
    category: "important-updates",
    // Sent 2026-08-17 to the deduped waitlist+members audience (177 addresses).
    alreadySent: true,
  },
};

export const sendWaitlistConfirmEmail = internalAction({
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

// Internal query to get all waitlist emails for broadcast
export const getWaitlistEmails = internalQuery({
  args: {},
  handler: async (ctx) => {
    const waitlist = await ctx.db.query("waitlist").collect();
    return waitlist.map((entry) => entry.email);
  },
});

// Enumerate every registered better-auth member's email by paginating the mounted component's
// user table (members are not in app schema). No `where` = all users. Returns lowercased, non-empty emails.
// Shared by getMemberEmails (broadcast send) and getBroadcastRecipientCount (admin count) so both
// resolve the same member set. Works from any ctx with `runQuery` (query or action).
async function collectMemberEmails(ctx: {
  runQuery: (...args: any[]) => Promise<any>;
}): Promise<string[]> {
  const emails: string[] = [];
  let cursor: string | null = null;
  for (;;) {
    const result: {
      page: Array<{ email?: string }>;
      isDone: boolean;
      continueCursor: string;
    } = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      paginationOpts: { numItems: 200, cursor },
    });
    for (const user of result.page) {
      const email = user.email?.trim().toLowerCase();
      if (email) emails.push(email);
    }
    if (result.isDone) break;
    cursor = result.continueCursor;
  }
  return emails;
}

export const getMemberEmails = internalQuery({
  args: {},
  handler: async (ctx) => collectMemberEmails(ctx),
});

// Real recipient count for a broadcast: the deduped, unsubscribe-filtered audience
// (waitlist [+ members]) - the same set sendBroadcast actually emails, so the admin
// dialog shows true reach rather than the raw waitlist size. Reactive (query).
export const getBroadcastRecipientCount = query({
  args: { broadcastId: v.string() },
  handler: async (ctx, args) => {
    const entry = BROADCASTS[args.broadcastId];
    if (!entry) return 0;
    const waitlistEmails = (await ctx.db.query("waitlist").collect()).map(
      (e) => e.email,
    );
    const memberEmails =
      entry.audience === "waitlist+members" ? await collectMemberEmails(ctx) : [];
    const field = CATEGORY_FIELD[entry.category];
    const suppressed = (await ctx.db.query("emailPreferences").collect())
      .filter((r) => r[field] === false)
      .map((r) => r.email);
    return subtractSuppressed(
      mergeAudience(waitlistEmails, memberEmails),
      suppressed,
    ).length;
  },
});

// Send test email to the current admin user
export const sendTestEmail = action({
  args: {
    broadcastId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the current user's email from auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      return { success: false, message: "Not authenticated or no email found" };
    }

    if (!(await isAdmin(ctx))) {
      return { success: false, message: "Unauthorized" };
    }

    const entry = BROADCASTS[args.broadcastId];
    if (!entry) {
      return { success: false, message: "Unknown broadcast ID" };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return { success: false, message: "Email service not configured" };
    }

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      console.error("BETTER_AUTH_SECRET environment variable is not set");
      return { success: false, message: "Email service not configured" };
    }

    const appUrl = getAppUrl();
    if (!appUrl.startsWith("https://")) {
      console.error("APP_URL is not an https URL - refusing test email to prevent broken unsubscribe links");
      return { success: false, message: "Email service not configured" };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = await entry.render();
    if (!html.includes(UNSUBSCRIBE_PLACEHOLDER)) {
      console.error("Rendered template is missing the unsubscribe placeholder");
      return { success: false, message: "Unsubscribe link missing from template" };
    }

    const url =
      (
        await buildUnsubscribeUrls(
          [identity.email],
          secret,
          appUrl,
          entry.category,
        )
      ).get(identity.email) ?? "";
    const personalizedHtml = html.replaceAll(UNSUBSCRIBE_PLACEHOLDER, url);

    try {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: identity.email,
        subject: `[TEST] ${entry.subject}`,
        html: personalizedHtml,
        headers: {
          "List-Unsubscribe": `<${url}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (error) {
        console.error("Failed to send test email:", error);
        return { success: false, message: JSON.stringify(error) };
      }

      return { success: true, message: `Test email sent to ${identity.email}` };
    } catch (error) {
      console.error("Error sending test email:", error);
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

// Reusable broadcast email sender with rate limiting and detailed logging
// Sends emails one at a time with 1 second delay to respect Resend rate limit (2/sec)
// Usage example for future broadcasts:
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   const html = await render(MyEmailTemplate({}));
//   const result = await sendBroadcastEmails(resend, emails, "Subject", html);

// Unified return type for sendBroadcast - all branches return this shape.
// Fields that are only present on some branches (early-exit vs. full send) are optional.
type BroadcastSendResult = {
  success: boolean;
  sent: number;
  failed: number;
  total?: number;
  sentEmails?: string[];
  errors?: { email: string; error: string }[];
  message?: string;
  alreadySent?: boolean;
  suppressed?: number;
};

// Internal result type for the low-level sender (always has total/sentEmails/errors).
interface BroadcastResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
  sentEmails: string[];
  errors: { email: string; error: string }[];
}

// Build a signed unsubscribe URL for each recipient concurrently.
// NOTE: rotating BETTER_AUTH_SECRET invalidates all outstanding unsubscribe
// links (tokens never expire); only rotate with a dual-verify grace window.
//
// The token still signs the ADDRESS only, and the category rides beside it as a
// plain parameter. Two reasons. Every unsubscribe link already in a sent inbox
// keeps working, and those cannot be migrated. And the category is not a
// secret: the token proves the holder owns the address, and the only
// preferences they can reach are their own.
async function buildUnsubscribeUrls(
  recipients: string[],
  secret: string,
  appUrl: string,
  category: Category,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    recipients.map(async (email) => {
      const token = await signUnsubscribeToken(email, secret);
      return [
        email,
        `${appUrl}/api/email/unsubscribe?token=${token}&category=${category}`,
      ] as const;
    }),
  );
  return new Map(entries);
}

async function sendBroadcastEmails(
  resend: Resend,
  emails: string[],
  subject: string,
  html: string,
  unsubUrlFor: (email: string) => string
): Promise<BroadcastResult> {
  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];
  const sentEmails: string[] = [];

  console.log(`Starting broadcast to ${emails.length} recipients (1 email per second)...`);

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`Sending ${i + 1}/${emails.length}: ${email}`);

    const url = unsubUrlFor(email);
    const personalizedHtml = html.replaceAll(UNSUBSCRIBE_PLACEHOLDER, url);

    try {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: email,
        subject,
        html: personalizedHtml,
        headers: {
          "List-Unsubscribe": `<${url}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      
      if (error) {
        failed++;
        const errorMsg = JSON.stringify(error);
        errors.push({ email, error: errorMsg });
        console.error(`✗ Failed: ${email} - ${errorMsg}`);
      } else {
        sent++;
        sentEmails.push(email);
        console.log(`✓ Sent: ${email}`);
      }
    } catch (err) {
      failed++;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push({ email, error: errorMsg });
      console.error(`✗ Failed: ${email} - ${errorMsg}`);
    }

    // Wait 1 second before next email (except for the last one)
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n=== Broadcast Summary ===`);
  console.log(`Total: ${emails.length}, Sent: ${sent}, Failed: ${failed}`);
  if (sentEmails.length > 0) {
    console.log(`Sent to: ${sentEmails.join(", ")}`);
  }
  if (errors.length > 0) {
    console.log(`Failed emails:`);
    for (const err of errors) {
      console.log(`  - ${err.email}: ${err.error}`);
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    total: emails.length,
    sentEmails,
    errors,
  };
}

// Send a registered broadcast to all waitlist subscribers.
// Refuses broadcasts flagged alreadySent as a safety check.
export const sendBroadcast = action({
  args: {
    broadcastId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<BroadcastSendResult> => {
    if (!(await isAdmin(ctx))) {
      return { success: false, sent: 0, failed: 0, message: "Unauthorized" };
    }

    const entry = BROADCASTS[args.broadcastId];
    if (!entry) {
      return { success: false, sent: 0, failed: 0, message: "Unknown broadcast ID" };
    }

    if (entry.alreadySent) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        alreadySent: true,
        message: "This broadcast has already been sent to all subscribers",
      };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return { success: false, sent: 0, failed: 0, message: "Email service not configured" };
    }

    // Never ship unsigned unsubscribe links - without the signing secret we
    // cannot build verifiable tokens, so refuse like a missing RESEND key.
    // WARNING: rotating BETTER_AUTH_SECRET invalidates all outstanding
    // unsubscribe links (tokens never expire). Only rotate with a dual-verify
    // grace window so existing links remain honored during the transition.
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      console.error("BETTER_AUTH_SECRET environment variable is not set");
      return { success: false, sent: 0, failed: 0, message: "Email service not configured" };
    }

    // Refuse to send if APP_URL is not an https URL - localhost or missing
    // values would ship broken/localhost unsubscribe links and cause
    // mail clients to drop the List-Unsubscribe header.
    const appUrl = getAppUrl();
    if (!appUrl.startsWith("https://")) {
      console.error("APP_URL is not an https URL - refusing broadcast to prevent broken unsubscribe links");
      return { success: false, sent: 0, failed: 0, message: "Email service not configured" };
    }

    const waitlistEmails = await ctx.runQuery(internal.email.getWaitlistEmails, {});
    const memberEmails =
      entry.audience === "waitlist+members"
        ? await ctx.runQuery(internal.email.getMemberEmails, {})
        : [];
    const emails = mergeAudience(waitlistEmails, memberEmails);

    const optedOut = await ctx.runQuery(internal.email.getSuppressedEmails, {
      category: entry.category,
    });
    const recipients = subtractSuppressed(emails, optedOut);
    const suppressed = emails.length - recipients.length;

    const html = await entry.render();
    // Loud pre-send failure: the template MUST carry the placeholder we
    // personalize per recipient, else everyone gets a dead link.
    if (!html.includes(UNSUBSCRIBE_PLACEHOLDER)) {
      console.error("Rendered template is missing the unsubscribe placeholder");
      return { success: false, sent: 0, failed: 0, message: "Unsubscribe link missing from template" };
    }

    // Build signed unsubscribe URLs concurrently (signing is async per recipient).
    const urlByEmail = await buildUnsubscribeUrls(
      recipients,
      secret,
      appUrl,
      entry.category,
    );
    const unsubUrlFor = (e: string) => urlByEmail.get(e) ?? "";

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await sendBroadcastEmails(
      resend,
      recipients,
      entry.subject,
      html,
      unsubUrlFor,
    );
    return { ...result, suppressed };
  },
});
