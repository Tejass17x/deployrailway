import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

/* ----------------------------------------------------------------------
   Small inline icon set (no external icon library required).
   Swap these for lucide-react equivalents if that's already a dependency.
---------------------------------------------------------------------- */
const Icon = {
  Profile: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c1.6-3.6 4.4-5.4 7.5-5.4s5.9 1.8 7.5 5.4" strokeLinecap="round" />
    </svg>
  ),
  Collab: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="8" cy="9" r="2.6" /><circle cx="17" cy="15" r="2.6" />
      <path d="M9.8 10.6 15.2 13.4" strokeLinecap="round" />
    </svg>
  ),
  Discuss: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 5.5h16v10H9l-4 4v-4H4z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  Citation: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M6 17V9.5a3.5 3.5 0 0 1 3.5-3.5" strokeLinecap="round" />
      <path d="M15 17V9.5a3.5 3.5 0 0 1 3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  Grant: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3.5" y="6.5" width="17" height="12" rx="2" />
      <path d="M3.5 10.5h17" strokeLinecap="round" />
    </svg>
  ),
  Feed: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M5 4v16M5 4a11 11 0 0 1 11 11M5 10a5 5 0 0 1 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
      <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Rigor: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 3v3M12 18v3M4.2 7.8l2.1 1.8M17.7 14.4l2.1 1.8M4.2 16.2l2.1-1.8M17.7 9.6l2.1-1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  Openness: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z" /><path d="M4 12h16M12 4c2.2 2.3 3.3 5 3.3 8s-1.1 5.7-3.3 8c-2.2-2.3-3.3-5-3.3-8s1.1-5.7 3.3-8Z" />
    </svg>
  ),
  Integrity: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
    </svg>
  ),
  Collaboration: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="8.5" cy="8.5" r="3" /><circle cx="16" cy="14" r="3" />
      <path d="M10.5 10 13.5 12.5" strokeLinecap="round" />
    </svg>
  ),
  Access: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  ),
};

