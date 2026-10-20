
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageUrl';

interface StayCard {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
  description?: string;
  images?: string[];
}

export function LandingPage() {
  const navigate = useNavigate();

  const [featuredStays, setFeaturedStays] = useState<StayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStays = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`
        );

        if (!response.ok) {
          throw new Error('Unable to load accommodations.');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('The server returned an unexpected response.');
        }

        setFeaturedStays(data.slice(0, 3));
      } catch (err) {
        console.error('Error loading featured stays:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading properties.'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchStays();
  }, []);

  const openAccommodation = (id: string) => {
    navigate(`/accommodations/${encodeURIComponent(id)}`);
  };

  return (
    <div className="landing-page">

      {/* TOP NAVIGATION */}
      <nav className="landing-nav">
        <div>
          <strong
            className="brand-name"
            onClick={() => navigate('/')}
          >
            La Villa
          </strong>

          <span className="brand-tagline">Lekker Stays</span>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="sign-in-button"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>

          <button
            type="button"
            className="sign-up-button"
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>Your next chapter starts with a stay.</h1>

          <p>
            A change of scene is closer than you think.
          </p>

          <button
            type="button"
            className="explore-button"
            onClick={() => navigate('/discover')}
          >
            Explore properties
          </button>
        </div>
      </header>

      {/* HIGHLIGHTS */}
      <section className="highlights-bar">
        <div>Slow Mornings</div>
        <div>Stay Connected</div>
        <div>Clear Checkout</div>
      </section>

      {/* FEATURED ACCOMMODATIONS */}
      <section className="featured-section">
        <h2>Discover Stays</h2>

        {loading ? (
          <div className="listing-message">
            Loading available properties...
          </div>
        ) : error ? (
          <div className="listing-message error-message">
            {error}
            <p>
              Check that your backend server is running and try again.
            </p>
          </div>
        ) : featuredStays.length === 0 ? (
          <div className="listing-message">
            No properties are currently live. Sign in using your Admin
            account to upload your first accommodation.
          </div>
        ) : (
          <div className="stay-grid">
            {featuredStays.map((stay) => (
              <div
                key={stay.id}
                className="stay-card"
                role="link"
                tabIndex={0}
                aria-label={`View details for ${stay.accommodation}`}
                onClick={() => openAccommodation(stay.id)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();
                    openAccommodation(stay.id);
                  }
                }}
              >
                {/* ACCOMMODATION IMAGE */}
                <div className="stay-card-image">
                  {stay.images && stay.images.length > 0 ? (
                    <img
                      src={getImageUrl(stay.images[0])}
                      alt={stay.accommodation}
                      loading="lazy"
                      onError={(event) => {
                        console.error(
                          'Failed to load accommodation image:',
                          event.currentTarget.src
                        );
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="stay-image-placeholder">
                      No image available
                    </div>
                  )}
                </div>

                {/* ACCOMMODATION INFORMATION */}
                <div className="stay-card-content">
                  <h3>{stay.accommodation || 'Untitled property'}</h3>

                  <p className="stay-location">
                    {stay.location || 'Location not provided'}
                  </p>

                  {stay.description && (
                    <p className="stay-description">
                      {stay.description.length > 100
                        ? `${stay.description.slice(0, 100)}...`
                        : stay.description}
                    </p>
                  )}

                  <div className="stay-card-footer">
                    <span className="stay-rating">
                      ★ {stay.starRating || 'Unrated'}
                    </span>

                    <span className="stay-price">
                      {stay.nightlyRate || 'Price on request'}
                    </span>
                  </div>

                  <span className="view-details">
                    View details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <span>© 2026 La Villa Stays. All rights reserved.</span>

          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
