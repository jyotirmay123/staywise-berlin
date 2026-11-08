import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

const deployedSites = [
  {
    title: "PDF Manager",
    description:
      "Private browser tools to merge, split, compress, convert, edit, sign, and summarize PDFs.",
    url: "https://private-pdf-manager.senapati-jyotirmay.chatgpt.site",
    category: "Productivity",
    version: 2,
    accent: "blue",
    monogram: "PDF",
  },
  {
    title: "Aster Portfolio",
    description:
      "Offline-first EUR and INR investment portfolio tracker with historical FX and projections.",
    url: "https://aster-portfolio-ledger.senapati-jyotirmay.chatgpt.site",
    category: "Finance",
    version: 6,
    accent: "violet",
    monogram: "AS",
  },
];

export default async function Home() {
  const user =
    process.env.NODE_ENV === "development"
      ? ((await getChatGPTUser()) ?? {
          displayName: "Local preview",
          email: "preview@local",
          fullName: "Local preview",
        })
      : await requireChatGPTUser("/");

  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="identity" href="#">
          <span className="identity-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Jyotirmay</strong>
            <small>Sites</small>
          </span>
        </a>
        <div className="account">
          <span className="avatar">{initials(user.displayName)}</span>
          <span>
            <strong>{user.displayName}</strong>
            <small>Signed in with ChatGPT</small>
          </span>
          <a href="/signout-with-chatgpt?return_to=/">Sign out</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PERSONAL APP DIRECTORY</span>
          <h1>Everything I&apos;ve built,<br />in one place.</h1>
          <p>
            A private collection of focused tools for documents, finance, and
            everyday work.
          </p>
        </div>
        <div className="hero-stats">
          <span><strong>{deployedSites.length}</strong> live sites</span>
          <span><strong>100%</strong> ChatGPT protected</span>
        </div>
      </section>

      <section className="directory">
        <div className="section-head">
          <div>
            <span className="eyebrow">LIVE NOW</span>
            <h2>Deployed sites</h2>
          </div>
          <span className="updated">Current directory</span>
        </div>

        <div className="site-grid">
          {deployedSites.map((site, index) => (
            <a
              className={`site-card ${site.accent}`}
              href={site.url}
              key={site.url}
            >
              <div className="card-top">
                <span className="site-number">0{index + 1}</span>
                <span className="live-badge"><i /> Live</span>
              </div>
              <div className="site-symbol" aria-hidden="true">
                {site.monogram}
              </div>
              <div className="card-copy">
                <span>{site.category}</span>
                <h3>{site.title}</h3>
                <p>{site.description}</p>
              </div>
              <div className="card-foot">
                <span>Version {site.version}</span>
                <strong>Open site <i aria-hidden="true">→</i></strong>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer>
        <span>Private workspace</span>
        <span className="footer-dot" />
        <span>Access controlled by ChatGPT</span>
      </footer>
    </main>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "JS"
  );
}