/* Reveal-on-scroll wrapper */
function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('rc-in-view');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`rc-reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* Hero network graphic — the page's signature element:
   researchers as nodes, collaboration as the connecting lines. */
function NetworkGraphic() {
  const nodes = [
    { x: 60, y: 60, r: 5, core: false },
    { x: 190, y: 40, r: 4, core: false },
    { x: 260, y: 120, r: 7, core: true },
    { x: 340, y: 60, r: 4.5, core: false },
    { x: 400, y: 150, r: 5, core: false },
    { x: 150, y: 180, r: 4, core: false },
    { x: 90, y: 250, r: 5.5, core: false },
    { x: 250, y: 260, r: 4, core: false },
    { x: 360, y: 260, r: 6, core: false },
    { x: 300, y: 190, r: 3.5, core: false },
  ];
  const edges = [
    [0, 2], [1, 2], [2, 3], [2, 4], [2, 5], [5, 6], [5, 7], [7, 8], [8, 4], [7, 9], [9, 2],
  ];

  return (
    <svg className="rc-network" viewBox="0 0 440 320" role="img" aria-label="Diagram of researchers connected through a shared network">
      <defs>
        <linearGradient id="rc-line-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          className="rc-network__line"
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          className={`rc-network__node ${n.core ? 'rc-network__node--core' : ''}`}
          cx={n.x} cy={n.y} r={n.r}
          fill={n.core ? '#4F46E5' : '#2563EB'}
          style={{ animationDelay: `${(i % 5) * 0.4}s` }}
        />
      ))}
    </svg>
  );
}

export default function AboutUs() {
  return (
    <div className="rc-about">

      {/* ---------------- HERO ---------------- */}
      <section className="rc-hero">
        <div className="rc-container rc-hero__grid">
          <div>
            <p className="rc-eyebrow">A network built for research</p>
            <h1 className="rc-heading rc-heading--xl">
              Where research finds its people.
            </h1>
            <p className="rc-body rc-body--lg">
              ResearchConnect brings researchers, students, and academics together
              to share work, ask focused questions, and build on each other's
              findings — without the noise of a general social feed.
            </p>
            <div className="rc-hero__actions">
              <Link to="/register" className="rc-btn rc-btn--primary">Create your profile</Link>
              <a href="#what-we-offer" className="rc-btn rc-btn--ghost">Explore the platform</a>
            </div>
            <div className="rc-hero__stats">
              <div>
                <div className="rc-hero__stat-num">Growing</div>
                <div className="rc-hero__stat-label">researcher network</div>
              </div>
              <div>
                <div className="rc-hero__stat-num">All fields</div>
                <div className="rc-hero__stat-label">welcome, from day one</div>
              </div>
              <div>
                <div className="rc-hero__stat-num">Free</div>
                <div className="rc-hero__stat-label">for individual researchers</div>
              </div>
            </div>
          </div>
          <NetworkGraphic />
        </div>
      </section>

      {/* ---------------- WHO WE ARE ---------------- */}
      <section className="rc-section">
        <div className="rc-container rc-who">
          <Reveal>
            <p className="rc-eyebrow">Who we are</p>
            <h2 className="rc-heading rc-heading--lg">
              A home base for the work you're actually doing.
            </h2>
            <p className="rc-body">
              ResearchConnect exists to make collaboration as natural as research
              itself. We built a place where a graduate student can find a
              co-author on another continent, where a dataset can reach the one
              lab that needs it, and where feedback on a working paper doesn't
              wait for a conference three months out.
            </p>
            <p className="rc-body">
              No algorithmic feed built to maximize time on site — just the
              tools researchers actually asked for: profiles, publications, and
              the people behind them, connected.
            </p>
            <div className="rc-who__tags">
              <span className="rc-tag">Researchers</span>
              <span className="rc-tag">Students</span>
              <span className="rc-tag">Academic Institutions</span>
            </div>
          </Reveal>

          <Reveal className="rc-who__card">
            <div className="rc-who__card-row">
              <span className="rc-who__icon"><Icon.Profile /></span>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>Verified identity</h4>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  Real researchers, real institutional affiliations.
                </p>
              </div>
            </div>
            <div className="rc-who__card-row">
              <span className="rc-who__icon"><Icon.Discuss /></span>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>Built with researchers</h4>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  Shaped by feedback from the people who use it daily.
                </p>
              </div>
            </div>
            <div className="rc-who__card-row">
              <span className="rc-who__icon"><Icon.Access /></span>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>Open by default</h4>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  Free for individual researchers and students, always.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- MISSION / VISION ---------------- */}
      <section className="rc-section--tight">
        <div className="rc-container rc-mv">
          <Reveal className="rc-mv__card rc-mv__card--mission">
            <div className="rc-mv__mark">“</div>
            <p className="rc-eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Our mission</p>
            <p className="rc-body--lg" style={{ margin: 0 }}>
              To remove the friction between a researcher and their next
              collaborator, their next citation, their next breakthrough —
              giving every academic, regardless of institution or budget, a
              place to publish, discuss, and be found.
            </p>
          </Reveal>

          <Reveal className="rc-mv__card rc-mv__card--vision">
            <div className="rc-mv__mark">“</div>
            <p className="rc-eyebrow">Our vision</p>
            <p className="rc-body--lg" style={{ margin: 0 }}>
              A future where research moves at the speed of curiosity, not
              bureaucracy — where open collaboration across borders and
              disciplines is the default, not the exception.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- WHAT WE OFFER ---------------- */}
      <section className="rc-section" id="what-we-offer">
        <div className="rc-container">
          <Reveal>
            <p className="rc-eyebrow">What we offer</p>
            <h2 className="rc-heading rc-heading--lg">Everything a research workflow needs, in one place.</h2>
            <p className="rc-body">
              Each tool solves a specific problem researchers face — finding
              collaborators, tracking impact, or getting a paper in front of
              the right people.
            </p>
          </Reveal>

          <div className="rc-offer-grid">
            {[
              { icon: <Icon.Profile />, bg: 'var(--light-blue)', color: 'var(--primary-blue)', title: 'Researcher Profiles', text: "Publications, citations, and affiliations, verified and in one place." },
              { icon: <Icon.Collab />, bg: 'var(--light-purple)', color: 'var(--indigo)', title: 'Collaboration Spaces', text: 'Shared workspaces for co-authoring drafts, data, and discussion.' },
              { icon: <Icon.Discuss />, bg: 'var(--light-blue)', color: 'var(--primary-blue)', title: 'Q&A & Discussions', text: "Ask focused questions and get answers from people who've done the work." },
              { icon: <Icon.Citation />, bg: 'var(--light-green)', color: 'var(--success-green)', title: 'Citation & Impact Tracking', text: "See who's building on your work, and where it's being cited." },
              { icon: <Icon.Grant />, bg: 'var(--light-orange)', color: 'var(--orange)', title: 'Funding & Opportunities', text: 'Grants, fellowships, and open positions, filtered by field.' },
              { icon: <Icon.Feed />, bg: 'var(--light-purple)', color: 'var(--indigo)', title: 'Relevant Research Feed', text: 'Updates from your field and network — not what happens to be trending.' },
            ].map((card, i) => (
              <Reveal className="rc-offer-card" key={i} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
                <span className="rc-offer-card__icon" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- WHY CHOOSE US ---------------- */}
      <section className="rc-why rc-section">
        <div className="rc-container">
          <Reveal>
            <p className="rc-eyebrow">Why choose ResearchConnect</p>
            <h2 className="rc-heading rc-heading--lg">Built differently, on purpose.</h2>
          </Reveal>

          <div className="rc-why__grid">
            {[
              { title: 'Built for depth, not virality', text: "No engagement-driven feed competing for your attention." },
              { title: 'Verified academic identity', text: 'Real researchers, real institutions — every time.' },
              { title: 'Cross-disciplinary by design', text: 'Discover work and people outside your usual circle.' },
              { title: 'Free for individuals', text: 'Full access for researchers and students, no paywall.' },
              { title: 'Your data stays yours', text: 'Control exactly what is public, private, or institution-only.' },
              { title: 'Built with researcher feedback', text: 'Every feature responds to a real workflow problem.' },
            ].map((item, i) => (
              <Reveal className="rc-why__item" key={i} style={{ transitionDelay: `${(i % 3) * 0.07}s` }}>
                <span className="rc-why__check"><Icon.Check /></span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="rc-section">
        <div className="rc-container">
          <Reveal>
            <p className="rc-eyebrow">How it works</p>
            <h2 className="rc-heading rc-heading--lg">From profile to collaboration, in four steps.</h2>
          </Reveal>

          <div className="rc-steps">
            {[
              { n: '[01]', title: 'Create your profile', text: 'Add your publications, affiliations, and research interests.' },
              { n: '[02]', title: 'Find your people', text: 'Search by field, institution, or a specific publication.' },
              { n: '[03]', title: 'Collaborate', text: 'Share drafts, datasets, and feedback in a shared workspace.' },
              { n: '[04]', title: 'Get discovered', text: 'Show up in searches and feeds relevant to your work.' },
            ].map((step, i) => (
              <Reveal className="rc-step" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <span className="rc-step__mark">{step.n}</span>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- COMMUNITY ---------------- */}
      <section className="rc-community rc-section">
        <div className="rc-container">
          <Reveal>
            <p className="rc-eyebrow">Our community</p>
            <h2 className="rc-heading rc-heading--lg">Researchers, across every field.</h2>
            <p className="rc-body">
              From early-career students to tenured faculty, ResearchConnect is
              built for anyone doing serious research — spanning disciplines
              that don't often get to talk to each other.
            </p>
          </Reveal>

          <Reveal className="rc-community__fields">
            {['Neuroscience', 'Climate Science', 'Computer Science', 'Public Health', 'Economics', 'Materials Science', 'Sociology', 'Genomics', 'Linguistics'].map((f) => (
              <span className="rc-field-chip" key={f}>{f}</span>
            ))}
          </Reveal>

          <div className="rc-quotes">
            {[
              { quote: "I found a co-author for a paper I'd shelved for a year — within a week of posting about it.", role: 'Postdoctoral Researcher, Environmental Science' },
              { quote: 'The discussion threads on my last preprint were more useful than two rounds of peer review.', role: 'PhD Candidate, Computational Biology' },
              { quote: "It's the first platform that treats my dataset and my discussion the same as my paper.", role: 'Associate Professor, Public Health' },
            ].map((q, i) => (
              <Reveal className="rc-quote" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="rc-quote__mark">“</div>
                <p>{q.quote}</p>
                <div className="rc-quote__attr">— {q.role}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VALUES ---------------- */}
      <section className="rc-section">
        <div className="rc-container">
          <Reveal>
            <p className="rc-eyebrow">Our values</p>
            <h2 className="rc-heading rc-heading--lg">What we won't compromise on.</h2>
          </Reveal>

          <div className="rc-values-grid">
            {[
              { icon: <Icon.Rigor />, bg: 'var(--light-blue)', color: 'var(--primary-blue)', title: 'Rigor', text: 'We hold research standards, not follower counts.' },
              { icon: <Icon.Openness />, bg: 'var(--light-purple)', color: 'var(--indigo)', title: 'Openness', text: "Sharing work and data accelerates everyone's progress." },
              { icon: <Icon.Integrity />, bg: 'var(--light-green)', color: 'var(--success-green)', title: 'Integrity', text: 'Verified identities and transparent attribution.' },
              { icon: <Icon.Collaboration />, bg: 'var(--light-orange)', color: 'var(--orange)', title: 'Collaboration', text: 'Great research is rarely done alone.' },
              { icon: <Icon.Access />, bg: 'var(--light-blue)', color: 'var(--primary-blue)', title: 'Accessibility', text: 'No paywalls between you and your next collaborator.' },
            ].map((v, i) => (
              <Reveal className="rc-value-card" key={i} style={{ transitionDelay: `${(i % 5) * 0.06}s` }}>
                <span className="rc-value-card__icon" style={{ background: v.bg, color: v.color }}>
                  {v.icon}
                </span>
                <h4>{v.title}</h4>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <Reveal as="section" className="rc-cta">
        <div className="rc-cta__inner">
          <h2>Your next collaborator is already here.</h2>
          <p>Join a network built specifically for researchers, students, and academics — free to get started.</p>
          <div className="rc-cta__actions">
            <Link to="/register" className="rc-btn rc-btn--onblue">Join ResearchConnect — it's free</Link>
            <Link to="/explore" className="rc-btn rc-btn--ghost" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
              Browse the platform
            </Link>
          </div>
        </div>
      </Reveal>

    </div>
  );
}