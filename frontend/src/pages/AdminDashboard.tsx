import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { logout } from "../features/auth/authSlice";
import type { RootState } from "../app/store";
import "./AdminDashboard.css";

interface Accommodation {
  id: string;
  name: string;
  address: string;
  price_per_night: string | number;
  star_rating: number;
  status: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: "ADMIN" | "USER" | string;
  is_active: boolean;
  created_at: string;
}

type DashboardTab =
  | "overview"
  | "accommodations"
  | "customers"
  | "administrators"
  | "profile";

const token = () =>
  localStorage.getItem("lavilla_token") || localStorage.getItem("token");

const authHeaders = (): Record<string, string> => {
  const activeToken = token();
  return activeToken
    ? { Authorization: `Bearer ${activeToken}` }
    : {};
};

const money = (price: string | number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const getErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const data = await response.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth?.user);

  const [tab, setTab] = useState<DashboardTab>("overview");
  const [hotels, setHotels] = useState<Accommodation[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const currentUserName =
    user && "name" in user
      ? String(user.name || "Administrator")
      : "Administrator";

  const currentUserEmail =
    user && "email" in user ? String(user.email || "") : "";

  const currentUserId =
    user && "id" in user ? String(user.id || "") : "";

  const fetchHotels = useCallback(async () => {
    setLoadingHotels(true);

    try {
      const response = await fetch(`${API_BASE_URL}/accommodations`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to load accommodations."
          )
        );
      }

      const data = await response.json();

      const accommodationList = Array.isArray(data)
        ? data
        : data?.data?.accommodations ||
          data?.accommodations ||
          data?.data ||
          [];

      setHotels(
        Array.isArray(accommodationList) ? accommodationList : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load accommodations."
      );
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to load registered users."
          )
        );
      }

      const data = await response.json();
      const userList = Array.isArray(data)
        ? data
        : data?.users || data?.data?.users || [];

      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load registered users."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void fetchHotels();
    void fetchUsers();
  }, [fetchHotels, fetchUsers]);

  const customers = useMemo(
    () =>
      users.filter(
        (item) => String(item.role).toUpperCase() === "USER"
      ),
    [users]
  );

  const administrators = useMemo(
    () =>
      users.filter(
        (item) => String(item.role).toUpperCase() === "ADMIN"
      ),
    [users]
  );

  const activeCustomers = customers.filter(
    (item) => item.is_active
  ).length;

  const activeAdministrators = administrators.filter(
    (item) => item.is_active
  ).length;

  const published = hotels.filter(
    (hotel) => hotel.status?.toLowerCase() === "published"
  );

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const deleteHotel = async (hotel: Accommodation) => {
    if (
      !window.confirm(
        `Delete "${hotel.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    clearMessages();

    try {
      const response = await fetch(
        `${API_BASE_URL}/accommodations/${encodeURIComponent(hotel.id)}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete accommodation."
          )
        );
      }

      setSuccess("Accommodation deleted successfully.");
      await fetchHotels();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete accommodation."
      );
    }
  };

  const manageRoomTypes = (hotel: Accommodation) => {
    navigate(
      `/admin/accommodations/${encodeURIComponent(hotel.id)}/rooms`
    );
  };

  const updateAccountStatus = async (account: AdminUser) => {
    const nextStatus = !account.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${account.name}'s account?`
      )
    ) {
      return;
    }

    clearMessages();
    setUpdatingUserId(account.id);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${encodeURIComponent(
          account.id
        )}/status`,
        {
          method: "PATCH",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: nextStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to update this account."
          )
        );
      }

      setSuccess(
        `${account.name}'s account has been ${
          nextStatus ? "activated" : "deactivated"
        }.`
      );

      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account status."
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  const createAdministrator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();

    if (!name || !email || !adminForm.password) {
      setError("Please complete all administrator account fields.");
      return;
    }

    if (adminForm.password.length < 8) {
      setError("The administrator password must contain at least 8 characters.");
      return;
    }

    setSavingAdmin(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/admins`,
        {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password: adminForm.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to create administrator account."
          )
        );
      }

      setAdminForm({
        name: "",
        email: "",
        password: "",
      });

      setSuccess("Administrator account created successfully.");
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create administrator account."
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("lavilla_token");
    localStorage.removeItem("token");
    dispatch(logout());
    navigate("/admin/login");
  };

  const refreshCurrentTab = () => {
    clearMessages();

    if (tab === "accommodations" || tab === "overview") {
      void fetchHotels();
    }

    if (
      tab === "customers" ||
      tab === "administrators" ||
      tab === "overview"
    ) {
      void fetchUsers();
    }
  };

  const tabTitle: Record<DashboardTab, string> = {
    overview: "Overview",
    accommodations: "Accommodations Inventory",
    customers: "Customer Management",
    administrators: "Administrator Management",
    profile: "Admin Profile",
  };

  const tabDescription: Record<DashboardTab, string> = {
    overview: "Manage your properties and monitor your platform.",
    accommodations: "Edit, review, and manage your property listings.",
    customers: "View registered customers and manage account access.",
    administrators: "Manage administrator accounts and permissions.",
    profile: "View your administrator account information.",
  };

  const renderAccountsTable = (
    accountList: AdminUser[],
    accountType: "customer" | "administrator"
  ) => {
    if (loadingUsers) {
      return (
        <div className="admin-inline-state">
          Loading registered accounts…
        </div>
      );
    }

    if (accountList.length === 0) {
      return (
        <div className="admin-empty-state">
          <span className="admin-empty-icon">♙</span>
          <h3>No {accountType === "customer" ? "customers" : "administrators"} found</h3>
          <p>
            {accountType === "customer"
              ? "Registered customer accounts will appear here."
              : "Administrator accounts will appear here."}
          </p>
        </div>
      );
    }

    return (
      <div className="admin-table-wrap">
        <table className="admin-table admin-account-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Email address</th>
              <th>Account type</th>
              <th>Date registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {accountList.map((account) => (
              <tr key={account.id}>
                <td>
                  <div className="admin-account-cell">
                    {account.avatar ? (
                      <img
                        className="admin-account-avatar"
                        src={account.avatar}
                        alt=""
                      />
                    ) : (
                      <span className="admin-account-avatar admin-account-avatar-fallback">
                        {account.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}

                    <strong>{account.name}</strong>
                  </div>
                </td>

                <td>
                  <span className="admin-address-cell">
                    {account.email}
                  </span>
                </td>

                <td>
                  <span className="admin-role-pill">
                    {String(account.role).toUpperCase()}
                  </span>
                </td>

                <td>{formatDate(account.created_at)}</td>

                <td>
                  <span
                    className={`admin-status-pill ${
                      account.is_active
                        ? "status-published"
                        : "status-other"
                    }`}
                  >
                    <span className="admin-status-indicator" />
                    {account.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className={
                      account.is_active
                        ? "admin-delete-button"
                        : "admin-activate-button"
                    }
                    disabled={
                      updatingUserId === account.id ||
                      (account.id === currentUserId &&
                        account.is_active)
                    }
                    onClick={() => void updateAccountStatus(account)}
                    title={
                      account.id === currentUserId
                        ? "You cannot deactivate your own account."
                        : undefined
                    }
                  >
                    {updatingUserId === account.id
                      ? "Updating…"
                      : account.is_active
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">LV</span>
          <span className="admin-brand-copy">
            <strong>La Villa</strong>
            <small>ADMINISTRATION</small>
          </span>
        </div>

        <div className="admin-nav-label">WORKSPACE</div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${
              tab === "overview" ? "is-active" : ""
            }`}
            onClick={() => setTab("overview")}
          >
            <span className="admin-nav-icon">⌂</span>
            Overview
          </button>

          <button
            className={`admin-nav-item ${
              tab === "accommodations" ? "is-active" : ""
            }`}
            onClick={() => setTab("accommodations")}
          >
            <span className="admin-nav-icon">▤</span>
            Accommodations
            <span className="admin-nav-count">{hotels.length}</span>
          </button>

          <button
            className={`admin-nav-item ${
              tab === "customers" ? "is-active" : ""
            }`}
            onClick={() => setTab("customers")}
          >
            <span className="admin-nav-icon">♙</span>
            Customers
            <span className="admin-nav-count">{customers.length}</span>
          </button>

          <button
            className={`admin-nav-item ${
              tab === "administrators" ? "is-active" : ""
            }`}
            onClick={() => setTab("administrators")}
          >
            <span className="admin-nav-icon">♜</span>
            Administrators
            <span className="admin-nav-count">
              {administrators.length}
            </span>
          </button>

          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/reservations")}
          >
            <span className="admin-nav-icon">▣</span>
            Manage Reservations
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            className={`admin-nav-item admin-profile-link ${
              tab === "profile" ? "is-active" : ""
            }`}
            onClick={() => setTab("profile")}
          >
            <span className="admin-nav-icon">⚙</span>
            Admin Profile
          </button>

          <div className="admin-user-card">
            <span className="admin-avatar">
              {currentUserName.charAt(0).toUpperCase()}
            </span>

            <span className="admin-user-copy">
              <strong>{currentUserName}</strong>
              <small>Administrator</small>
            </span>
          </div>

          <button className="admin-signout" onClick={signOut}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            La Villa <span>/</span>{" "}
            <strong>{tabTitle[tab]}</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status-dot" />
            Admin workspace
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">PROPERTY MANAGEMENT</p>
              <h1>{tab === "overview" ? "Operational Snapshot" : tabTitle[tab]}</h1>
              <p className="admin-subtitle">{tabDescription[tab]}</p>
            </div>

            {tab === "accommodations" || tab === "overview" ? (
              <button
                className="admin-primary-button"
                onClick={() => navigate("/admin/accommodations/new")}
              >
                ＋ Add accommodation
              </button>
            ) : null}
          </section>

          {error && (
            <div className="admin-alert" role="alert">
              <span>{error}</span>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="admin-success-alert" role="status">
              <span>{success}</span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setSuccess("")}
              >
                ×
              </button>
            </div>
          )}

          {tab === "overview" && (
            <>
              <section className="admin-stats-grid">
                <article className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">
                      Total accommodations
                    </span>
                    <span className="admin-stat-icon">⌂</span>
                  </div>
                  <strong className="admin-stat-value">
                    {loadingHotels ? "—" : hotels.length}
                  </strong>
                  <span className="admin-stat-note">
                    All property listings
                  </span>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">
                      Published listings
                    </span>
                    <span className="admin-stat-icon">✓</span>
                  </div>
                  <strong className="admin-stat-value">
                    {loadingHotels ? "—" : published.length}
                  </strong>
                  <span className="admin-stat-note">
                    Visible to customers
                  </span>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">
                      Registered customers
                    </span>
                    <span className="admin-stat-icon">♙</span>
                  </div>
                  <strong className="admin-stat-value">
                    {loadingUsers ? "—" : customers.length}
                  </strong>
                  <span className="admin-stat-note">
                    {activeCustomers} active customer accounts
                  </span>
                </article>

                <article className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">
                      Administrators
                    </span>
                    <span className="admin-stat-icon">♜</span>
                  </div>
                  <strong className="admin-stat-value">
                    {loadingUsers ? "—" : administrators.length}
                  </strong>
                  <span className="admin-stat-note">
                    {activeAdministrators} active administrators
                  </span>
                </article>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Recent accommodations</h2>
                    <p>Manage your uploaded property listings.</p>
                  </div>

                  <button
                    className="admin-secondary-button"
                    onClick={() => setTab("accommodations")}
                  >
                    View inventory →
                  </button>
                </div>

                {loadingHotels ? (
                  <div className="admin-inline-state">
                    Loading accommodations…
                  </div>
                ) : hotels.length === 0 ? (
                  <div className="admin-empty-state">
                    <span className="admin-empty-icon">⌂</span>
                    <h3>No accommodations found</h3>
                    <p>Add a property to see it in your inventory.</p>
                    <button
                      className="admin-primary-button"
                      onClick={() =>
                        navigate("/admin/accommodations/new")
                      }
                    >
                      Add accommodation
                    </button>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Accommodation</th>
                          <th>Address</th>
                          <th>Rating</th>
                          <th>Price per night</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hotels.slice(0, 4).map((hotel) => (
                          <tr key={hotel.id}>
                            <td>
                              <div className="admin-table-property">
                                <span className="admin-table-property-icon">
                                  ⌂
                                </span>
                                <span className="admin-table-property-name">
                                  {hotel.name}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="admin-address-cell">
                                {hotel.address || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="admin-rating">
                                ★ {hotel.star_rating ?? "—"}
                              </span>
                            </td>
                            <td>
                              <strong className="admin-price-cell">
                                {money(hotel.price_per_night)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`admin-status-pill ${
                                  hotel.status?.toLowerCase() === "published"
                                    ? "status-published"
                                    : "status-other"
                                }`}
                              >
                                <span className="admin-status-indicator" />
                                {hotel.status || "Unspecified"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="admin-panel-footer">
                  <span>{hotels.length} accommodations</span>
                  <span>La Villa property management</span>
                </div>
              </section>
            </>
          )}

          {tab === "accommodations" && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>All accommodations ({hotels.length})</h2>
                  <p>Edit, review, and manage your property listings.</p>
                </div>
                <button
                  className="admin-secondary-button"
                  disabled={loadingHotels}
                  onClick={() => void fetchHotels()}
                >
                  {loadingHotels ? "Refreshing…" : "↻ Refresh"}
                </button>
              </div>

              {loadingHotels ? (
                <div className="admin-inline-state">
                  Loading accommodations…
                </div>
              ) : hotels.length === 0 ? (
                <div className="admin-empty-state">
                  <span className="admin-empty-icon">⌂</span>
                  <h3>No accommodations found</h3>
                  <p>Add a property to see it in your inventory.</p>
                  <button
                    className="admin-primary-button"
                    onClick={() =>
                      navigate("/admin/accommodations/new")
                    }
                  >
                    Add accommodation
                  </button>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Accommodation</th>
                        <th>Address</th>
                        <th>Rating</th>
                        <th>Price per night</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((hotel) => (
                        <tr key={hotel.id}>
                          <td>
                            <div className="admin-table-property">
                              <span className="admin-table-property-icon">
                                ⌂
                              </span>
                              <span className="admin-table-property-name">
                                {hotel.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-address-cell">
                              {hotel.address || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="admin-rating">
                              ★ {hotel.star_rating ?? "—"}
                            </span>
                          </td>
                          <td>
                            <strong className="admin-price-cell">
                              {money(hotel.price_per_night)}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`admin-status-pill ${
                                hotel.status?.toLowerCase() === "published"
                                  ? "status-published"
                                  : "status-other"
                              }`}
                            >
                              <span className="admin-status-indicator" />
                              {hotel.status || "Unspecified"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="admin-edit-button"
                                onClick={() =>
                                  navigate(
                                    `/admin/accommodations/${encodeURIComponent(
                                      hotel.id
                                    )}/edit`
                                  )
                                }
                              >
                                ✎ Edit
                              </button>
                              <button
                                type="button"
                                className="admin-room-button"
                                onClick={() => manageRoomTypes(hotel)}
                              >
                                Manage rooms
                              </button>
                              <button
                                type="button"
                                className="admin-delete-button"
                                onClick={() => void deleteHotel(hotel)}
                              >
                                × Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-panel-footer">
                <span>{hotels.length} accommodations</span>
                <span>La Villa property management</span>
              </div>
            </section>
          )}

          {tab === "customers" && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Registered customers ({customers.length})</h2>
                  <p>
                    Activate or deactivate customer access. Deactivated
                    accounts are retained in your database.
                  </p>
                </div>
                <button
                  className="admin-secondary-button"
                  disabled={loadingUsers}
                  onClick={() => void fetchUsers()}
                >
                  {loadingUsers ? "Refreshing…" : "↻ Refresh"}
                </button>
              </div>

              {renderAccountsTable(customers, "customer")}

              <div className="admin-panel-footer">
                <span>{activeCustomers} active customers</span>
                <span>{customers.length - activeCustomers} inactive</span>
              </div>
            </section>
          )}

          {tab === "administrators" && (
            <div className="admin-management-layout">
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Administrator accounts ({administrators.length})</h2>
                    <p>
                      Manage who has access to the La Villa administration
                      workspace.
                    </p>
                  </div>
                  <button
                    className="admin-secondary-button"
                    disabled={loadingUsers}
                    onClick={() => void fetchUsers()}
                  >
                    {loadingUsers ? "Refreshing…" : "↻ Refresh"}
                  </button>
                </div>

                {renderAccountsTable(administrators, "administrator")}

                <div className="admin-panel-footer">
                  <span>{activeAdministrators} active administrators</span>
                  <span>
                    {administrators.length - activeAdministrators} inactive
                  </span>
                </div>
              </section>

              <section className="admin-panel admin-create-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Add administrator</h2>
                    <p>
                      Create an account with administrator access.
                    </p>
                  </div>
                </div>

                <form
                  className="admin-create-form"
                  onSubmit={createAdministrator}
                >
                  <label htmlFor="admin-name">Full name</label>
                  <input
                    id="admin-name"
                    type="text"
                    value={adminForm.name}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Enter full name"
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />

                  <label htmlFor="admin-email">Email address</label>
                  <input
                    id="admin-email"
                    type="email"
                    value={adminForm.email}
                    maxLength={254}
                    autoComplete="email"
                    placeholder="admin@example.com"
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                  />

                  <label htmlFor="admin-password">Temporary password</label>
                  <input
                    id="admin-password"
                    type="password"
                    value={adminForm.password}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    onChange={(event) =>
                      setAdminForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required
                  />

                  <p className="admin-form-note">
                    The new administrator can use these credentials to sign
                    in. Share the temporary password securely.
                  </p>

                  <button
                    className="admin-primary-button admin-create-submit"
                    type="submit"
                    disabled={savingAdmin}
                  >
                    {savingAdmin
                      ? "Creating account…"
                      : "＋ Create administrator"}
                  </button>
                </form>
              </section>
            </div>
          )}

          {tab === "profile" && (
            <section className="admin-panel admin-profile-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Administrator profile</h2>
                  <p>Your currently signed-in administration account.</p>
                </div>
              </div>

              <div className="admin-profile-content">
                <div className="admin-profile-avatar">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>

                <div className="admin-profile-details">
                  <div>
                    <span>Full name</span>
                    <strong>{currentUserName}</strong>
                  </div>
                  <div>
                    <span>Email address</span>
                    <strong>{currentUserEmail || "Not available"}</strong>
                  </div>
                  <div>
                    <span>Account role</span>
                    <strong>Administrator</strong>
                  </div>
                  <div>
                    <span>Account ID</span>
                    <strong className="admin-profile-id">
                      {currentUserId || "Not available"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-profile-footer">
                <p>
                  Profile editing is not enabled here yet. Your account
                  information is displayed from your current sign-in session.
                </p>
                <button
                  className="admin-secondary-button"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            </section>
          )}

          <div className="admin-bottom-actions">
            <span>La Villa Lekker Stays · Administration</span>
            <button
              type="button"
              className="admin-refresh-link"
              onClick={refreshCurrentTab}
              disabled={loadingHotels || loadingUsers}
            >
              ↻ Refresh dashboard data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}