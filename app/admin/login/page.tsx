import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, hasValidAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (session && hasValidAdminSession(session)) redirect("/admin");

  return (
    <main className="admin-login-shell">
      <a className="brand admin-brand" href="/"><span className="brand-mark">g.</span><span>gather<span className="brand-dot">.</span></span></a>
      <section className="login-card">
        <div className="admin-icon">✳</div>
        <div className="eyebrow">GATHER / ADMIN</div>
        <h1>Good to see you.</h1>
        <p>Sign in to take care of your corner of the internet.</p>
        <LoginForm />
        <a className="back-link" href="/">← Back to the community</a>
      </section>
      <span className="login-caption">A little care goes a long way.</span>
    </main>
  );
}
