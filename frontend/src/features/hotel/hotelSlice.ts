
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../../config/api";

const accommodationsUrl = `${API_BASE_URL}/accommodations`;
const reservationsUrl = `${API_BASE_URL}/reservations`;

export interface Accommodation {
  id: number | string;
  name?: string;
  address?: string;
  price_per_night?: number | string;
  star_rating?: number | string;
  status?: "Draft" | "Published" | string;
  description?: string;
  images?: string[] | string | null;
  facilities?: string[] | string;
  policies?: string[] | string;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
}

interface HotelState {
  listings: Accommodation[];
  selectedListing: Accommodation | null;
  bookings: unknown[];
  favorites: Array<string | number>;
  loading: boolean;
  error: string | null;
}

const initialState: HotelState = {
  listings: [],
  selectedListing: null,
  bookings: [],
  favorites: [],
  loading: false,
  error: null,
};

function getToken(): string | null {
  return localStorage.getItem("lavilla_token") ?? localStorage.getItem("token");
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error ?? data.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export const fetchAccommodations = createAsyncThunk<
  Accommodation[],
  { search?: string; status?: string } | undefined,
  { rejectValue: string }
>(
  "hotel/fetchAccommodations",
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);

      const query = params.toString();
      const url = query ? `${accommodationsUrl}?${query}` : accommodationsUrl;

      const response = await fetch(url);

      if (!response.ok) {
        return rejectWithValue(await getErrorMessage(response));
      }

      const data: unknown = await response.json();

      if (Array.isArray(data)) {
        return data as Accommodation[];
      }

      if (
        data !== null &&
        typeof data === "object" &&
        "accommodations" in data &&
        Array.isArray(data.accommodations)
      ) {
        return data.accommodations as Accommodation[];
      }

      return rejectWithValue("The server returned an invalid accommodation list.");
    } catch {
      return rejectWithValue("Could not connect to the accommodation server.");
    }
  }
);

export const createBooking = createAsyncThunk<
  unknown,
  Record<string, unknown>,
  { rejectValue: string }
>(
  "hotel/createBooking",
  async (booking, { rejectWithValue }) => {
    try {
      const token = getToken();

      const response = await fetch(reservationsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        return rejectWithValue(await getErrorMessage(response));
      }

      return await response.json();
    } catch {
      return rejectWithValue("Could not create the reservation.");
    }
  }
);

const hotelSlice = createSlice({
  name: "hotel",
  initialState,
  reducers: {
    setSelectedListing(state, action: PayloadAction<Accommodation | null>) {
      state.selectedListing = action.payload;
    },
    clearSelectedListing(state) {
      state.selectedListing = null;
    },
    toggleFavorite(state, action: PayloadAction<string | number>) {
      const index = state.favorites.indexOf(action.payload);

      if (index >= 0) {
        state.favorites.splice(index, 1);
      } else {
        state.favorites.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccommodations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccommodations.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload;
      })
      .addCase(fetchAccommodations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load accommodations.";
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.bookings.push(action.payload);
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create the reservation.";
      });
  },
});

export const {
  setSelectedListing,
  clearSelectedListing,
  toggleFavorite,
} = hotelSlice.actions;

export default hotelSlice.reducer;
