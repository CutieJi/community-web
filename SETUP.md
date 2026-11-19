# Navi Co. V1 setup guide

This guide walks through local setup, Supabase, sign-in providers, admin access, and Facebook publishing. The site currently runs on Vite's default local address (`http://localhost:5173`); it does not require port 3000.

## 1. Run the website locally

1. Install Node.js 20 or later.
2. Open a terminal in the project folder and install dependencies:

   ```sh
   npm install
   ```

3. Create `.env` from `.env.example` if you do not already have `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

   If `.env` already exists, edit it in place. Do not overwrite it or share its contents.

4. Create a Supabase project (next section), then put its project URL and publishable/anon key in `.env`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

5. Start Vite:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite, normally `http://localhost:5173`. Restart Vite after changing `.env`.

The `VITE_` values are shipped to browsers. The publishable/anon key is intended for browser use with the database's Row Level Security (RLS) policies enabled. Never put a `service_role` key, OAuth client secret, or Meta token in `.env` or any `VITE_` variable.

## 2. Create and configure Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Save the database password securely; the site does not need it.
2. In the project dashboard, open the project's API settings (or the **Connect** dialog) and copy:
   - The project URL into `VITE_SUPABASE_URL`.
   - The publishable key, or the legacy anon key if that is what the project displays, into `VITE_SUPABASE_ANON_KEY`.
3. Open **SQL Editor**, create a query, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it once on this new project.

   The schema creates the V1 tables, indexes, profile-creation trigger, RLS policies, and promotion approval function. It is not a general-purpose migration and its policies are not safe to create twice. Do not rerun it blindly on an existing or partially configured project; check the SQL error and inspect the database first.

