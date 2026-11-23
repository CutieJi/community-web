import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

async function api(path, options = {}) {
    const headers = {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
    };
    const response = await fetch(`/api/${path}`, {
        ...options,
        headers,
        credentials: 'same-origin',
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const firstValidationError = Object.values(data.errors ?? {}).flat()[0];
        throw new Error(firstValidationError ?? data.message ?? 'Something went wrong.');
    }

    return data;
}

function usePageData(path, enabled = true) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!enabled) return undefined;
        let active = true;
        api(path).then((result) => {
            if (active) {
                setData(result);
                setError('');
            }
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        });
        return () => { active = false; };
    }, [path, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);
    return { data, error, reload };
}

function Feedback({ children, error = false }) {
    if (!children) return null;
    return <div className={`form-message is-visible${error ? ' is-error' : ''}`} role="status">{children}</div>;
}

function SiteHeader({ user }) {
    const [menuOpen, setMenuOpen] = useState(false);

    async function logout() {
        try {
            await api('logout', { method: 'POST' });
            window.location.assign('/');
        } catch (error) {
            window.alert(error.message);
        }
    }

    return <>
        <div className="announcement"><span className="live-dot" /> A new corner of the internet is taking shape <a href="/about">Meet Navi Co. <span aria-hidden="true">↗</span></a></div>
        <header className="site-header">
            <a className="brand" href="/" aria-label="Navi Co. home"><span className="brand-mark">n</span><span>navi<span className="brand-light">co.</span></span></a>
            <button className="menu-toggle" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
            <nav className={`main-nav${menuOpen ? ' menu-open' : ''}`} aria-label="Main navigation">
                <a href="/">Home</a><a href="/about">About</a><a href="/freedomwall">Freedom wall</a><a href="/connect">Connect</a><a href="/contact">Contact</a>
            </nav>
            <div className="header-actions">
                {user
                    ? <><a className="button button-outline" href="/profile">My account</a><button className="button button-accent" onClick={logout}>Log out</button></>
                    : <><a className="button button-outline" href="/login">Log in</a><a className="button button-accent" href="/signup">Sign up <span>↗</span></a></>}
            </div>
        </header>
    </>;
}

function SiteFooter() {
    return <footer className="site-footer">
        <div className="footer-top"><a className="brand" href="/"><span className="brand-mark">n</span><span>navi<span className="brand-light">co.</span></span></a><p>A little corner of the internet<br />to be a little more you.</p><a className="back-top" href="/">BACK TO HOME ↑</a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} NAVI CO. MADE WITH COMMUNITY IN MIND.</span><span>BE KIND OUT THERE <b>✳</b></span></div>
    </footer>;
}

