import './App.css';
import { Routes, Route } from 'react-router-dom';

import LandingPage from './pages/landingPage';
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { AddAccommodationForm } from './pages/AddAccommodationForm';
import EditAccommodationForm from './pages/EditAccommodationForm';
import { DiscoverStays } from './pages/DiscoverStays';
import AccommodationDetails from './pages/AccommodationDetails';
import ReservationsPage from './pages/ReservationsPage';
import BookingPage from './pages/BookingPage';
import ManageRoomTypes from './pages/ManageRoomTypes';
import FavoritesPage from './pages/FavoritePage';
import AccountPage from './pages/AccountPage';
import PaymentResultPage from './pages/PaymentResultPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/accommodations/:accommodationId"
        element={<AccommodationDetails />}
      />

      <Route
        path="/discover"
        element={<DiscoverStays />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      {/* Public legal pages */}
      <Route
        path="/privacy-policy"
        element={<PrivacyPolicyPage />}
      />

      <Route
        path="/terms-of-service"
        element={<TermsOfServicePage />}
      />

      {/* Customer account */}
      <Route
        path="/account"
        element={<AccountPage />}
      />

      <Route
        path="/favorites"
        element={<FavoritesPage />}
      />

      {/* Customer booking and payment */}
      <Route
        path="/reservations"
        element={<BookingPage />}
      />

      <Route
        path="/payment-result"
        element={<PaymentResultPage />}
      />

      {/* Admin */}
      <Route
        path="/admin/login"
        element={<AdminLoginPage />}
      />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route
        path="/admin/reservations"
        element={<ReservationsPage />}
      />

      <Route
        path="/admin/accommodations/:accommodationId/rooms"
        element={<ManageRoomTypes />}
      />

      {/* Add accommodation */}
      <Route
        path="/admin/accommodations/new"
        element={<AddAccommodationForm />}
      />

      {/* Edit existing accommodation */}
      <Route
        path="/admin/accommodations/:accommodationId/edit"
        element={<EditAccommodationForm />}
      />

      {/* Fallback */}
      <Route
        path="*"
        element={<div>404 - Page Not Found</div>}
      />
    </Routes>
  );
}

export default App;