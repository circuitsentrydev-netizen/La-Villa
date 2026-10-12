import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  starRating: number;
  pricePerNight: number;
  images: string[];
  facilities: string[];
  policies: string[];
  lat: number;
  lng: number;
}

interface Booking {
  id: string;
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  status: 'pending' | 'approved' | 'cancelled';
}

interface HotelState {
  listings: Accommodation[];
  selectedListing: Accommodation | null;
  userBookings: Booking[];
  favorites: string[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelState = {
  listings: [],
  selectedListing: null,
  userBookings: [],
  favorites: [],
  loading: false,
  error: null,
};

export const fetchAccommodations = createAsyncThunk(
  'hotel/fetchAccommodations', 
  async (filters: any, thunkAPI) => {
    try {
      let url = '/api/accommodations';
      if (filters) {
        const queryParams = new URLSearchParams(filters).toString();
        url += `?${queryParams}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch accommodations');
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createBooking = createAsyncThunk(
  'hotel/createBooking',
  async (bookingData: Omit<Booking, 'id' | 'status'>, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) throw new Error('Booking transaction failed');
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const hotelSlice = createSlice({
  name: 'hotel',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
      } else {
        state.favorites.push(id);
      }
    },
    setSelectedListing: (state, action: PayloadAction<Accommodation>) => {
      state.selectedListing = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccommodations.pending, (state) => { state.loading = true; })
      .addCase(fetchAccommodations.fulfilled, (state, action: PayloadAction<Accommodation[]>) => {
        state.loading = false;
        state.listings = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.userBookings.push(action.payload);
      });
  },
});

export const { toggleFavorite, setSelectedListing } = hotelSlice.actions;
export default hotelSlice.reducer;
