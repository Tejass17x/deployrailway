import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of terms' },
  { id: 'eligibility', title: '2. Eligibility & account registration' },
  { id: 'account-security', title: '3. Account security' },
  { id: 'user-content', title: '4. Your content & publications' },
  { id: 'scholar-sync', title: '5. Google Scholar sync & third-party data' },
  { id: 'acceptable-use', title: '6. Acceptable use' },
  { id: 'collaboration', title: '7. Collaboration workspaces & messaging' },
  { id: 'ip', title: '8. Intellectual property' },
  { id: 'third-party', title: '9. Third-party services' },
  { id: 'termination', title: '10. Suspension & termination' },
  { id: 'disclaimers', title: '11. Disclaimers' },
  { id: 'liability', title: '12. Limitation of liability' },
  { id: 'indemnity', title: '13. Indemnification' },
  { id: 'changes', title: '14. Changes to these terms' },
  { id: 'governing-law', title: '15. Governing law' },
  { id: 'contact', title: '16. Contact us' },
];

const TermsOfServicePage = () => {
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

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Terms of Service</h1>
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
              These Terms of Service ("Terms") govern your access to and use of Research Connect, including our website,
              applications, APIs, and related services (collectively, the "Platform"), operated as an academic research
              networking and collaboration platform. By creating an account or otherwise using the Platform, you agree
              to be bound by these Terms. If you do not agree, please do not use the Platform.
            </p>

            <section id="acceptance">
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of terms</h2>
              <p>
                By registering for or using Research Connect in any capacity, you confirm that you have read, understood,
                and agree to these Terms and our Privacy Policy. We may update these Terms from time to time as described
                in Section 14, and continued use of the Platform after such updates constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section id="eligibility">
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Eligibility & account registration</h2>
              <p>
                You must be at least 16 years old to create an account. The Platform is intended primarily for researchers,
                students, faculty, and academic institutions. You agree to provide accurate, current, and complete information
                during registration (including OTP-verified email) and to keep your profile information up to date. You are
                responsible for ensuring that any institutional affiliation, degree, or research identity you provide is truthful.
              </p>
            </section>

            <section id="account-security">
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Account security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your password and for all activity that occurs
                under your account. Notify us immediately at the contact address below if you suspect unauthorized access
                to your account. We use industry-standard password hashing, OTP verification, and refresh-token based
                sessions to help protect your account, but we cannot guarantee absolute security.
              </p>
            </section>

            <section id="user-content">
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Your content & publications</h2>
              <p>
                "User Content" includes publications, abstracts, datasets, comments, messages, profile details, and any
                other material you upload or submit to the Platform. You retain ownership of your User Content. By
                submitting it, you grant Research Connect a non-exclusive, worldwide, royalty-free license to host, store,
                display, index, and distribute that content solely for the purpose of operating and improving the Platform
                (e.g. publication library, citation graphs, search, and analytics).
              </p>
              <p className="mt-3">
                You represent that you own or have the necessary rights to any content you upload, including publication
                PDFs, and that such content does not infringe any third party's copyright or other rights.
              </p>
            </section>

            <section id="scholar-sync">
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Google Scholar sync & third-party data</h2>
              <p>
                If you choose to connect or import data from Google Scholar or similar academic databases, you authorize
                Research Connect to retrieve, store, and periodically re-sync your publication list, citation counts, and
                co-author graph for the purpose of populating and enriching your researcher profile. You may disconnect
                this sync at any time from your account settings; previously imported data may be retained unless you
                request deletion.
              </p>
            </section>

            <section id="acceptable-use">
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Acceptable use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2 ml-1">
                <li>Upload plagiarized, fraudulent, or falsified research content</li>
                <li>Impersonate another researcher, institution, or person</li>
                <li>Use automated scraping tools to bulk-extract profiles or publications</li>
                <li>Send unsolicited bulk messages or spam to other researchers</li>
                <li>Upload malware or attempt to interfere with the Platform's security or infrastructure</li>
                <li>Use the Platform for any unlawful purpose or in violation of applicable academic integrity policies</li>
              </ul>
            </section>

            <section id="collaboration">
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Collaboration workspaces & messaging</h2>
              <p>
                Collaboration workspaces, tasks, shared files, and real-time messaging (including calls) are provided to
                facilitate research collaboration between connected users. You are responsible for the appropriateness of
                content shared within workspaces and conversations. We may retain message and file metadata as needed for
                platform operation, moderation, and safety.
              </p>
            </section>

            <section id="ip">
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Intellectual property</h2>
              <p>
                The Platform's design, branding, software, and underlying technology are owned by Research Connect and
                protected by intellectual property laws. Except for your own User Content, you may not copy, modify,
                distribute, or create derivative works from any part of the Platform without prior written permission.
              </p>
            </section>

            <section id="third-party">
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Third-party services</h2>
              <p>
                The Platform integrates with third-party services for file storage and delivery (Cloudflare R2),
                academic data retrieval (SerpApi / Google Scholar), and other infrastructure providers. Your use of these
                integrations is also subject to the respective third party's terms, and Research Connect is not responsible
                for their independent acts or omissions.
              </p>
            </section>

            <section id="termination">
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Suspension & termination</h2>
              <p>
                We may suspend or terminate your account if you violate these Terms, misuse the Platform, or engage in
                conduct that we determine, in our reasonable discretion, is harmful to other users or the Platform. You
                may delete your account at any time via account settings; certain data may be retained as required by law
                or for legitimate operational purposes (e.g. security logs).
              </p>
            </section>

            <section id="disclaimers">
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Disclaimers</h2>
              <p>
                The Platform, including AI-powered recommendations and analytics, is provided "as is" and "as available"
                without warranties of any kind, express or implied. We do not guarantee the accuracy, completeness, or
                reliability of any research content, citation metrics, or researcher recommendations generated by the
                Platform.
              </p>
            </section>

            <section id="liability">
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, Research Connect and its affiliates shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or
                academic reputation, arising out of or related to your use of the Platform.
              </p>
            </section>

            <section id="indemnity">
              <h2 className="text-xl font-bold text-slate-900 mb-3">13. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Research Connect, its team, and affiliates from any claims,
                damages, or expenses arising from your violation of these Terms or misuse of the Platform, including
                claims related to content you upload.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-xl font-bold text-slate-900 mb-3">14. Changes to these terms</h2>
              <p>
                We may revise these Terms periodically to reflect changes in our services, legal requirements, or
                platform features. Material changes will be notified via email or an in-app notice. Continued use after
                changes take effect constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section id="governing-law">
              <h2 className="text-xl font-bold text-slate-900 mb-3">15. Governing law</h2>
              <p>
                These Terms are governed by the laws of India, without regard to conflict of law principles. Any disputes
                arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Haryana, India.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-xl font-bold text-slate-900 mb-3">16. Contact us</h2>
              <p>
                If you have questions about these Terms, please contact us at{' '}
                <a href="mailto:support@researchconnect.app" className="text-blue-600 hover:underline">support@researchconnect.app</a>.
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

export default TermsOfServicePage;
