import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: 'Data Deletion Request — Cursis',
  description: 'Submit a request to delete your personal data from Cursis in compliance with GDPR and data protection regulations.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function DataDeletionPage() {
  return (
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', maxWidth: '880px', margin: '0 auto', padding: '120px 24px 80px', color: '#f1f5f9' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '9999px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GDPR & Data Protection Rights
            </span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#ffffff' }}>
            Data Deletion Request
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Exercise your right to be forgotten under GDPR, CCPA, and other data protection laws
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px 28px', marginBottom: '48px', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1' }}>
            You have the right to request deletion of your personal data. We take data privacy seriously and will process your request within 30 days as required by law.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '15px', lineHeight: 1.75, color: '#94a3b8' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Your Data Protection Rights
            </h2>
            <p>
              Under GDPR, CCPA, and similar regulations, you have the following rights:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong style={{ color: '#ffffff' }}>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong style={{ color: '#ffffff' }}>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong style={{ color: '#ffffff' }}>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong style={{ color: '#ffffff' }}>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong style={{ color: '#ffffff' }}>Right to Object:</strong> Object to processing of your data for certain purposes</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              What Data Will Be Deleted?
            </h2>
            <p>
              When you submit a deletion request, we will permanently remove:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Your account information (name, email, profile details)</li>
              <li>Workspace data you created or own</li>
              <li>Tasks, projects, and documents you authored</li>
              <li>Messages and collaboration history</li>
              <li>Usage analytics and logs containing your personal identifiers</li>
            </ul>
            <p style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', color: '#fbbf24' }}>
              ⚠️ <strong>Note:</strong> Data deletion is permanent and cannot be undone. Make sure to export any data you want to keep before submitting this request.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Data Retention Requirements
            </h2>
            <p>
              Some data may be retained for legal compliance:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong style={{ color: '#ffffff' }}>Financial Records:</strong> Billing and transaction data (retained for 7 years for tax compliance)</li>
              <li><strong style={{ color: '#ffffff' }}>Legal Obligations:</strong> Data required for pending legal proceedings</li>
              <li><strong style={{ color: '#ffffff' }}>Security Logs:</strong> Anonymized security incident logs (retained for 90 days)</li>
              <li><strong style={{ color: '#ffffff' }}>Shared Workspace Data:</strong> Content in workspaces owned by others may remain visible to those workspace owners</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              How to Submit a Deletion Request
            </h2>
            <p>
              To delete your data, please follow these steps:
            </p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <strong style={{ color: '#ffffff' }}>In-App Deletion (Fastest):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Log in to your Cursis account</li>
                  <li>Go to Settings → Account → Delete Account</li>
                  <li>Confirm your identity and submit the request</li>
                  <li>Your account will be deleted within 24-48 hours</li>
                </ul>
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>Email Request:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Send an email to <a href="mailto:privacy@cursis.app" style={{ color: '#ef4444' }}>privacy@cursis.app</a></li>
                  <li>Subject: "Data Deletion Request - [Your Email]"</li>
                  <li>Include: Full name, email address, and workspace ID (if known)</li>
                  <li>We will respond within 3 business days to confirm your identity</li>
                  <li>Data will be deleted within 30 days of verification</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Identity Verification
            </h2>
            <p>
              To protect your data from unauthorized deletion requests, we must verify your identity:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>For in-app requests: You must be logged in with your credentials</li>
              <li>For email requests: We will send a verification link to your registered email</li>
              <li>For phone requests: We will send an OTP to your registered phone number</li>
            </ul>
            <p style={{ marginTop: '16px' }}>
              This verification step ensures that only you can request deletion of your data.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Export Your Data First
            </h2>
            <p>
              Before deleting your account, we recommend exporting your data:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Go to Settings → Data & Privacy → Export Data</li>
              <li>Select what you want to export (projects, tasks, documents, messages)</li>
              <li>Download the ZIP file containing all your data in JSON format</li>
              <li>This export is available for 30 days after account deletion</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Contact Data Protection Officer
            </h2>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: 600 }}>Cursis Data Protection Team</p>
              <p style={{ margin: '0 0 4px' }}>Email: <a href="mailto:privacy@cursis.app" style={{ color: '#ef4444' }}>privacy@cursis.app</a></p>
              <p style={{ margin: '0 0 4px' }}>DPO: <a href="mailto:dpo@cursis.app" style={{ color: '#ef4444' }}>dpo@cursis.app</a></p>
              <p style={{ margin: '0 0 4px' }}>Response Time: Within 30 days (as required by GDPR)</p>
              <p style={{ margin: 0 }}>
                Privacy Policy: <Link href="/privacy-policy" style={{ color: '#ef4444' }}>View Full Policy</Link>
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Complaints and Supervisory Authority
            </h2>
            <p>
              If you are not satisfied with how we handle your data deletion request, you have the right to lodge a complaint with your local data protection authority:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>EU Users:</strong> Contact your national Data Protection Authority</li>
              <li><strong>UK Users:</strong> Information Commissioner's Office (ICO)</li>
              <li><strong>California Users:</strong> California Attorney General's Office</li>
              <li><strong>India Users:</strong> Ministry of Electronics and IT (MeitY)</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