function HomePage() {
    const { data, error } = usePageData('home');
    const promotions = data?.promotions ?? [];
    return <>
        <section className="hero section-wrap">
            <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-line" /> YOUR PEOPLE. YOUR PLACE.</div>
                <h1>Find your<br />people<span className="accent-period">.</span><br /><span className="outline-text">Make your</span><br />mark<span className="accent-period">.</span></h1>
                <p className="hero-description">A community built for the things you love. Share what you're making, say what's on your mind, and find your people along the way.</p>
                <div className="hero-actions"><a className="button button-accent button-large" href="/signup">Come on in <span>↗</span></a><a className="text-link" href="/about">Get to know us <span>↗</span></a></div>
                <div className="community-proof"><div className="avatar-stack"><span className="avatar avatar-one">J</span><span className="avatar avatar-two">M</span><span className="avatar avatar-three">K</span><span className="avatar avatar-four">A</span></div><p><strong>A growing crew</strong><br />and there's room for you.</p></div>
            </div>
            <div className="hero-art" aria-label="Illustration of community conversations">
                <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
                <div className="hero-sticker sticker-top">GOOD THINGS<br />HAPPEN HERE <span>✳</span></div>
                <div className="art-center"><span className="sun-rays">✳</span><span className="art-word">NAVI<br /><b>CO.</b></span><span className="art-caption">a place to be you</span></div>
                <div className="chat-bubble bubble-one"><span className="bubble-avatar">m</span><span>just launched my shop!!</span><b>✦</b></div>
                <div className="chat-bubble bubble-two"><span>you've got this ☻</span><b className="bubble-heart">♥</b></div>
                <div className="hero-sticker sticker-bottom"><span>✿</span> SAY IT<br />ANONYMOUSLY</div>
            </div>
        </section>
        <section className="ticker" aria-label="Community values"><div className="ticker-track"><span>GOOD VIBES ONLY</span><i>✳</i><span>YOUR SPACE, YOUR RULES</span><i>✳</i><span>MADE FOR THE COMMUNITY</span><i>✳</i><span>GOOD VIBES ONLY</span></div></section>
        <section className="section-wrap intro-section">
            <div className="section-label"><span>YOUR SPACE, YOUR PEOPLE</span><a className="text-link" href="/about">Get to know us <span>↗</span></a></div>
            <div className="intro-grid"><h2>More than a<br />website. <span>A whole<br />little world.</span></h2><div className="intro-copy"><p>A home base for gamers, creators, dreamers, and everyone in between. Find a place to share, connect, and be a little more you.</p><a className="text-link" href="/about">More about Navi Co. <span>↗</span></a></div></div>
            <div className="feature-grid">
                <article className="feature-card feature-yellow"><div className="feature-icon">✳</div><span className="card-index">01 — SHARE</span><h3>Say it<br />your way.</h3><p>Big feelings? Hot takes? A tiny win? Drop it on the Freedom Wall, no name needed.</p><a href="/freedomwall" aria-label="Explore the Freedom Wall">↗</a></article>
                <article className="feature-card feature-lilac"><div className="feature-icon">↗</div><span className="card-index">02 — CONNECT</span><h3>Your kind<br />of people.</h3><p>Meet other gamers, creators, and community folks who just get it.</p><a href="/connect" aria-label="Join the discussion">↗</a></article>
                <article className="feature-card feature-peach"><div className="feature-icon">♡</div><span className="card-index">03 — DISCOVER</span><h3>Small biz,<br />big love.</h3><p>Find community-made brands, cool finds, and creators worth following.</p><a href="/contact" aria-label="Explore community picks">↗</a></article>
            </div>
        </section>
        <section className="section-wrap promotions-section">
            <div className="section-label"><span>COMMUNITY PICKS</span><a className="text-link" href="/contact">Promote your brand <span>↗</span></a></div>
            <div className="promo-heading"><h2>Made by the community.<br /><span>Loved by the community.</span></h2><p>Discover cool finds, local brands, and creators doing their thing.</p></div>
            {error && <Feedback error>{error}</Feedback>}
            <div className="promo-grid">
                {promotions.length ? promotions.map((item, index) => <article className="promo-card" key={item.id}>
                    <div className={`promo-visual ${['visual-studio', 'visual-creator', 'visual-community'][index % 3]}`}><span>{item.category || 'COMMUNITY PICK'}</span><i>{['✳', '↗', '♡'][index % 3]}</i></div>
                    <div className="promo-info"><div><span className="promo-type">{item.category}</span><h3>{item.title}</h3><p className="promo-description">{item.description}</p></div>{item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${item.title}`}>↗</a>}</div>
                </article>) : <article className="promo-card promo-card-dark"><div className="promo-visual visual-studio"><span>GOOD<br />STUFF</span><i>✳</i></div><div className="promo-info"><div><span className="promo-type">COMMUNITY BRAND</span><h3>Your next favorite thing.</h3></div></div></article>}
            </div>
        </section>
        <section className="section-wrap home-cta"><div><span className="card-index">COME AS YOU ARE</span><h2>Your corner of the internet is waiting.</h2></div><a className="button button-dark button-large" href="/signup">Join Navi Co. <span>↗</span></a></section>
    </>;
}

function AboutPage() {
    return <section className="page-hero section-wrap"><div className="eyebrow"><span className="eyebrow-line" /> A SMALL PLACE WITH BIG IDEAS</div><h1>About <span>Navi Co.</span></h1><p>A community base for gamers, creators, dreamers, and everyone in between. Share, connect, discover local creators, and say what's on your mind in a kinder corner of the internet.</p></section>;
}

function FreedomWallPage() {
    const { data, error, reload } = usePageData('freedom-wall');
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setFeedback('');
        try {
            const result = await api('freedom-wall', { method: 'POST', body: { message } });
            setFeedback(result.message);
            setMessage('');
            reload();
        } catch (requestError) {
            setFeedback(requestError.message);
        } finally {
            setBusy(false);
        }
    }

    return <><section className="page-hero section-wrap"><div className="eyebrow"><span className="eyebrow-line" /> NO NAME. NO PRESSURE.</div><h1>Say what's <span>on your mind.</span></h1><p>Leave a note for the community. Messages are anonymous and appear after review.</p></section>
        <section className="section-wrap"><form className="wall-form" onSubmit={submit}><label htmlFor="wall-message">Your message</label><textarea id="wall-message" maxLength="500" placeholder="Type it out. No name, no pressure..." value={message} onChange={(event) => setMessage(event.target.value)} required /><div className="form-footer"><span>{message.length} / 500</span><button className="button button-dark" disabled={busy}>Send anonymously <span>↗</span></button></div></form><Feedback error={feedback && !feedback.startsWith('Your anonymous')}>{feedback}</Feedback><Feedback error>{error}</Feedback>
            <div className="wall-posts"><div className="wall-posts-head"><span>THE WALL</span><span className="wall-status"><i /> COMMUNITY NOTES</span></div><div id="wall-list">
                {data?.posts?.length ? data.posts.map((post) => <article className="wall-note" key={post.id}><span className="note-mark">“</span><p>{post.message}</p><span className="note-tag">FROM THE COMMUNITY</span></article>) : <div className="empty-note">Nothing on the wall just yet. Be the first to say something.</div>}
            </div></div>
        </section>
    </>;
}

function ContactPage() {
    const [feedback, setFeedback] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setFeedback('');
        const element = event.currentTarget;
        const form = new FormData(element);
        try {
            const result = await api('promotion-requests', {
                method: 'POST',
                body: Object.fromEntries(form.entries()),
            });
            setFeedback(result.message);
            element.reset();
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setBusy(false);
        }
    }

    return <><section className="page-hero section-wrap"><div className="eyebrow"><span className="eyebrow-line" /> COMMUNITY SPOTLIGHT</div><h1>Put your <span>brand in the room.</span></h1><p>Tell us about your brand, shop, or creative work.</p></section>
        <section className="section-wrap"><form className="react-form" onSubmit={submit}>
            <label>Brand or creator name<input name="brand" maxLength="120" required /></label>
            <label>A short intro<textarea name="description" maxLength="500" required /></label>
            <label>Website or social link<input name="url" type="url" placeholder="https://" required /></label>
            <label>Contact email<input name="email" type="email" required /></label>
            <button className="button button-accent" disabled={busy}>Submit request <span>↗</span></button>
        </form><Feedback error={!feedback.includes('submitted')}>{feedback}</Feedback></section>
    </>;
}

function AuthPage({ mode, onAuthenticated }) {
    const signingUp = mode === 'signup';
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError('');
        setBusy(true);
        const values = Object.fromEntries(new FormData(event.currentTarget).entries());
        try {
            const result = await api(signingUp ? 'register' : 'login', { method: 'POST', body: values });
            onAuthenticated(result.user);
            window.location.assign('/');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusy(false);
        }
    }

    return <section className="auth-page-main"><div className="auth-card">
        <div className="auth-brand"><span className="brand-mark">n</span></div>
        <div className="eyebrow"><span className="eyebrow-line" /> YOU'RE IN THE RIGHT PLACE</div>
        <h1>{signingUp ? 'Create your account.' : 'Come on in.'}</h1><p className="auth-intro">{signingUp ? 'Your people are here.' : 'Sign in to find your people.'}</p>
        <Feedback error>{error}</Feedback>
        <form onSubmit={submit}>
            {signingUp && <label htmlFor="auth-username">Username<input id="auth-username" name="username" minLength="2" maxLength="32" autoComplete="username" required /></label>}
            <label htmlFor="auth-email">Email address<input id="auth-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
            <label htmlFor="auth-password">Password<input id="auth-password" name="password" type="password" minLength="8" autoComplete={signingUp ? 'new-password' : 'current-password'} required /></label>
            {signingUp && <label htmlFor="auth-password-confirmation">Confirm password<input id="auth-password-confirmation" name="password_confirmation" type="password" minLength="8" autoComplete="new-password" required /></label>}
            <button className="button button-accent auth-submit" disabled={busy}>{signingUp ? 'Create account' : 'Log in'} <span>↗</span></button>
        </form>
        <p className="auth-switch">{signingUp ? 'Already a member?' : 'New around here?'} <a href={signingUp ? '/login' : '/signup'}>{signingUp ? 'Log in' : 'Create an account'}</a></p>
    </div></section>;
}

function ConnectPage({ user }) {
    const { data, error, reload } = usePageData('connect', Boolean(user));
    const [body, setBody] = useState('');
    const [feedback, setFeedback] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!user) return undefined;
        const timer = window.setInterval(reload, 8000);
        return () => window.clearInterval(timer);
    }, [user, reload]);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setFeedback('');
        try {
            await api('connect/messages', { method: 'POST', body: { body } });
            setBody('');
            reload();
        } catch (requestError) {
            setFeedback(requestError.message);
        } finally {
            setBusy(false);
        }
    }

    return <><section className="page-hero section-wrap"><div className="eyebrow"><span className="eyebrow-line" /> YOUR PEOPLE ARE HERE</div><h1>Community <span>conversation.</span></h1></section><section className="section-wrap">
        {user ? <><div className="account-panel"><div className="account-panel-heading"><div><span className="card-index">YOUR ACCOUNT</span><h3>Good to see you, {user.username}.</h3></div></div><p className="account-email">Signed in as <strong>{user.email}</strong></p><a className="button button-outline button-small" href="/profile">Manage account</a></div>
            <div className="chat-panel"><div className="chat-title"><strong>Community chat</strong></div><div className="chat-messages">{(data?.messages ?? []).map((message) => <div className={`chat-row${message.user_id === user.id ? ' own-message' : ''}`} key={message.id}><strong>{message.user?.username ?? 'Community member'}</strong><p>{message.body}</p></div>)}</div><form className="chat-compose" onSubmit={submit}><input maxLength="1000" placeholder="Say something kind..." value={body} onChange={(event) => setBody(event.target.value)} required /><button className="button button-accent" disabled={busy} aria-label="Send message">↗</button></form></div><Feedback error>{feedback || error}</Feedback>
        </> : <div className="chat-auth-prompt"><p>Sign in or create an account to see the conversation and send messages.</p><div className="chat-auth-actions"><a className="button button-outline" href="/login">Log in</a><a className="button button-accent" href="/signup">Create an account <span>↗</span></a></div></div>}
        {data?.announcements?.length > 0 && <div className="announcement-list">{data.announcements.map((item) => <article className="announcement-card" key={item.id}><span className="card-index">{new Date(item.created_at).toLocaleDateString()}</span><h3>{item.title}</h3><p>{item.description}</p>{item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">Read more ↗</a>}</article>)}</div>}
    </section></>;
}

function ProfilePage({ user, onAuthenticated }) {
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    async function submit(event, path, method, successMessage) {
        event.preventDefault();
        setNotice('');
        setError('');
        const form = event.currentTarget;
        try {
            const result = await api(path, { method, body: Object.fromEntries(new FormData(form).entries()) });
            if (result.user) onAuthenticated(result.user);
            setNotice(result.message ?? successMessage);
            form.reset();
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function deleteAccount(event) {
        event.preventDefault();
        if (!window.confirm('Delete your account? This cannot be undone.')) return;
        try {
            await api('profile', { method: 'DELETE', body: Object.fromEntries(new FormData(event.currentTarget).entries()) });
            window.location.assign('/');
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    return <section className="profile-page-section profile-page section-wrap"><div className="profile-card">
        <div className="profile-card-heading"><div><span className="card-index">ACCOUNT OVERVIEW</span><h1>{user?.username ?? 'Your account'}</h1></div></div>
        <dl className="profile-details"><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Member since</dt><dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</dd></div><div><dt>Sign-in method</dt><dd>Email and password</dd></div></dl>
        <Feedback>{notice}</Feedback><Feedback error>{error}</Feedback>
        <form className="profile-form" onSubmit={(event) => submit(event, 'profile/username', 'PATCH', 'Username updated.')}>
            <label>Username<input name="username" minLength="2" maxLength="32" defaultValue={user?.username} required /></label><button className="button button-accent">Update username</button>
        </form>
        <form className="profile-form" onSubmit={(event) => submit(event, 'profile/password', 'PATCH', 'Password updated.')}>
            <label>Current password<input name="current_password" type="password" autoComplete="current-password" required /></label>
            <label>New password<input name="password" type="password" minLength="8" autoComplete="new-password" required /></label>
            <label>Confirm new password<input name="password_confirmation" type="password" minLength="8" autoComplete="new-password" required /></label>
            <button className="button button-dark">Change password</button>
        </form>
        {user?.role !== 'admin' && <section className="profile-card profile-danger"><h2>Delete account</h2><p>This permanently removes your account and discussion messages.</p><form className="profile-form" onSubmit={deleteAccount}><label>Confirm with password<input name="password" type="password" required /></label><button className="button button-danger">Delete my account</button></form></section>}
    </div></section>;
}

function AdminPage() {
    const { data, error, reload } = usePageData('admin');
    const [tab, setTab] = useState('freedomPosts');
    const [notice, setNotice] = useState('');
    const [actionError, setActionError] = useState('');
    const [editing, setEditing] = useState(null);

    async function act(path, method, body = undefined) {
        setNotice('');
        setActionError('');
        try {
            const result = await api(path, { method, body });
            setNotice(result.message ?? 'Saved.');
            setEditing(null);
            reload();
        } catch (requestError) {
            setActionError(requestError.message);
        }
    }

    async function saveContent(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const values = Object.fromEntries(new FormData(element).entries());
        values.published = element.elements.published.checked;
        const path = editing
            ? `admin/content/${editing.kind}/${editing.id}`
            : 'admin/content';
        await act(path, editing ? 'PATCH' : 'POST', values);
        element.reset();
    }

    if (error) return <section className="admin-main"><Feedback error>{error}</Feedback></section>;
    const sections = [
        ['freedomPosts', 'Freedom wall'],
        ['requests', 'Promo requests'],
        ['promotions', 'Promotions'],
        ['announcements', 'Announcements'],
        ['users', 'Members'],
    ];

    return <section className="admin-main">
        <div className="admin-welcome"><div><div className="eyebrow"><span className="eyebrow-line" /> THE BACK OFFICE</div><h1>Hey, admin<span className="accent-period">.</span></h1><p>Keep this little corner of the internet feeling like home.</p></div><span className="admin-pill"><i /> ADMIN SESSION</span></div>
        <div className="admin-tabs" role="tablist">{sections.map(([key, title]) => <button key={key} className={`admin-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{title}{key === 'freedomPosts' && data && <span>{data.freedomPosts.filter((post) => post.status === 'pending').length}</span>}{key === 'requests' && data && <span>{data.requests.filter((request) => request.status === 'pending').length}</span>}</button>)}</div>
        <Feedback>{notice}</Feedback><Feedback error>{actionError}</Feedback>
        {tab === 'freedomPosts' && <section className="admin-panel"><div className="panel-heading"><div><span className="card-index">COMMUNITY SUBMISSIONS</span><h2>Freedom wall</h2></div><span className="privacy-note">Submissions do not store submitter account or IP.</span></div><div className="admin-list">
            {(data?.freedomPosts ?? []).map((post) => <article className="admin-row" key={post.id}><div className="admin-row-copy"><span className="admin-meta">{new Date(post.created_at).toLocaleString()} · {post.status.toUpperCase()}</span><p>{post.message}</p>{post.status === 'approved' && <p className="admin-meta">FACEBOOK: {(post.facebook_publish_status ?? 'pending').toUpperCase()}</p>}</div><div className="row-actions">{post.status === 'pending' && <><button className="button button-small button-accent" onClick={() => act(`admin/freedom-wall/${post.id}/status`, 'PATCH', { status: 'approved' })}>Approve</button><button className="button button-small button-outline" onClick={() => act(`admin/freedom-wall/${post.id}/status`, 'PATCH', { status: 'rejected' })}>Reject</button></>}<button className="button button-small button-outline" onClick={() => act(`admin/freedom-wall/${post.id}`, 'DELETE')}>Delete</button></div></article>)}
        </div></section>}
        {tab === 'requests' && <section className="admin-panel"><div className="panel-heading"><div><span className="card-index">COMMUNITY SPOTLIGHTS</span><h2>Promotion requests</h2></div></div><div className="admin-list">
            {(data?.requests ?? []).map((request) => <article className="admin-row" key={request.id}><div className="admin-row-copy"><span className="admin-meta">{request.status.toUpperCase()} · {new Date(request.created_at).toLocaleString()}</span><h3>{request.brand}</h3><p>{request.description}</p><p><a href={request.url} target="_blank" rel="noopener noreferrer">{request.url}</a> · {request.contact_email}</p></div><div className="row-actions">{request.status === 'pending' && <><button className="button button-small button-accent" onClick={() => act(`admin/promotion-requests/${request.id}/approve`, 'POST')}>Approve & publish</button><button className="button button-small button-outline" onClick={() => act(`admin/promotion-requests/${request.id}`, 'PATCH', { status: 'rejected' })}>Reject</button></>}<button className="button button-small button-outline" onClick={() => act(`admin/promotion-requests/${request.id}`, 'DELETE')}>Delete</button></div></article>)}
        </div></section>}
        {(tab === 'promotions' || tab === 'announcements') && <section className="admin-panel"><div className="panel-heading"><div><span className="card-index">{tab === 'promotions' ? 'COMMUNITY SPOTLIGHTS' : "WHAT'S NEW"}</span><h2>{tab === 'promotions' ? 'Promotions' : 'Announcements'}</h2></div><button className="button button-accent" onClick={() => setEditing({ kind: tab === 'promotions' ? 'promotions' : 'news' })}>Add {tab === 'promotions' ? 'promotion' : 'announcement'} +</button></div>
            {(data?.[tab] ?? []).map((item) => <article className="admin-row" key={item.id}><div className="admin-row-copy"><span className="admin-meta">{item.published ? 'PUBLISHED' : 'HIDDEN'} · {new Date(item.created_at).toLocaleDateString()}</span><h3>{item.title}</h3><p>{item.description}</p></div><div className="row-actions"><button className="button button-small button-outline" onClick={() => setEditing({ ...item, kind: tab === 'promotions' ? 'promotions' : 'news' })}>Edit</button><button className="button button-small button-outline" onClick={() => act(`admin/content/${tab === 'promotions' ? 'promotions' : 'news'}/${item.id}`, 'DELETE')}>Delete</button></div></article>)}
            {editing && <form className="admin-content-form" onSubmit={saveContent}><h3>{editing.id ? 'Edit' : 'New'} {editing.kind === 'news' ? 'announcement' : 'promotion'}</h3><label>Title<input name="title" maxLength="120" defaultValue={editing.title ?? ''} required /></label><label>Description<textarea name="description" maxLength="500" defaultValue={editing.description ?? ''} required /></label><label>Link (optional)<input name="url" type="url" defaultValue={editing.url ?? ''} /></label><label className="checkbox-label"><input type="checkbox" name="published" defaultChecked={editing.published ?? true} /> Visible to the community</label><button className="button button-accent">Save changes</button><button className="button button-outline" type="button" onClick={() => setEditing(null)}>Cancel</button></form>}
        </section>}
        {tab === 'users' && <section className="admin-panel"><div className="panel-heading"><div><span className="card-index">COMMUNITY MEMBERS</span><h2>Members</h2></div></div><div className="admin-list">
            {(data?.users ?? []).map((member) => <article className="admin-row" key={member.id}><div className="admin-row-copy"><span className="admin-meta">MEMBER SINCE {new Date(member.created_at).toLocaleDateString()}{member.role === 'admin' ? ' · ADMIN' : ''}</span><h3>{member.username || 'Community member'}</h3><p>{member.email}{member.suspended ? ' · SUSPENDED' : ''}</p></div>{member.role !== 'admin' && <button className="button button-small button-outline" onClick={() => act(`admin/users/${member.id}`, 'PATCH', { suspended: !member.suspended })}>{member.suspended ? 'Restore access' : 'Suspend access'}</button>}</article>)}
        </div></section>}
    </section>;
}

function App() {
    const { data, error } = usePageData('session');
    const [user, setUser] = useState(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    useEffect(() => {
        if (data) {
            setUser(data.user);
            setSessionLoaded(true);
        } else if (error) {
            setSessionLoaded(true);
        }
    }, [data, error]);

    const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    let page;
    if (path === '/about') page = <AboutPage />;
    else if (path === '/freedomwall') page = <FreedomWallPage />;
    else if (path === '/contact') page = <ContactPage />;
    else if (path === '/login' || path === '/signup') page = <AuthPage mode={path.slice(1)} onAuthenticated={setUser} />;
    else if (path === '/connect') page = <ConnectPage user={user} />;
    else if (path === '/profile') page = sessionLoaded && user ? <ProfilePage user={user} onAuthenticated={setUser} /> : <AuthPrompt loading={!sessionLoaded} />;
    else if (path === '/admin') page = user?.role === 'admin' ? <AdminPage /> : <AuthPrompt loading={!sessionLoaded} admin />;
    else page = <HomePage />;

    return <><SiteHeader user={user} /><main>{page}</main><SiteFooter /></>;
}

function AuthPrompt({ loading, admin = false }) {
    return <section className="section-wrap page-hero"><h1>{loading ? 'Loading your account…' : admin ? 'Admin access required.' : 'Sign in to view your account.'}</h1>{!loading && <a className="button button-accent" href="/login">Log in</a>}</section>;
}

createRoot(document.getElementById('root')).render(<App />);
