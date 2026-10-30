
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageUrl';
import { HeroVideo } from '../components/HeroVideo';
import { SiteFooter } from '../components/SiteFooter';
import './LandingPage.css';

interface StayCard {
  id: string | number;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
  nightlyRateAmount: number | null;
  description: string;
  images: string[];
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
  images?: string[] | string | null;
  status?: string;
}

interface SearchFilters {
  query: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
}

const emptyFilters: SearchFilters = {
  query: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
};

function parseImages(images?: string[] | string | null): string[] {
  if (Array.isArray(images)) {
    return images.filter(
      (image): image is string =>
        typeof image === 'string' && image.trim().length > 0
    );
  }

  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed: unknown = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (image): image is string =>
            typeof image === 'string' && image.trim().length > 0
        );
      }
    } catch {
      return [images];
    }
  }

  return [];
}

function getPriceAmount(value?: number | string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function formatPrice(value?: number | string): string {
  const amount = getPriceAmount(value);

  if (amount === null) return 'Price on request';

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getFirstImage(images: string[]): string {
  const first = images.find((image) => image.trim().length > 0);
  return first ? getImageUrl(first) || '' : '';
}

export function LandingPage() {
  const navigate = useNavigate();

  const [allStays, setAllStays] = useState<StayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] =
    useState<SearchFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>(emptyFilters);
  const [hasSearched, setHasSearched] = useState(false);

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
        let records: unknown = data;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const result = data as Record<string, unknown>;
          const nested = result.data;

          if (Array.isArray(result.accommodations)) {
            records = result.accommodations;
          } else if (Array.isArray(nested)) {
            records = nested;
          } else if (nested && typeof nested === 'object') {
            const nestedData = nested as Record<string, unknown>;
            records = nestedData.accommodations ?? nestedData.results;
          } else {
            records = result.results;
          }
        }

        if (!Array.isArray(records)) {
          throw new Error(
            'The server returned an unsupported accommodations format.'
          );
        }

        const stays = (records as AccommodationResponse[])
          .filter(
            (item) =>
              !item.status ||
              item.status.toLowerCase() === 'published'
          )
          .map((item): StayCard => {
            const price =
              item.price_per_night ??
              item.pricePerNight ??
              item.nightly_rate ??
              item.nightlyRate;

            return {
              id: item.id,
              accommodation:
                item.name ?? item.accommodation ?? 'Untitled property',
              location:
                item.address ?? item.location ?? 'Location not provided',
              starRating: Number(
                item.star_rating ?? item.starRating ?? 0
              ),
              nightlyRate: formatPrice(price),
              nightlyRateAmount: getPriceAmount(price),
              description: item.description ?? '',
              images: parseImages(item.images),
            };
          });

        setAllStays(stays);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error loading accommodations:', err);
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

  const updateSearchField = (
    field: keyof SearchFilters,
    value: string
  ) => {
    setSearchFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const min = searchFilters.minPrice.trim();
    const max = searchFilters.maxPrice.trim();

    if (
      (min && (!Number.isFinite(Number(min)) || Number(min) < 0)) ||
      (max && (!Number.isFinite(Number(max)) || Number(max) < 0))
    ) {
      setError('Enter valid non-negative prices.');
      return;
    }

    if (min && max && Number(min) > Number(max)) {
      setError('Minimum price cannot be greater than maximum price.');
      return;
    }

    setError('');
    setAppliedFilters(searchFilters);
    setHasSearched(true);
  };

  const clearSearch = () => {
    setSearchFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setHasSearched(false);
    setError('');
  };

  const matchingStays = allStays.filter((stay) => {
    const query = appliedFilters.query.trim().toLowerCase();

    const matchesText =
      !query ||
      stay.accommodation.toLowerCase().includes(query) ||
      stay.location.toLowerCase().includes(query) ||
      stay.description.toLowerCase().includes(query);

    const minPrice = appliedFilters.minPrice.trim()
      ? Number(appliedFilters.minPrice)
      : null;

    const maxPrice = appliedFilters.maxPrice.trim()
      ? Number(appliedFilters.maxPrice)
      : null;

    const minRating = appliedFilters.minRating.trim()
      ? Number(appliedFilters.minRating)
      : null;

    return (
      matchesText &&
      (minPrice === null ||
        (stay.nightlyRateAmount !== null &&
          stay.nightlyRateAmount >= minPrice)) &&
      (maxPrice === null ||
        (stay.nightlyRateAmount !== null &&
          stay.nightlyRateAmount <= maxPrice)) &&
      (minRating === null || stay.starRating >= minRating)
    );
  });

  const displayedStays = hasSearched
    ? matchingStays
    : allStays.slice(0, 6);

  const openAccommodation = (id: string | number) => {
    navigate(`/accommodations/${encodeURIComponent(String(id))}`);
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <button
          type="button"
          className="brand"
          onClick={() => navigate('/')}
          aria-label="La Villa home"
        >
          <span className="brand-name">La Villa</span>
          <span className="brand-tagline">LEKKER STAYS</span>
        </button>

        <div className="nav-actions">
          {hasToken ? (
            <>
              <button
                type="button"
                className="nav-text-button"
                onClick={() => navigate('/favorites')}
              >
                Saved stays
              </button>
              <button
                type="button"
                className="nav-primary-button"
                onClick={() => navigate('/account')}
              >
                My account
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="nav-text-button"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className="nav-primary-button"
                onClick={() => navigate('/register')}
              >
                Create account
              </button>
            </>
          )}
        </div>
      </nav>

      <header className="hero-section">
        <HeroVideo />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-eyebrow">YOUR NEXT GETAWAY STARTS HERE</span>
          <h1>Your next chapter starts with a stay.</h1>
          <p>
            Discover hand-picked places to stay, from coastal escapes
            to memorable city breaks.
          </p>
          <button
            type="button"
            className="hero-button"
            onClick={() => navigate('/discover')}
          >
            Explore properties <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="hero-bottom-note">
          Thoughtful stays. Memorable moments.
        </div>
      </header>

      <section className="search-section">
        <div className="section-container">
          <div className="section-intro">
            <span className="eyebrow">FIND YOUR PLACE</span>
            <h2>Where would you like to stay?</h2>
            <p>
              Refine your search to find a stay that suits your plans
              and budget.
            </p>
          </div>

          <form className="search-panel" onSubmit={submitSearch}>
            <label className="search-field">
              <span>Destination or property</span>
              <input
                type="search"
                value={searchFilters.query}
                onChange={(event) =>
                  updateSearchField('query', event.target.value)
                }
                placeholder="City, area or property"
              />
            </label>

            <label className="search-field">
              <span>Minimum price</span>
              <input
                type="number"
                min="0"
                step="1"
                value={searchFilters.minPrice}
                onChange={(event) =>
                  updateSearchField('minPrice', event.target.value)
                }
                placeholder="Any price"
              />
            </label>

            <label className="search-field">
              <span>Maximum price</span>
              <input
                type="number"
                min="0"
                step="1"
                value={searchFilters.maxPrice}
                onChange={(event) =>
                  updateSearchField('maxPrice', event.target.value)
                }
                placeholder="Any price"
              />
            </label>

            <label className="search-field">
              <span>Minimum rating</span>
              <select
                value={searchFilters.minRating}
                onChange={(event) =>
                  updateSearchField('minRating', event.target.value)
                }
              >
                <option value="">Any rating</option>
                <option value="1">1+ stars</option>
                <option value="2">2+ stars</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </select>
            </label>

            <div className="search-actions">
              <button className="search-submit" type="submit">
                Search stays
              </button>
              <button
                className="search-clear"
                type="button"
                onClick={clearSearch}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="featured-section" id="discover-stays">
        <div className="section-container">
          <div className="featured-heading">
            <div>
              <span className="eyebrow">
                {hasSearched ? 'YOUR SEARCH' : 'A PLACE TO CALL YOUR OWN'}
              </span>
              <h2>
                {hasSearched ? 'Search results' : 'Discover stays'}
              </h2>
              <p>
                {hasSearched
                  ? 'Explore the properties that match your filters.'
                  : 'Explore inviting places for your next escape.'}
              </p>
            </div>

            {!hasSearched && !loading && allStays.length > 0 && (
              <button
                type="button"
                className="view-all-button"
                onClick={() => navigate('/discover')}
              >
                View all stays <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          {hasSearched && !loading && !error && (
            <p className="results-count">
              {matchingStays.length}{' '}
              {matchingStays.length === 1 ? 'property' : 'properties'} found
            </p>
          )}

          {loading ? (
            <div className="listing-message">
              <span className="loading-spinner" />
              <p>Finding your next stay...</p>
            </div>
          ) : error ? (
            <div className="listing-message error-message" role="alert">
              <h3>We couldn't load the stays</h3>
              <p>{error}</p>
              <button
                type="button"
                className="nav-primary-button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : displayedStays.length === 0 ? (
            <div className="listing-message empty-message">
              <span className="empty-icon" aria-hidden="true">⌂</span>
              <h3>
                {hasSearched ? 'No matching stays' : 'New stays are on the way'}
              </h3>
              <p>
                {hasSearched
                  ? 'Try adjusting your filters or searching for another destination.'
                  : 'We are preparing the next collection of places for you to explore.'}
              </p>
              {hasSearched ? (
                <button
                  type="button"
                  className="nav-primary-button"
                  onClick={clearSearch}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="nav-primary-button"
                  onClick={() => navigate('/discover')}
                >
                  Explore stays
                </button>
              )}
            </div>
          ) : (
            <div className="stay-grid">
              {displayedStays.map((stay) => {
                const imageSrc = getFirstImage(stay.images);

                return (
                  <article
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
                          <span aria-hidden="true">⌂</span>
                          <span>Image coming soon</span>
                        </div>
                      )}
                      <span className="stay-category">La Villa selection</span>
                    </div>

                    <div className="stay-card-content">
                      <div className="stay-card-title-row">
                        <h3>{stay.accommodation}</h3>
                        <span className="stay-rating">
                          <span aria-hidden="true">★</span>{' '}
                          {stay.starRating > 0
                            ? stay.starRating
                            : 'New'}
                        </span>
                      </div>

                      <p className="stay-location">
                        <span aria-hidden="true">⌖</span>
                        {stay.location}
                      </p>

                      <p className="stay-description">
                        {stay.description
                          ? stay.description.length > 105
                            ? `${stay.description.slice(0, 105).trim()}…`
                            : stay.description
                          : 'Discover this property and explore the amenities available for your stay.'}
                      </p>

                      <div className="stay-card-bottom">
                        <div className="price-block">
                          <span className="price-label">Starting from</span>
                          <p className="stay-price">
                            {stay.nightlyRate}
                            {stay.nightlyRateAmount !== null && (
                              <span> / night</span>
                            )}
                          </p>
                        </div>
                        <span className="stay-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="eyebrow">MAKE TIME FOR YOURSELF</span>
          <h2>A change of scene can change everything.</h2>
          <p>Your next memorable stay is waiting to be discovered.</p>
        </div>
        <button
          type="button"
          className="cta-button"
          onClick={() => navigate('/discover')}
        >
          Find your stay <span aria-hidden="true">→</span>
        </button>
      </section>

      <SiteFooter isSignedIn={hasToken} />
    </div>
  );
}

export default LandingPage;
