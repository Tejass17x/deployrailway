import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'data-we-collect', title: '2. Data we collect' },
  { id: 'how-we-use', title: '3. How we use your data' },
  { id: 'scholar-data', title: '4. Google Scholar & academic data' },
  { id: 'sharing', title: '5. How we share data' },
  { id: 'cookies', title: '6. Cookies & tracking' },
  { id: 'storage', title: '7. Data storage & retention' },
  { id: 'security', title: '8. Security' },
  { id: 'your-rights', title: '9. Your rights & choices' },
  { id: 'children', title: '10. Children\'s privacy' },
  { id: 'international', title: '11. International data transfers' },
  { id: 'changes', title: '12. Changes to this policy' },
  { id: 'contact', title: '13. Contact us' },
];

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              R
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">
              Research<span className="text-blue-600">.connect</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: July 11, 2026</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-8 rounded-2xl p-5 border border-slate-200 bg-slate-50">
              <p className="text-slate-900 text-xs font-bold uppercase tracking-widest mb-4">On this page</p>
              <ul className="space-y-2.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-slate-500 text-xs hover:text-blue-600 transition-colors leading-snug block">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article className="lg:col-span-3 space-y-10 text-slate-600 text-sm leading-relaxed">
            <p>
              This Privacy Policy explains how Research Connect ("we", "us", "our") collects, uses, shares, and protects
              information when you use our academic research networking and collaboration platform (the "Platform").
              By using the Platform, you consent to the practices described in this Policy.
            </p>

            <section id="overview">
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Overview</h2>
              <p>
                Research Connect helps researchers discover publications, build professional networks, collaborate on
                projects, and track their academic impact. This means we handle personal data such as your profile
                information, publication history, messages, and usage activity in order to deliver these features.
              </p>
            </section>

            <section id="data-we-collect">
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data we collect</h2>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li><span className="text-slate-900 font-medium">Account data:</span> name, email, hashed password, institution, department, degree</li>
                <li><span className="text-slate-900 font-medium">Profile data:</span> bio, skills, education, experience, research interests, social links, avatar</li>
                <li><span className="text-slate-900 font-medium">Research data:</span> publications, citations, co-author graph, research areas, awards, patents</li>
                <li><span className="text-slate-900 font-medium">Activity data:</span> connections, follows, likes, comments, bookmarks, search history</li>
                <li><span className="text-slate-900 font-medium">Communication data:</span> messages, conversation metadata, notifications, workspace activity</li>
                <li><span className="text-slate-900 font-medium">Technical data:</span> IP address, device/browser type, session and refresh tokens, log data</li>
              </ul>
            </section>

            <section id="how-we-use">
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. How we use your data</h2>
              <p>We use collected data to:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2 ml-1">
                <li>Create and maintain your researcher profile and account</li>
                <li>Power AI-based researcher and publication recommendations</li>
                <li>Enable search, discovery, messaging, and collaboration features</li>
                <li>Generate analytics such as citation trends, profile views, and research impact metrics</li>
                <li>Send account, security, and product-related notifications</li>
                <li>Detect, investigate, and prevent fraud, abuse, or security incidents</li>
              </ul>
            </section>

            <section id="scholar-data">
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Google Scholar & academic data</h2>
              <p>
                If you connect your Google Scholar profile, we retrieve publicly available publication and citation data
                via a third-party retrieval service (SerpApi) to enrich your profile and analytics. This data is refreshed
                periodically. You can disconnect Google Scholar sync at any time in your account settings.
              </p>
            </section>

            <section id="sharing">
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. How we share data</h2>
              <p>We do not sell your personal data. We may share data with:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2 ml-1">
                <li><span className="text-slate-900 font-medium">Other users:</span> your public profile, publications, and activity visible per your privacy settings</li>
                <li><span className="text-slate-900 font-medium">Service providers:</span> Cloudflare R2 for file storage, MongoDB/Redis infrastructure providers, and email delivery services</li>
                <li><span className="text-slate-900 font-medium">Legal authorities:</span> where required by law, court order, or to protect the rights and safety of users</li>
              </ul>
            </section>

            <section id="cookies">
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Cookies & tracking</h2>
              <p>
                We use essential cookies and local storage to keep you signed in and remember your preferences. We may
                use analytics tools to understand how the Platform is used, in order to improve performance and features.
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section id="storage">
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Data storage & retention</h2>
              <p>
                Your data is stored on secured cloud infrastructure. We retain account and profile data for as long as
                your account is active. Upon account deletion, we remove or anonymize personal data within a reasonable
                period, except where retention is required for legal, security, or legitimate audit purposes (e.g.
                security and authentication logs).
              </p>
            </section>

            <section id="security">
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Security</h2>
              <p>
                We apply industry-standard safeguards including password hashing, JWT-based authentication with refresh
                tokens, rate limiting, and access controls to protect your data. However, no method of transmission or
                storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section id="your-rights">
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Your rights & choices</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2 ml-1">
                <li>Access, correct, or update your personal data via your profile settings</li>
                <li>Request deletion of your account and associated personal data</li>
                <li>Export a copy of your data</li>
                <li>Disconnect third-party integrations such as Google Scholar sync</li>
                <li>Opt out of non-essential email communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us using the details in Section 13.
              </p>
            </section>

            <section id="children">
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Children's privacy</h2>
              <p>
                The Platform is not intended for individuals under 16 years of age, and we do not knowingly collect
                personal data from children. If you believe a child has provided us with personal data, please contact
                us so we can take appropriate action.
              </p>
            </section>

            <section id="international">
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. International data transfers</h2>
              <p>
                As a global research platform, your data may be processed or stored in countries other than your own.
                We take reasonable steps to ensure such transfers comply with applicable data protection laws.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be communicated via email or
                an in-app notice before they take effect. The "Last updated" date at the top reflects the most recent revision.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-xl font-bold text-slate-900 mb-3">13. Contact us</h2>
              <p>
                For questions about this Privacy Policy or to exercise your data rights, contact us at{' '}
                <a href="mailto:privacy@researchconnect.app" className="text-blue-600 hover:underline">privacy@researchconnect.app</a>.
              </p>
            </section>
          </article>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Research Connect. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