4. In **Authentication > Providers** (sometimes shown as **Sign In / Providers**), enable **Email**. Configure email confirmation to match how you want signups to work. If confirmation is enabled, new users must confirm their email before signing in.
5. To send OTP emails through Gmail, first enable [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification) on the Google account that will send Navi Co. emails. Then create a Google [App Password](https://myaccount.google.com/apppasswords), for example named `Navi Co Supabase`. Google displays the generated 16-digit password once; copy it securely. App Passwords may be unavailable for Workspace accounts controlled by an administrator or accounts using Advanced Protection.
6. In the Supabase dashboard, open **Authentication > SMTP Settings**, enable custom SMTP, and enter:

   | Setting | Value |
   | --- | --- |
   | Sender email | The same Gmail address used for SMTP |
   | Sender name | `Navi Co.` |
   | Host | `smtp.gmail.com` |
   | Port | `587` (STARTTLS) |
   | Username | The full Gmail address |
   | Password | The Google App Password (not your Google account password) |

   Save the settings. Keep the App Password only in Supabase's SMTP settings; do not put it in `.env`, frontend code, GitHub, or chat. Supabase's default mail service is limited to authorized project-team addresses and has strict sending limits, so custom SMTP is needed to send to ordinary user accounts.
7. Open **Authentication > Email Templates > Reset Password** and make the email show the code instead of only a reset link. For example:

   ```html
   <h2>Navi Co. account verification</h2>
   <p>Your one-time verification code is:</p>
   <p><strong>{{ .Token }}</strong></p>
   <p>Enter this code in your Navi Co. profile settings to change your password or confirm account deletion.</p>
   ```

   Save the template. Supabase sends the code to the email address on the signed-in account; the Gmail SMTP account is the sender. The app verifies it as a password-recovery OTP before changing a password or deleting an account.
8. In **Authentication > URL Configuration**, set:
   - **Site URL** to `http://localhost:5173` while developing locally.
   - Allowed redirect URLs of `http://localhost:5173/index.html` and `http://localhost:5173/profile.html`.
   - For production, the deployed site's origin as its Site URL and `https://YOUR_DOMAIN/index.html` plus `https://YOUR_DOMAIN/profile.html` as allowed redirect URLs.

   OAuth from the site returns to `/index.html`; email-change confirmation returns to `/profile.html`. Keep the exact local and production origins/paths in the allow list; do not use an unrestricted wildcard in production.
   If you open the dev server using `127.0.0.1` or a different port, add the matching redirect URLs for that exact origin too.

Test by changing a password on `/profile.html` and confirming the code arrives at the account's email inbox. Check Spam and the Supabase Auth logs if it does not arrive. Google can throttle or block SMTP use, and personal Gmail is not designed for bulk community mail; for production-scale delivery, use a transactional SMTP provider. Supabase also applies Auth email rate limits, which can be reviewed under **Authentication > Rate Limits**.

## 3. Add Google, GitHub, and Discord sign-in

Repeat these steps for each provider you want to offer. You can enable only the providers for which you have credentials.

1. Create an OAuth application in the provider's developer console.
2. In Supabase, open **Authentication > Providers**, choose the provider, enable it, and copy the **Callback URL** shown there. It normally looks like:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. In the provider console, register that exact Supabase callback URL as the OAuth redirect/callback URI. For Google, also configure any required consent-screen details and authorized origin(s). For GitHub and Discord, set the callback URL in the OAuth application's settings.
4. Copy the provider's client ID and client secret into that provider's Supabase settings, then save.
5. Try signing in from `login.html` or `signup.html`. Provider credentials remain in Supabase; do not place client secrets in this repository.

Provider dashboards change over time. If their labels differ, follow the provider-specific guide linked from [Supabase social sign-in documentation](https://supabase.com/docs/guides/auth/social-sign-in).

## 4. Enable live discussion updates

The Connect page shows the conversation and composer only to signed-in members. It reads `public.discussion_messages` and subscribes to new rows through Supabase Realtime.

1. In the Supabase dashboard, open the Realtime settings/publications for the database.
2. Enable the `discussion_messages` table in the `supabase_realtime` publication (the dashboard may expose this as a table toggle).
3. Sign in to the site, open **Connect**, and send a test message. Keep two signed-in browser sessions open to confirm new messages appear in both.

The schema's RLS rules only allow signed-in members to read and insert discussion messages.

On Connect, signed-in users can open `/profile.html` to view their username, email, membership date, and sign-in method. The profile page supports username and email changes, password changes via recovery OTP, and account deletion via email OTP. Supabase requires email verification before a changed address takes effect.

Account deletion is permanent. It removes the auth account, profile, and discussion messages through the schema's cascade rules. Freedom Wall posts and promotion requests are not linked to a user ID, so they cannot be reliably associated with an account for removal and may remain. Admin accounts must be transferred and managed through Supabase rather than self-deleted.

## 5. Create the first admin

1. Sign up through the website with the account you want to make the administrator. Confirm its email first if email confirmation is on.
2. In the Supabase **SQL Editor**, run the following after replacing the email with the exact admin account email:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';

   select email, raw_app_meta_data ->> 'role' as role
   from auth.users
   where email = 'admin@example.com';
   ```

3. Confirm the query returns that account with role `admin`. If it returns no row, verify the email and account before proceeding.
4. Sign out of the website and sign back in. The role is carried in the auth token, so an existing session may not recognize the change until it refreshes.
5. Open `/admin.html` and confirm the admin dashboard loads.

Only trusted server-side tooling or the Supabase SQL Editor should assign `app_metadata.role`. Never use user-editable `user_metadata` for admin authorization, and do not expose a service-role key in the browser.

## 6. Deploy the Supabase Edge Functions

The functions are `publish-freedom-post`, `manage-freedom-wall`, `manage-community-member`, and `delete-own-account`. The moderation functions require a signed-in admin. The account-deletion function only deletes the authenticated caller, verifies the email recovery code server-side, and rejects admin accounts.

1. Install the Supabase CLI. On Windows with Scoop:

   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   Confirm it is available with `supabase --version`.
2. From the project folder, initialize the local CLI configuration if `supabase/config.toml` does not exist:

   ```sh
   supabase init
   ```

   This adds local CLI configuration alongside the existing schema and functions.
3. Sign in and link the folder to the project. Get the project reference from the Supabase dashboard URL or project settings:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Deploy the four functions:

   ```sh
   supabase functions deploy publish-freedom-post
   supabase functions deploy manage-freedom-wall
   supabase functions deploy manage-community-member
   supabase functions deploy delete-own-account
   ```

   You can also deploy all functions with `supabase functions deploy`.

Supabase provides the functions with its project URL and server keys. Do not manually add or expose `SUPABASE_SERVICE_ROLE_KEY` in the website or source code. For more details, see [Supabase Edge Function deployment](https://supabase.com/docs/guides/functions/deploy).

## 7. Configure Facebook Page publishing

This integration publishes an approved Freedom Wall post to a Facebook Page. It is optional; the rest of the site can be tested without Meta credentials.

1. Confirm you have permission to publish to the intended Facebook Page.
2. Create/configure a Meta developer app and obtain a **Page access token** with the permissions required to publish Page feed posts. Follow Meta's current review and business verification requirements for your app and Page.
3. In Supabase, open **Edge Functions > Secrets** and add:
   - `META_PAGE_ID` — the target Facebook Page ID.
   - `META_PAGE_ACCESS_TOKEN` — the server-side Page access token.
   - `META_GRAPH_API_VERSION` — a currently supported version in the format `vNN.N`.
4. Do not add these values to `.env`, frontend code, GitHub, or a chat message. Supabase Edge Function secrets are server-side. See [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets).
5. Sign in as an admin, submit a test Freedom Wall message, approve it in the admin panel, then use the Facebook publish action. Verify the post on the intended Page and check its publication status in the admin panel.

The function only publishes approved posts. If Facebook accepted a post but the database could not save the result, check the Page before retrying so you do not create a duplicate.

## 8. End-to-end test checklist

- [ ] Home and the separate About, Freedom Wall, Connect, and Contact pages load.
- [ ] Email signup/sign-in works, including the configured email-confirmation behavior.
- [ ] Each enabled Google, GitHub, and Discord OAuth button returns to `/index.html`.
- [ ] A non-admin cannot open or use admin-only controls.
- [ ] The admin can manage promotions and announcements, review promotion requests, and manage members.
- [ ] An anonymous Freedom Wall submission is pending, then visible publicly only after approval.
- [ ] Discussion messages require sign-in and appear live in another signed-in session.
- [ ] Profile username updates and email-change verification work.
- [ ] Test password recovery and account deletion only with a disposable non-admin account.
- [ ] If Facebook secrets are configured, an approved test post is published to the correct Page and status is recorded.

The Freedom Wall table deliberately has no submitter user ID or IP column, but hosting/platform logs may retain operational data. Review logging and retention settings and add suitable rate limiting/abuse controls before promoting the public form.

## 9. Future APIs and production readiness

Points, games/events, rewards, GCash conversion, trading, and the e-goods shop (MLBB Diamonds, CODM Points, Robux, and Discord Boost) are not connected in V1. Their integrations cannot be configured until the provider, API documentation, credentials, test environment, and transaction rules are selected. Keep payment/trading secrets on a trusted server or Edge Function, never in browser variables. Review fraud prevention, refunds, legal requirements, and account-security controls before handling money or redeemable value.

Before launch, also configure the production domain and OAuth redirects, verify email delivery, review privacy/terms and moderation procedures, and set up database backups and monitoring.
