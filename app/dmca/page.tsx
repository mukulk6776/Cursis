import { marketingMetadata } from '@/lib/seo/marketing';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata = { ...marketingMetadata('/dmca', 'Copyright and DMCA Policy', 'Read how to submit copyright notices and counter-notices to Cursis.') };

export default function DmcaPage() {
  return (
    <PolicyLayout
      title="Copyright & DMCA Policy"
      badge="Copyright complaints"
      badgeColor="#DC2626"
      lastUpdated="Last Updated: October 17, 2026 • Version 2.0"
      activeSlug="dmca"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          Cursis accepts copyright complaints at official@cursis.in. This page provides a complaint process; it does not establish registration of a U.S. statutory agent or entitlement to a safe harbor.
        </p>
      }
    >
      {/* Section 1: Designated Agent Information */}
      <section>
        <h2>
          1. Copyright complaint contact
        </h2>
        <p style={{ margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Contact Saransh Vashistha, operating as Cursis, at official@cursis.in. A business contact postal address is awaiting confirmation.
        </p>

        <div
          style={{
            backgroundColor: '#FAF8F5',
            border: '1.5px solid #0A0A0A',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '2px 2px 0 0 #0A0A0A',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Designated Agent &amp; Organization</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0A', marginTop: '2px' }}>Saransh Vashistha</div>
            <div style={{ fontSize: '13px', color: '#333' }}>Cursis</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Alternate DBAs: Cursis, Cursis.in, Cursis AI, Cursis Agency OS
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Direct Contact</div>
            <div style={{ fontSize: '13px', color: '#0A0A0A', marginTop: '2px' }}>
              <strong>Dedicated Email:</strong>{' '}
              <a href="mailto:official@cursis.in" style={{ color: '#0F4CFF', fontWeight: 700 }}>official@cursis.in</a>
            </div>
            <div style={{ fontSize: '13px', color: '#0A0A0A', marginTop: '2px' }}>
              <strong>Secondary:</strong>{' '}
              <a href="mailto:official@cursis.in" style={{ color: '#0F4CFF' }}>official@cursis.in</a>
            </div>
            <div style={{ fontSize: '13px', color: '#0A0A0A', marginTop: '2px' }}>
              <strong>Contact method:</strong> Email
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Physical Addresses for Legal Service</div>
            <div style={{ fontSize: '13px', color: '#333', marginTop: '4px' }}>
              <strong>Headquarters:</strong> Cursis, Business contact address awaiting confirmation<br />
              <strong>U.S. Service Office:</strong> Cursis Legal &amp; Compliance, Agent appointment not confirmed
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', fontSize: '12px', color: '#0369A1' }}>
          <strong>U.S. Copyright Office Registration:</strong> No U.S. statutory-agent registration has been confirmed. The official directory is available at <a href="https://dmca.copyright.gov/osp/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 700 }}>dmca.copyright.gov/osp/</a>.
        </div>
      </section>

      {/* Section 2: Statutory Takedown Requirements */}
      <section>
        <h2>
          2. Requirements for Submitting a DMCA Infringement Notification
        </h2>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>
          Under 17 U.S.C. § 512(c)(3), an effective DMCA notice must be in writing and include all of the following elements:
        </p>
        <ol style={{ paddingLeft: '22px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', lineHeight: 1.5 }}>
          <li>
            <strong>Physical or Electronic Signature:</strong> A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.
          </li>
          <li>
            <strong>Identification of Work:</strong> Identification of the copyrighted work claimed to have been infringed, or a representative list if multiple works are covered.
          </li>
          <li>
            <strong>Identification of Infringing Material:</strong> Identification of the specific material claimed to be infringing (including exact URLs or Workspace Asset IDs) reasonably sufficient to permit Cursis to locate the material.
          </li>
          <li>
            <strong>Contact Information:</strong> Information reasonably sufficient to permit us to contact you, such as your full name, physical mailing address, telephone number, and email address.
          </li>
          <li>
            <strong>Good Faith Statement:</strong> A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
          </li>
          <li>
            <strong>Statement of Accuracy:</strong> A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
          </li>
        </ol>
      </section>

      {/* Section 3: Counter-Notification */}
      <section>
        <h2>
          3. Counter-Notification Procedure
        </h2>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>
          If you believe your material was removed or disabled as a result of mistake or misidentification, you may submit a written Counter-Notification pursuant to 17 U.S.C. § 512(g)(3) containing:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', lineHeight: 1.5 }}>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the material that has been removed or disabled, and the location where it appeared before removal.</li>
          <li>A statement under penalty of perjury that you have a good faith belief the material was removed or disabled as a result of mistake or misidentification.</li>
          <li>Your name, address, telephone number, and a statement consenting to the jurisdiction of the federal district court for your judicial district (or San Francisco, CA if outside the U.S.).</li>
        </ul>
        <p style={{ margin: '14px 0 0 0', fontSize: '13px', color: '#555' }}>
          Upon receipt of a valid counter-notification, Cursis will forward a copy to the original complaining party. If no legal action is filed within 10 to 14 business days, Cursis may restore the disabled material.
        </p>
      </section>

      {/* Section 4: Repeat Infringer Policy */}
      <section>
        <h2>
          4. Repeat Infringer Policy (17 U.S.C. § 512(i))
        </h2>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          In accordance with the DMCA and other applicable intellectual property laws, Cursis maintains a policy of terminating, in appropriate circumstances and at our sole discretion, workspace accounts and users who are deemed to be repeat copyright infringers.
        </p>
      </section>
    </PolicyLayout>
  );
}
