
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

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/reservations" element={<ReservationsPage />} />

      {/* Create a new accommodation */}
      <Route
        path="/admin/accommodations/new"
        element={<AddAccommodationForm />}
      />

      {/* Edit an existing accommodation */}
      <Route
        path="/admin/accommodations/:accommodationId/edit"
        element={<AddAccommodationForm />}
      />

      <Route
        path="*"
        element={
          <div style={{ padding: "50px", textAlign: "center" }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
