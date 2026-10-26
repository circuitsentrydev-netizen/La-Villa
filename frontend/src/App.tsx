
import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AddAccommodationForm } from "./pages/AddAccommodationForm";
import { DiscoverStays } from "./pages/DiscoverStays";
import AccommodationDetails from "./pages/AccommodationDetails";
import ReservationsPage from "./pages/ReservationsPage";
import BookingPage from "./pages/BookingPage";
import ManageRoomTypes from "./pages/ManageRoomTypes";
import FavoritesPage from "./pages/FavoritePage";
import AccountPage from "./pages/AccountPage";
import PaymentResultPage from "./pages/PaymentResultPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/accommodations/:accommodationId"
        element={<AccommodationDetails />}
      />

      <Route path="/discover" element={<DiscoverStays />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer account */}
      <Route path="/account" element={<AccountPage />} />

      {/* Saved accommodations */}
      <Route path="/favorites" element={<FavoritesPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route
        path="/admin/reservations"
        element={<ReservationsPage />}
      />

      {/* Customer booking */}
      <Route path="/reservations" element={<BookingPage />} />
      <Route
  path="/payment-result"
  element={<PaymentResultPage />}
/>

      {/* Admin room-type management */}
      <Route
        path="/admin/accommodations/:accommodationId/rooms"
        element={<ManageRoomTypes />}
      />

      <Route
        path="/admin/accommodations/new"
        element={<AddAccommodationForm />}
      />

      <Route
        path="/admin/accommodations/:accommodationId/edit"
        element={<AddAccommodationForm />}
      />

      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
