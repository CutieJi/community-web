import { DEFAULT_COMMUNITY_CONTENT, FirebaseConfigurationError, getCommunityContent } from "@/lib/community-content";

export const dynamic = "force-dynamic";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg";

const channels = [
  { icon: "✦", name: "the-lounge", note: "The place to land" },
  { icon: "◌", name: "make-and-share", note: "Show us what you're making" },
  { icon: "♫", name: "now-playing", note: "A little soundtrack" },
];

export default async function Home() {
  let content = DEFAULT_COMMUNITY_CONTENT;
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      content = await getCommunityContent();
    } catch (error) {
      if (!(error instanceof FirebaseConfigurationError)) throw error;
      console.error("Firebase credentials are invalid; showing default community content:", error.message);
    }
  }

  return (
    <main>
      <nav className="topbar wrap">
        <a className="brand" href="#" aria-label="Gather home">
          <span className="brand-mark">g.</span>
          <span>gather<span className="brand-dot">.</span></span>
        </a>
        <div className="nav-links">
          <a href="#about">Our corner</a>
          <a href="#channels">What’s inside</a>
        </div>
        <a className="button button-dark nav-cta" href={inviteUrl} target="_blank" rel="noreferrer">
          <DiscordMark /> Join the Discord <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <section className="hero wrap" id="about">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> YOUR INTERNET, BUT COZIER</div>
          <h1>Find your<br />people<span className="hero-period">.</span></h1>
          <p className="hero-text">{content.welcome}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={inviteUrl} target="_blank" rel="noreferrer">
              Come hang out <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#channels">Take a little look <span aria-hidden="true">↓</span></a>
          </div>
          <div className="social-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span className="avatar avatar-one">J</span>
              <span className="avatar avatar-two">M</span>
              <span className="avatar avatar-three">A</span>
              <span className="avatar avatar-four">K</span>
            </div>
            <p><strong>A good bunch of people.</strong><br />There’s room for you, too.</p>
          </div>
        </div>

        <div className="hero-art" aria-label="An illustrated cozy community chat">
          <div className="art-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="sparkle sparkle-one">✳</span>
          <span className="sparkle sparkle-two">✦</span>
          <span className="sparkle sparkle-three">✧</span>
          <div className="float-note note-top"><span className="note-emoji">☀️</span><span>good morning, internet</span></div>
          <div className="chat-card">
            <div className="chat-head">
              <span className="chat-glyph">#</span>
              <div><strong>the-lounge</strong><small>the usual suspects</small></div>
              <span className="online-count"><i /> 18 here</span>
            </div>
            <div className="chat-rule" />
            <div className="message">
              <span className="person person-peach">J</span>
              <p><strong>jules</strong><time>10:42</time><br />anyone else romanticizing their little coffee today ☕</p>
            </div>
            <div className="message">
              <span className="person person-lilac">M</span>
              <p><strong>mira</strong><time>10:43</time><br />always. it’s my main hobby actually</p>
            </div>
            <div className="message message-highlight">
              <span className="person person-mint">A</span>
              <p><strong>ari</strong><time>10:44</time><br />this is why i like it here ✨</p>
            </div>
            <div className="chat-compose"><span>Message #the-lounge</span><b>＋</b></div>
          </div>
          <div className="float-note note-bottom"><span className="music-disc">♫</span><span>currently playing<br /><strong>something soft</strong></span><i className="mini-bars"><b /><b /><b /><b /><b /></i></div>
          <div className="tiny-sticker">be<br />nice <span>♡</span></div>
        </div>
        <div className="hero-index"><span>01</span> &nbsp; / &nbsp; A PLACE TO BELONG</div>
      </section>

      <section className="ticker" aria-label="Community values">
        <div className="ticker-track">
          <span>GOOD CONVERSATIONS</span><i>✳</i><span>LOW-PRESSURE FRIENDSHIP</span><i>✳</i><span>MAKING THINGS</span><i>✳</i><span>GOOD CONVERSATIONS</span><i>✳</i><span>LOW-PRESSURE FRIENDSHIP</span>
        </div>
      </section>

      <section className="inside wrap" id="channels">
        {content.announcement && <div className="community-announcement"><span>✦</span><p><strong>A note from the community</strong><br />{content.announcement}</p></div>}
        <div className="section-intro">
          <div><div className="eyebrow">A LITTLE BIT OF EVERYTHING</div><h2>Make yourself<br />at home<span className="hero-period">.</span></h2></div>
          <p>No awkward icebreakers, no pressure to be “on.” Just good people and plenty of ways to join in—or quietly lurk until you’re ready.</p>
        </div>
        <div className="channel-grid">
          {channels.map((channel, index) => (
            <article className={`channel-card channel-card-${index + 1}`} key={channel.name}>
              <div className="channel-icon">{channel.icon}</div>
              <div><span className="channel-label"># {channel.name}</span><h3>{channel.note}</h3></div>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="invite-section">
        <div className="invite-orb invite-orb-one" /><div className="invite-orb invite-orb-two" />
        <div className="invite-content">
          <div className="eyebrow eyebrow-light"><span className="status-dot" /> THE DOOR’S OPEN</div>
          <h2>Your people<br />are in there<span>.</span></h2>
          <p>Drop in, say hi, or just see how it feels. We’ll save you a seat.</p>
          <a className="button button-light" href={inviteUrl} target="_blank" rel="noreferrer"><DiscordMark /> Join us on Discord <span aria-hidden="true">↗</span></a>
          <small>Free to join · Come as you are</small>
        </div>
        <div className="invite-doodle" aria-hidden="true">✷<span>♡</span>✳</div>
      </section>

      <footer className="footer wrap">
        <a className="brand" href="#"><span className="brand-mark">g.</span><span>gather<span className="brand-dot">.</span></span></a>
        <p>A softer spot on the internet.</p>
        <a className="footer-discord" href={inviteUrl} target="_blank" rel="noreferrer">Find us on Discord <span aria-hidden="true">↗</span></a>
        <span className="copyright">Made for good company · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}

function DiscordMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="discord-mark" fill="currentColor">
      <path d="M19.7 5.2a18.7 18.7 0 0 0-4.6-1.4l-.6 1.3a17.2 17.2 0 0 0-5 0l-.6-1.3a18.7 18.7 0 0 0-4.6 1.4C1.4 9.5.6 13.7 1 17.8a18.7 18.7 0 0 0 5.7 2.9l1.2-1.9-1.9-.9.5-.4c3.7 1.7 7.6 1.7 11.3 0l.5.4-1.9.9 1.2 1.9a18.7 18.7 0 0 0 5.7-2.9c.5-4.8-.8-8.9-3.6-12.6ZM8.7 14.8c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.6 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" />
    </svg>
  );
}
