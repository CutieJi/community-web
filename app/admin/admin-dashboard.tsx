"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityContent } from "@/lib/community-content";

export function AdminDashboard({ initialContent, loadError }: { initialContent: CommunityContent | null; loadError: string }) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState(initialContent?.announcement ?? "");
  const [welcome, setWelcome] = useState(initialContent?.welcome ?? "");
  const [message, setMessage] = useState(loadError);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement, welcome }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your changes.");
      setMessage("Changes saved. Your community is looking good!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a className="brand admin-brand" href="/"><span className="brand-mark">g.</span><span>gather<span className="brand-dot">.</span></span></a>
        <div className="sidebar-label">WORKSPACE</div>
        <a className="sidebar-link active" href="#overview"><span>◫</span> Overview</a>
        <a className="sidebar-link" href="#community-settings"><span>✳</span> Community</a>
        <div className="sidebar-bottom">
          <div className="admin-profile"><span className="profile-avatar">g</span><span><strong>Community admin</strong><small>Workspace owner</small></span></div>
          <button className="sidebar-logout" onClick={logout} disabled={loggingOut}>{loggingOut ? "Signing out..." : "Sign out ↗"}</button>
        </div>
      </aside>
      <section className="dashboard-main" id="overview">
        <header className="dashboard-topbar"><span>Workspace <span aria-hidden="true">/</span> Overview</span><a href="/">View community ↗</a></header>
        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div><div className="eyebrow">YOUR COMMUNITY / TODAY</div><h1>Your corner, your way<span>.</span></h1><p>A little snapshot of what’s happening with your community.</p></div>
            <span className="workspace-badge"><i /> YOUR WORKSPACE</span>
          </div>
          <div className="stats-grid">
            <article className="stat-card stat-card-lilac"><span>YOUR COMMUNITY</span><strong>Looking lovely</strong><small>One good conversation at a time</small><span className="stat-spark">✳</span></article>
            <article className="stat-card"><span>DISCORD CONNECTION</span><strong><i /> Ready to invite</strong><small>Share your invite link to say hello</small><span className="stat-icon">↗</span></article>
            <article className="stat-card"><span>YOUR NEXT STEP</span><strong>Make it yours</strong><small>Update your welcome note below</small><span className="stat-icon">✎</span></article>
          </div>
          <section className="dashboard-editor" id="community-settings">
            <div className="editor-heading"><div><div className="eyebrow">THE COMMUNITY FEED</div><h2>A few words from you</h2><p>Keep the welcome warm and the good news easy to find.</p></div><span className="editor-spark">✦</span></div>
            <form onSubmit={save} className="content-form">
              <label htmlFor="welcome">Welcome note <span>Shown to your community</span></label>
              <textarea id="welcome" rows={3} maxLength={280} value={welcome} onChange={(event) => setWelcome(event.target.value)} placeholder="A warm hello to your community..." />
              <label htmlFor="announcement">Community announcement <span>Share something worth knowing</span></label>
              <textarea id="announcement" rows={3} maxLength={280} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="What’s happening in your community?" />
              {message && <p className={message.startsWith("Changes saved") ? "form-success" : "form-error"} role="status">{message}</p>}
              <div className="editor-actions"><span>Changes are saved to your Firebase Firestore database.</span><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Save changes"} <span aria-hidden="true">→</span></button></div>
            </form>
          </section>
          <p className="dashboard-footnote">Small communities make the internet feel big again. <span>♡</span></p>
        </div>
      </section>
    </main>
  );
}
