# High Level Goals

Next milestone: Transform the waitlist into an MVP

## MVP Features
* Users can share their stacks
* Users can enter new tools
* Change Waitlist to Newsletter subscription
* Update Landing Page to show most recent and popular stacks

# Tasks
* Tasks are prioritized from top (first) to bottom (last)
* Whenever you start with a task, ask the user questions to clarify unknowns
* Whenever you face challenges during development, also ask the user questions
* Update task descriptions when gaining new info or completing them
* Use the question ask tool to verify with me if the task is complete or needs more work
* You can only declare a task as complete if you got my approval

## Users ✅
* ✅ users can sign up with email and Google SSO (Better Auth with trustedOrigins fix)
* ✅ using Better Auth's internal user tables (no separate custom users table needed)
* ✅ email verification enabled — sends verification email via Resend on signup
* ✅ password reset flow — forgot password page, reset email via Resend, reset password page
* ✅ users can sign out via user dropdown in header
* ✅ waitlist UI removed from frontend (DB table + convex functions retained for data preservation)
* ✅ header shows Sign In link when unauthenticated, user avatar dropdown with Sign Out when authenticated
* ✅ login page has forgot password link and sign up/sign in toggle