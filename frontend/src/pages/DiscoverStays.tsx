
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageUrl';
import { Link } from 'react-router-dom';

interface Stay {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string | number;
  status: string;
  description?: string;
  images?: string[] | string;
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
  status?: string;
  description?: string;
  images?: string[] | string;
}

export function DiscoverStays() {
  const navigate = useNavigate();
  const [stays, setStays] = useState<Stay[]>([]);
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
      throw new Error(`Unable to load accommodations (${response.status}).`);
    }

    const data: unknown = await response.json();

    // Support common API response structures.
    let records: unknown = data;

    if (!Array.isArray(records) && records && typeof records === 'object') {
      const result = records as Record<string, unknown>;
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
      console.error('Unexpected accommodations API response:', data);
      throw new Error('The server returned an unsupported accommodations format.');
    }

    const normalized: Stay[] = (records as AccommodationResponse[])
      .filter((item) =>
        !item.status || item.status.toLowerCase() === 'published'
      )
      .map((item) => ({
        id: String(item.id),
        accommodation: item.name ?? item.accommodation ?? 'Untitled property',
        location: item.address ?? item.location ?? 'Location not provided',
        starRating: Number(item.star_rating ?? item.starRating ?? 0),
        nightlyRate:
          item.price_per_night ??
          item.pricePerNight ??
          item.nightly_rate ??
          item.nightlyRate ??
          '',
        status: item.status ?? 'Published',
        description: item.description ?? '',
        images: item.images,
      }));

    setStays(normalized);
  } catch (err) {
    console.error('Error loading accommodations:', err);
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to load accommodations. Please try again.'
    );
  } finally {
    setLoading(false); 
      }
    };

    void fetchStays();
  }, []);

  const getImages = (images?: string[] | string): string[] => {
    if (Array.isArray(images)) {
      return images.filter(
        (image): image is string => typeof image === 'string' && image.trim() !== ''
      );
    }

    if (typeof images === 'string' && images.trim()) {
      try {
        const parsed: unknown = JSON.parse(images);

        if (Array.isArray(parsed)) {
          return parsed.filter(
            (image): image is string =>
              typeof image === 'string' && image.trim() !== ''
          );
        }

        if (typeof parsed === 'string' && parsed.trim()) {
          return [parsed];
        }
      } catch {
        return [images];
      }
    }

    return [];
  };

  return (
    <div
      style={{
        background: '#FAF9F6',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        padding: '40px',
      }}
    >
      <header
        style={{
          maxWidth: '1200px',
          margin: '0 auto 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <strong
            style={{
              color: '#1B4D3E',
              fontSize: '26px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            La Villa
          </strong>

          <p
            style={{
              margin: '4px 0 0',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            All available accommodations posted live from the backoffice portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: '1px solid #cbd5e1',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#475569',
          }}
        >
          ← Back to Home
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#64748b',
            }}
          >
            Loading available properties...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        ) : stays.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              color: '#64748b',
            }}
          >
            No published accommodations are currently available.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '30px',
            }}
          >
            {stays.map((stay) => {
              const images = getImages(stay.images);

              return (
                <article
                  key={stay.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    navigate(
                      `/accommodations/${encodeURIComponent(stay.id)}`
                    )
                  }
                >
                  {/* ACCOMMODATION IMAGE */}
                  <div
                    style={{
                      height: '200px',
                      backgroundColor: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    {images.length > 0 ? (
                      <img
                        src={getImageUrl(images[0])}
                        alt={stay.accommodation || 'Accommodation'}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(event) => {
                          console.error(
                            'Failed to load accommodation image:',
                            event.currentTarget.src
                          );
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          fontSize: '14px',
                        }}
                      >
                        No image available
                      </div>
                    )}
                  </div>

                  {/* ACCOMMODATION DETAILS */}
                  <div style={{ padding: '20px' }}>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {stay.accommodation || 'Untitled property'}
                    </h3>

                    <p
                      style={{
                        margin: '0 0 12px',
                        fontSize: '14px',
                        color: '#64748b',
                      }}
                    >
                      {stay.location || 'Location not provided'}
                    </p>

                    {stay.description && (
                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          color: '#475569',
                        }}
                      >
                        {stay.description.length > 120
                          ? `${stay.description.slice(0, 120)}...`
                          : stay.description}
                      </p>
                    
                    )}
                     </div>
                     
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #F1F5F9',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ color: '#f59e0b' }}>
                        ★ {stay.starRating || 'Unrated'}
                      </span>

                      <strong
                        style={{
                          color: '#1B4D3E',
                          fontSize: '16px',
               }}
                >
                 {stay.nightlyRate !== '' &&
             stay.nightlyRate !== null &&
             stay.nightlyRate !== undefined
              ? `R ${stay.nightlyRate}`
                 : 'Price on request'}
                  </strong>
             </div>

              
              <div
             style={{
               margin: "16px 0 0",
    color: "#1B4D3E",
    fontSize: "13px",
    fontWeight: 700,
  }}
>
  <Link
    to={`/accommodations/${stay.id}`}
    style={{
      color: "#1B4D3E",
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    View details →
  </Link>
</div>
       </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default DiscoverStays;
