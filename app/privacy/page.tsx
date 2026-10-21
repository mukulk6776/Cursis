import { marketingMetadata } from '@/lib/seo/marketing';
import PolicyLayout from '@/components/landing/PolicyLayout';
import Link from 'next/link';
import { collectionMatrix, privacyContact, PRIVACY_VERSION } from '@/lib/privacy/config';
export const dynamic = 'force-dynamic';
export const metadata = { ...marketingMetadata('/privacy', 'Privacy Notice', 'How Cursis handles account, workspace and AI data, consent and privacy rights.') };
const card = { background: '#fff', border: '2px solid #0A0A0A', borderRadius: 18, padding: 24, boxShadow: '6px 6px 0 #0A0A0A', marginBottom: 24 };
function Matrix({ rows }: { rows: readonly (readonly string[])[] }) {
  return <div style={{ overflowX: 'auto' }}><table><tbody>{rows.map(row => <tr key={row[0]}>{row.map((cell, i) => <td key={i} style={{ padding: 12, borderBottom: '1px solid #ddd', verticalAlign: 'top' }}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
export default function PrivacyPage() {
  return <PolicyLayout title="Privacy Notice" badge="Standalone personal data notice" activeSlug="privacy"
    lastUpdated={PRIVACY_VERSION} contactEmail={privacyContact.email} dpoEmail={privacyContact.email}
    summary={<p>How we use personal data, separately from our Terms. <Link href="/privacy/rights">Manage your data and consent</Link>.</p>}>
    <section style={card}><h2>Who is responsible?</h2><p>{privacyContact.entity}. Address: {privacyContact.address}.</p>
    <p><strong>Draft status:</strong> business contact postal address, provider contracts, regions and retention operations require confirmation. This notice describes observed code and proposed operational targets.</p>
    <p>Cursis is Data Fiduciary (GDPR controller where applicable) for its account, security, billing and direct inquiry purposes. For personal data an enterprise customer places in its workspace, that customer normally acts as fiduciary/controller and Cursis as processor under documented instructions. Cursis remains responsible for any separate purposes it determines.</p>
    <p>Customers must give notices, establish lawful grounds, manage employee/client permissions and instruct us on retention and rights. We must secure processing, bind approved providers, assist with rights/incidents, and return or delete data under the processing agreement. Workspace administrators may access workspace content.</p></section>
    <section style={card}><h2>Data, purpose and collection point</h2><Matrix rows={collectionMatrix} /></section>
    <section style={card}><h2>Legal grounds and consent</h2>
    <p>Signup requires affirmative consent to account processing needed to deliver and secure your workspace. Inquiry consent covers replying to that inquiry. Optional analytics/storage have separate choices, default off. Neither signup nor inquiries authorise marketing.</p>
    <p>A statutory legitimate use requires a specific Section 7 provision, such as voluntarily supplied details for a requested purpose under 7(a), or legally required disclosure under 7(d). DPDP has no general commercial legitimate-interest basis. Customers assess employment processing independently. Required legal retention is documented separately.</p>
    <p>Where GDPR applies, necessary services may rely on contract, mandatory retention on legal obligation and optional analytics on consent. A security legitimate-interest basis needs a documented balancing assessment.</p>
    <p>You may refuse optional processing and still use the service. <Link href="/privacy/rights">Withdraw consent here</Link> or email us without signing in. Withdrawing essential account processing closes the account. Earlier lawful processing and mandatory retention are unaffected.</p></section>
    <section style={card}><h2>Transfers outside India</h2>
    <p>Providers may process abroad. Transfers must be checked against restrictions notified under Section 16, applicable Central Government orders under Rule 15 when effective, and stricter sectoral/localisation duties. Further restrictions require review if we become a Significant Data Fiduciary. Provider availability is not government approval. Prohibited flows must stop or be rerouted. Production regions are unverified.</p>
    <p>Where GDPR applies, transfers separately need a valid Chapter V mechanism, such as adequacy or appropriate contractual safeguards, with transfer assessment and supplementary measures where needed.</p></section>
    <section style={card}><h2>Retention schedule</h2>
    <p>These targets require operational deployment and provider confirmation. Closure stops account access. Eligible records should be erased promptly, with active/provider/backup cleanup targeted within 90 days. This is not a universal statutory deadline and cannot override earlier duties or mandatory retention.</p>
    <ul>
    <li>Account/workspace records: while necessary for service, then eligible erasure within 90 days of closure. Customer-controlled shared records follow the customer's lawful instructions.</li>
    <li>Inquiry and generated proposal: 90 days after last substantive response without engagement; contracts use a separate documented schedule.</li>
    <li>New privacy requests and consent evidence: 12 months after recording, subject to approved legal holds/schedule. Nominees: until removed, replaced or account closure.</li>
    <li>Browser consent: renew after 180 days. Signed sessions: maximum 7 days. Device chat caches: clear on closure on that device; other devices need local cleanup.</li>
    <li>Security/processing logs: restricted 1-year schedule where final Rules 6/8 apply. CERT-In-covered ICT logs: at least 180 days within India.</li>
    <li>Personal data and processing/traffic logs within Rule 8(3): minimum 1 year from processing when effective, then erase unless another duty applies. This can exceed the closure target.</li>
    <li>GST records where applicable: 72 months from the relevant annual return due date; longer for proceedings. Separately assess company-law books retention of 8 financial years where applicable.</li>
    <li>Backups: proposed 90-day rotation except restricted legal archives; restores must reapply deletion blocks before reuse.</li></ul>
    <p>We will explain retained categories, legal reasons and review dates. Existing provider retention, restricted archives and backup rotation are not yet verified or fully automated.</p></section>
    <section style={card}><h2>Children and guardians</h2>
    <p>Cursis is for adults 18 or older. We do not offer a parental-consent signup path. Do not submit under-18 data. We prohibit tracking, behavioural monitoring and targeted advertising directed at children. A checkbox is not verifiable parental consent. A future child service requires separate verified parental consent and legal review; parental permission alone does not remove tracking restrictions.</p>
    <p>Contact us if a child's data was submitted so we can restrict and investigate it. Lawful guardians may contact us for rights assistance; any necessary evidence must use an agreed secure channel.</p></section>
    <section style={card}><h2>Your rights and language choices</h2>
    <p>The <Link href="/privacy/rights">Privacy Centre</Link> offers account JSON, profile correction, assisted access, erasure, consent withdrawal and nomination after death/incapacity. Access requests can seek a processing summary and recipient identities. JSON portability is an additional product feature; DPDP access is not a general portability right.</p>
    <p>We verify identity and protect other people. Nomination grants no current login access; claims require identity and death/incapacity verification. Customer-controlled requests are routed to that customer. You can email us without an account.</p>
    <p>For assistance, request English or your preferred Eighth Schedule language by email. Only English is currently implemented; translated notices and consent experiences still need provisioning.</p></section>
    <section style={card}><h2>Grievance contact</h2>
    <p>Name: {privacyContact.name}<br />Title: {privacyContact.title}<br />Email: <a href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a></p>
    <p>We commit to acknowledgment within 72 hours and resolution within 30 calendar days. Online requests receive an immediate receipt. For management escalation, reply with your request reference. These are service commitments.</p>
    <p>After exhausting our grievance process, you may complain to the Data Protection Board of India through its officially notified channel when available and applicable. Verify the channel at <a href="https://www.meity.gov.in/" target="_blank" rel="noopener noreferrer">MeitY</a>; keep your complaint and our response. Where GDPR applies, you can also complain to your competent supervisory authority.</p></section>
    <section style={card}><h2>Security and updates</h2>
    <p>Signed sessions, password hashing and access checks are present. A public endpoint check on 18 October 2026 found TLS 1.3 and TLS 1.2 support; it does not enforce TLS 1.3 only. Storage/backup encryption, key management, other connections and regions require infrastructure evidence. AES-256 on every stored copy is not verified. Incidents require notifications under applicable duties.</p>
    <p>Material purpose changes require updated notice and new consent where required. See the <a href="https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf" target="_blank" rel="noopener noreferrer">DPDP Act</a> and <a href="https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit" target="_blank" rel="noopener noreferrer">Rules, corrigendum and commencement notifications</a>. Duties have phased commencement.</p></section>
  </PolicyLayout>;
}
