import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';

const sectionStyle = { marginTop: 28 } as const;

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>

        <p style={{ color: '#64748b', fontSize: 14 }}>
          Last updated: 3 November 2026
        </p>

        <p>
          This Privacy Policy explains how Circuit Sentry,
          the operator of La Villa Lekker Stays
          (&quot;La Villa&quot;, &quot;we&quot;, &quot;us&quot;
          or &quot;our&quot;), collects, uses, stores and shares
          personal information when you visit our website,
          create an account, save accommodation, contact us
          or make a booking.
        </p>

        <section style={sectionStyle}>
          <h2>1. Information we collect</h2>

          <p>
            Depending on how you use La Villa, we may collect:
          </p>

          <ul>
            <li>
              <strong>Account information:</strong> your name,
              email address, password hash and profile image,
              where supplied.
            </li>

            <li>
              <strong>Google sign-in information:</strong> when
              you choose Continue with Google, we receive your
              Google account&apos;s verified email address,
              name, profile image (if available) and a unique
              Google account identifier. We use these details
              to create or sign you in to your La Villa account.
              We do not receive your Google password.
            </li>

            <li>
              <strong>Booking information:</strong> guest name,
              accommodation and room selection, check-in and
              check-out dates, guest count, reservation code,
              booking status and amount.
            </li>

            <li>
              <strong>Payment information:</strong> payment
              reference, amount, currency, payment status and
              payment timestamps returned by our payment
              provider. Card details and security codes are
              handled by the payment provider, not stored by
              La Villa&apos;s application database.
            </li>

            <li>
              <strong>Use of the service:</strong> saved
              accommodation/favourites, reviews or comments
              you submit, and information you send to our
              support email.
            </li>

            <li>
              <strong>Technical information:</strong>
              information automatically made available by
              your browser or hosting/security services, such
              as IP address, device/browser details, request
              logs and diagnostic information.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2>2. How we use information</h2>

          <p>
            We use personal information to operate La Villa,
            create and manage accounts, authenticate users,
            process and verify reservations and payments,
            display saved stays, publish customer reviews,
            respond to enquiries, prevent fraud and abuse,
            maintain security, troubleshoot errors and meet
            legal obligations.
          </p>

          <p>
            Google account information is used only for
            account authentication, account creation or
            account linking, and to populate the corresponding
            La Villa profile fields. We do not sell Google
            user data or use it for advertising. We do not use
            Google data for purposes unrelated to the sign-in
            functionality described here.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>3. Payments</h2>

          <p>
            Payments are initiated and processed through
            Paystack or the payment service displayed during
            checkout. The payment provider processes payment
            credentials under its own terms and privacy
            policy. La Villa receives payment confirmation
            details needed to match a transaction to a
            reservation and update its status. We do not
            intentionally collect or store full payment card
            numbers or card security codes.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>4. When information is shared</h2>

          <p>
            We may share the minimum information necessary
            with service providers that help us operate the
            service, including our database and hosting
            providers, payment provider, and Google when you
            choose Google sign-in. Booking details may be
            shared with the accommodation operator to fulfil
            your reservation. We may also disclose information
            where required by law, to protect users or the
            service, or in connection with a lawful business
            transfer.
          </p>

          <p>We do not sell personal information.</p>
        </section>

        <section style={sectionStyle}>
          <h2>5. Storage, security and retention</h2>

          <p>
            Account and booking information is stored in our
            application database and service-provider systems.
            We use reasonable technical and organisational
            measures intended to protect information,
            including password hashing, access controls and
            encrypted connections where supported. No
            internet transmission or storage system can be
            guaranteed to be completely secure.
          </p>

          <p>
            We retain information for as long as reasonably
            necessary to provide the service, maintain booking
            and payment records, resolve disputes, enforce our
            terms and comply with legal requirements.
            Retention periods may vary depending on the type
            of record and applicable law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>6. Cookies and local storage</h2>

          <p>
            La Villa uses browser local storage to retain your
            application authentication token so that you can
            remain signed in while using the service. Your
            browser may also store technical data required
            for the website to function. You can clear browser
            storage through your browser settings; doing so
            may sign you out.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>7. Your choices and privacy rights</h2>

          <p>
            You may contact us to request access to,
            correction of or deletion of personal information,
            subject to identity checks, legal obligations and
            records we are required or permitted to retain.
            You can stop using Google sign-in and revoke the
            app&apos;s access through your Google Account
            security settings. Removing the app&apos;s Google
            access does not automatically delete your La Villa
            account or booking records; contact us to make an
            account or data request.
          </p>

          <p>
            Where South Africa&apos;s Protection of Personal
            Information Act (POPIA) applies, we will handle
            personal information in accordance with applicable
            requirements. You may also have the right to lodge
            a complaint with the Information Regulator of
            South Africa.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>8. Children</h2>

          <p>
            La Villa is intended for people who can legally
            make accommodation bookings. We do not knowingly
            seek to collect personal information from children
            without appropriate authorisation.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>9. Third-party services and links</h2>

          <p>
            Our website may link to third-party services,
            including Google and Paystack. Those services
            operate under their own privacy policies and
            terms. We encourage you to review their policies
            when using their services.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>10. Changes to this policy</h2>

          <p>
            We may update this Privacy Policy when our
            service or legal obligations change. The updated
            version will be published on this page with a
            revised date. Continued use of La Villa after an
            update means the revised policy will apply to
            future use, subject to applicable law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>11. Contact and responsible operator</h2>

          <p>
            <strong>Operator:</strong> Circuit Sentry,
            operating La Villa Lekker Stays.
          </p>

          <p>
            <strong>Privacy and support enquiries:</strong>{' '}
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
            to="/terms-of-service"
            style={{ color: '#1B4D3E', fontWeight: 600 }}
          >
            Read the Terms of Service →
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}