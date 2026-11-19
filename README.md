# Navi Co. community website — V1

A responsive community site built with Node.js, Vite, vanilla HTML/CSS/JavaScript, and Supabase. Each public page has its own HTML file.

For the complete step-by-step Supabase, OAuth, admin, and Facebook API setup, see [SETUP.md](./SETUP.md).

## Run locally

1. Install Node.js 20 or later.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and set your Supabase project URL and **anon/publishable key**.
4. Run `npm run dev`, then open the local URL Vite prints.
5. To build for production, run `npm run build`.

Never put a Supabase `service_role` key in this browser app or commit real credentials.

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
2. Enable Email/Password and whichever OAuth providers you want (Google, GitHub, Discord) in Supabase Auth. Add the local and deployed site URLs to the Auth redirect allow list and configure provider credentials in Supabase.
3. Create the first admin user through Supabase Auth. In the Supabase dashboard or a trusted server-side admin tool, set that user's **app_metadata** to `{"role":"admin"}`. Do not assign roles from user-editable metadata or this website.
4. Enable Realtime for `public.discussion_messages` if you want live chat updates.
5. Deploy all four Edge Functions under `supabase/functions/`. Set `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, and `META_GRAPH_API_VERSION` as secrets for `publish-freedom-post`; Supabase supplies the project URL and keys, including the service role key. Keep all service-role and Meta secrets server-side.

## What's included

- Public home page, community feature sections, promotion cards, contact link, and responsive navigation.
- Separate pages: `index.html` (Home), `about.html`, `freedomwall.html`, `connect.html`, `contact.html`, `login.html`, `signup.html`, and `profile.html`.
- Public promotion-request form with an admin-only review queue; approval atomically publishes the request as a community promotion.
- Email/password sign-up and sign-in, plus Google, GitHub, and Discord OAuth buttons.
- Connect chat content is available only after sign-in. The dedicated profile page lets members view account details, edit username/email, change password after email OTP verification, log out, or delete their account after email verification.
- Freedom Wall submissions have no user ID or IP column, are inserted as pending, and only approved posts are publicly readable. Admins can approve, reject, and delete submissions.
- Authenticated discussion chat, member list and suspend/restore controls, announcement and promotion CRUD in the admin page at `/admin.html`. The admin login screen has no top navigation bar. Admin account changes are server-side and cannot suspend admin accounts or the current admin.
- RLS policies are included with the schema. Admin status is checked using trusted Supabase `app_metadata`.

## Production integrations and privacy notes

- Facebook publishing requires deploying the Edge Function and configuring the Meta Page token and Graph API version. The function only publishes approved posts, claims each post to avoid concurrent duplicates, and records failures so admins can retry. If Facebook accepted a post but the database update failed, check the Page before retrying to avoid a duplicate.
- The Freedom Wall intentionally does not store a submitter account ID or IP in its table. Database/platform infrastructure may still retain operational logs; do not promise absolute anonymity without reviewing your Supabase hosting and retention settings. Public submission also needs server-side rate limiting and abuse controls before launch.
- The member screen lists up to 200 accounts. Suspension/restoration is handled by an admin-only Edge Function; admin accounts and the current administrator cannot be suspended there.
- Configure and review OAuth redirect URLs, email confirmation, backups, moderation workflow, and privacy/terms pages before production.
- Configure Gmail custom SMTP in Supabase and set the Reset Password email template to include `{{ .Token }}` for profile password-change and account-deletion OTPs. Keep the Gmail App Password in Supabase only; see [SETUP.md](./SETUP.md).
- Account deletion uses a server-side Edge Function, removes the member profile and discussion messages, and cannot be undone. Anonymous Freedom Wall posts and unlinked promotion requests may remain.
- Points, rewards, trading conversion, mini-games, events, and the e-goods shop are roadmap items, not active V1 functionality. Implement and review the rules, payment/provider APIs, and fraud controls before enabling them.
