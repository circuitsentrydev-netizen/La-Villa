import { useNavigate } from 'react-router-dom';
import './SiteFooter.css';

interface SiteFooterProps {
  isSignedIn?: boolean;
}

export function SiteFooter({ isSignedIn = false }: SiteFooterProps) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong className="site-footer-logo">La Villa</strong>
          <span className="site-footer-tagline">Lekker Stays</span>
          <p>
            Hand-picked places to stay across South Africa, with clear
            pricing and secure payment at checkout.
          </p>
        </div>

        <nav className="site-footer-column" aria-label="Explore">
          <h4>Explore</h4>
          <button type="button" onClick={() => navigate('/')}>
            Home
          </button>
          <button type="button" onClick={() => navigate('/discover')}>
            Discover stays
          </button>
          <button type="button" onClick={() => navigate('/favorites')}>
            Saved stays
          </button>
        </nav>

        <nav className="site-footer-column" aria-label="Account">
          <h4>Account</h4>
          {isSignedIn ? (
            <button type="button" onClick={() => navigate('/account')}>
              My account
            </button>
          ) : (
            <>
              <button type="button" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button type="button" onClick={() => navigate('/register')}>
                Sign up
              </button>
            </>
          )}
        </nav>

        <div className="site-footer-column">
          <h4>Contact</h4>
          {/* TODO: replace with your real contact details */}
          <a href="mailto:hello@lavilla.co.za">hello@lavilla.co.za</a>
          <span>Durban, South Africa</span>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} La Villa Stays. All rights reserved.</span>

        <div className="site-footer-legal">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;