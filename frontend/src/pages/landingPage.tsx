import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageUrl';

interface StayCard {
  id: string | number;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
  description?: string;
  images?: string[];
}

interface AccommodationResponse {
  id: string | number;
  name?: string;
  accommodation?: string;
  address?: string;
  location?: string;
  star_rating?: number | string;
  starRating?: number | string;
  price_per_night?: number | string;
  pricePerNight?: number | string;
  nightly_rate?: number | string;
  nightlyRate?: number | string;
  description?: string;
  images?: string[] | string;
  status?: string;
}

function parseImages(images?: string[] | string): string[] {
  if (Array.isArray(images)) return images;

  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed: unknown = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return [images];
    }
  }

  return [];
}

// Returns the first usable image URL, or '' if none exist.
function getFirstImage(images?: string[]): string {
  if (!images) return '';

  const first = images.find(
    (img) => typeof img === 'string' && img.trim() !== ''
  );

  return first ? getImageUrl(first) || '' : '';
}

function formatPrice(value?: number | string): string {
  if (value === undefined || value === null || value === '') {
    return 'Price on request';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return (
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2,
    }).format(amount) + ' / night'
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  const [featuredStays, setFeaturedStays] = useState<StayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check for an existing customer or admin authentication token.
  const hasToken = Boolean(
    localStorage.getItem('lavilla_token') ||
    localStorage.getItem('token')
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStays() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/accommodations?status=Published`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load accommodations (${response.status}).`
          );
        }

        const data: unknown = await response.json();

        const records: AccommodationResponse[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === 'object' &&
              'accommodations' in data &&
              Array.isArray(data.accommodations)
            ? (data.accommodations as AccommodationResponse[])
            : [];

        const stays = records
          .filter(
            (item) => !item.status || item.status === 'Published'
          )
          .map(
            (item): StayCard => ({
              id: item.id,
              accommodation:
                item.name ??
                item.accommodation ??
                'Untitled property',
              location:
                item.address ??
                item.location ??
                'Location not provided',
              starRating: Number(
                item.star_rating ?? item.starRating ?? 0
              ),
              nightlyRate: formatPrice(
                item.price_per_night ??
                  item.pricePerNight ??
                  item.nightly_rate ??
                  item.nightlyRate
              ),
              description: item.description ?? '',
              images: parseImages(item.images),
            })
          );

        setFeaturedStays(stays.slice(0, 6));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        console.error('Error loading featured stays:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading properties.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchStays();

    return () => controller.abort();
  }, []);

  const openAccommodation = (id: string | number) => {
    navigate(`/accommodations/${encodeURIComponent(String(id))}`);
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="landing-page">
      {/* Main navigation */}
      <nav className="landing-nav">
        <div>
          <strong
            className="brand-name"
            role="button"
            tabIndex={0}
            onClick={goHome}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goHome();
              }
            }}
          >
            La Villa
          </strong>

          <span className="brand-tagline">Lekker Stays</span>
        </div>

        <div className="nav-actions">
          {hasToken ? (
            <>
              <button
                type="button"
                className="sign-in-button"
                onClick={() => navigate('/favorites')}
              >
                Saved stays
              </button>

              <button
                type="button"
                className="sign-up-button"
                onClick={() => navigate('/account')}
              >
                My account
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </nav>

      {/* Hero section with background video */}
      <header className="hero-section">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        <div className="hero-overlay" />

        <div className="hero-content">
          <h1>Your next chapter starts with a stay.</h1>
          <p>A change of scene is closer than you think.</p>

          <button
            type="button"
            className="explore-button"
            onClick={() => navigate('/discover')}
          >
            Explore properties
          </button>
        </div>
      </header>

      {/* Highlights */}
      <section className="highlights-bar">
        <div>Slow Mornings</div>
        <div>Stay Connected</div>
        <div>Clear Checkout</div>
      </section>

      {/* Featured accommodations */}
      <section className="featured-section">
        <h2>Discover Stays</h2>

        {loading ? (
          <div className="listing-message">
            Loading available properties...
          </div>
        ) : error ? (
          <div
            className="listing-message error-message"
            role="alert"
          >
            {error}

            <p>
              Check that your backend server and database are running.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : featuredStays.length === 0 ? (
          <div className="listing-message">
            No properties are currently live. Sign in using your Admin
            account to publish an accommodation.
          </div>
        ) : (
          <div className="stay-grid">
            {featuredStays.map((stay) => {
              const imageSrc = getFirstImage(stay.images);

              return (
                <div
                  key={stay.id}
                  className="stay-card"
                  role="link"
                  tabIndex={0}
                  aria-label={`View details for ${stay.accommodation}`}
                  onClick={() => openAccommodation(stay.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openAccommodation(stay.id);
                    }
                  }}
                >
                  <div className="stay-card-image">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={stay.accommodation}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="stay-image-placeholder">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="stay-card-content">
                    <h3>{stay.accommodation}</h3>

                    <p className="stay-location">{stay.location}</p>

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
                        {stay.nightlyRate}
                      </span>
                    </div>

                    <span className="view-details">
                      View details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
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