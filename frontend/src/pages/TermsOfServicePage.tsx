import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';

const sectionStyle = { marginTop: 28 } as const;

export default function TermsOfServicePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF9F6',
        color: '#24332c',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          background: '#1B4D3E',
          color: '#fff',
          padding: '22px 24px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            La Villa
          </Link>

          <div
            style={{
              color: '#d5e5dc',
              fontSize: 11,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            Lekker Stays
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '48px 24px 64px',
          lineHeight: 1.75,
        }}
      >
        <p
          style={{
            color: '#557266',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          Legal information
        </p>

        <h1
          style={{
            color: '#1B4D3E',
            fontSize: 36,
            lineHeight: 1.2,
            margin: '8px 0 12px',
          }}
        >
          Terms of Service
        </h1>

        <p style={{ color: '#64748b', fontSize: 14 }}>
          Last updated: 3 November 2026
        </p>

        <p>
          These Terms of Service (&quot;Terms&quot;) apply to
          your use of the La Villa Lekker Stays website and
          booking services (&quot;La Villa&quot;, &quot;we&quot;,
          &quot;us&quot; or &quot;our&quot;), operated by Circuit
          Sentry. By accessing the website or using its
          services, you agree to these Terms. If you do not
          agree, please do not use the service.
        </p>

        <section style={sectionStyle}>
          <h2>1. About La Villa</h2>

          <p>
            La Villa provides an online platform where
            visitors can discover accommodation listings,
            view details, save stays and submit reservation
            requests. Accommodation is supplied by the
            relevant accommodation operator. A listing on
            La Villa does not mean that Circuit Sentry owns
            or operates the property itself.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>2. Accounts</h2>

          <p>
            You must provide accurate and current information
            when creating an account or making a booking. You
            are responsible for keeping your sign-in
            credentials secure and for activity carried out
            through your account. Notify us promptly if you
            believe your account has been accessed without
            permission. You may sign in using an email/password
            account or an available Google sign-in option.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>3. Listings, prices and availability</h2>

          <p>
            We aim to display accurate accommodation
            descriptions, facilities, prices and availability.
            Listings and availability can change, and
            occasional errors may occur. The final booking
            details and price shown during checkout are the
            details you should review before paying. Contact
            us if information appears incorrect.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>4. Reservations and payment</h2>

          <p>
            When you submit a reservation, you must provide
            accurate guest and travel details. A reservation
            is not confirmed merely because you reach a
            payment return page or receive a browser message.
            For bookings that require online payment, the
            reservation is confirmed only after the payment
            provider&apos;s transaction has been successfully
            verified by La Villa and the booking status has
            been updated.
          </p>

          <p>
            Unless the checkout page states otherwise, the
            full booking amount is payable upfront through
            the payment method presented at checkout.
            Payments are processed by the third-party payment
            provider, currently Paystack. You must follow
            that provider&apos;s payment instructions.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>5. Cancellations, changes and refunds</h2>

          <p>
            Cancellation, date-change and refund conditions
            may depend on the accommodation and the policy
            shown for the relevant booking. Review those
            conditions before paying. To request a change,
            cancellation or refund, contact us at{' '}
            <a
              href="mailto:circuitsentrydev@gmail.com"
              style={{ color: '#1B4D3E' }}
            >
              circuitsentrydev@gmail.com
            </a>{' '}
            and include your reservation code. A request is
            not approved until you receive confirmation.
            Nothing in these Terms removes any consumer
            rights that cannot lawfully be excluded.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>6. Your responsibilities</h2>

          <p>
            You agree not to misuse the website, interfere
            with its operation, attempt unauthorised access,
            submit false booking information, infringe
            another person&apos;s rights, upload unlawful or
            harmful material, or use the service for
            fraudulent or illegal purposes. You are
            responsible for complying with the accommodation
            property&apos;s reasonable rules during your stay.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>7. Reviews and user content</h2>

          <p>
            If you submit a review, comment, image or other
            content, you must have the right to provide it
            and it must be truthful, lawful and respectful.
            You grant us permission to display and use that
            content in connection with operating and
            promoting La Villa. We may remove content that
            is unlawful, abusive, misleading or otherwise
            inappropriate.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>8. Third-party services</h2>

          <p>
            Google sign-in, Paystack payments, hosting,
            database and other third-party services may be
            used to provide parts of La Villa. Their own
            terms and privacy policies apply to your use of
            those services. We are not responsible for
            third-party services to the extent permitted by
            law, but this does not limit rights you may have
            under applicable consumer-protection law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>9. Intellectual property</h2>

          <p>
            La Villa&apos;s branding, website design, text,
            graphics and software are owned by or licensed
            to Circuit Sentry, except for third-party
            materials and accommodation content supplied
            by their respective owners. You may use the
            website for personal, lawful purposes only and
            may not copy, modify, distribute or commercially
            exploit our materials without permission.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>10. Service availability and liability</h2>

          <p>
            We work to keep La Villa available and accurate,
            but we do not guarantee uninterrupted or
            error-free operation. To the extent permitted
            by law, we are not liable for indirect or
            consequential loss arising from use of the
            website, third-party service interruptions or
            accommodation services supplied by independent
            property operators. These Terms do not exclude
            liability or consumer rights that cannot
            legally be excluded or limited.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>11. Suspension or termination</h2>

          <p>
            We may restrict or suspend access where
            reasonably necessary to protect the service,
            users or third parties, investigate suspected
            fraud or address a breach of these Terms. You
            may stop using La Villa at any time. Booking,
            payment and legal obligations that arose before
            account closure may continue to apply.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>12. Privacy</h2>

          <p>
            Our collection and use of personal information
            is explained in our{' '}
            <Link
              to="/privacy-policy"
              style={{ color: '#1B4D3E' }}
            >
              Privacy Policy
            </Link>
            , which forms part of these Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>13. Governing law and changes</h2>

          <p>
            These Terms are governed by the laws of the
            Republic of South Africa, subject to any
            mandatory consumer-protection rights that apply.
            We may update these Terms by publishing a
            revised version on this page. The updated date
            above indicates when the page was last revised.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>14. Contact</h2>

          <p>
            <strong>Operator:</strong> Circuit Sentry,
            operating La Villa Lekker Stays.
          </p>

          <p>
            <strong>Support:</strong>{' '}
            <a
              href="mailto:circuitsentrydev@gmail.com"
              style={{ color: '#1B4D3E' }}
            >
              circuitsentrydev@gmail.com
            </a>
          </p>
        </section>

        <p style={{ marginTop: 40 }}>
          <Link
            to="/privacy-policy"
            style={{ color: '#1B4D3E', fontWeight: 600 }}
          >
            Read the Privacy Policy →
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}