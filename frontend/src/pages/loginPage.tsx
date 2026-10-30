
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "../app/store";
import { clearAuthError, loginUser } from "../features/auth/authSlice";

interface LoginLocationState {
  registeredEmail?: string;
  message?: string;
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const navigationState = (location.state ?? {}) as LoginLocationState;
  const [email, setEmail] = useState(navigationState.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (navigationState.registeredEmail) {
      setEmail(navigationState.registeredEmail);
    }
  }, [navigationState.registeredEmail]);

  const safeReturnPath = (path?: string) => {
    if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
    if (path.startsWith("/admin")) return "/";
    return path;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await dispatch(
      loginUser({
        email: email.trim().toLowerCase(),
        password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user.role?.toUpperCase();

      if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(safeReturnPath(navigationState.from), {
          replace: true,
          state: null,
        });
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "32px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, color: "#1B4D3E", margin: "0 0 4px" }}>
          La Villa
        </h2>
        <span style={{ fontSize: 12, color: "#64748b", letterSpacing: ".5px" }}>
          LEKKER STAYS
        </span>
      </div>

      <section style={{ maxWidth: 360, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 24, margin: "0 0 8px", color: "#111" }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
          Sign in to continue with your La Villa booking.
        </p>

        {navigationState.message && (
          <p role="status" style={{ color: "#166534", fontSize: 14 }}>
            {navigationState.message}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: "#dc2626", fontSize: 14 }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>
            <span style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              Email address
            </span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) dispatch(clearAuthError());
              }}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              Password
            </span>
            <div style={{ position: "relative" }}>
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) dispatch(clearAuthError());
                }}
                style={{ ...inputStyle, paddingRight: 60 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#1B4D3E",
              color: "#fff",
              width: "100%",
              border: 0,
              padding: 14,
              borderRadius: 6,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 24 }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            state={{ from: safeReturnPath(navigationState.from) }}
            style={{ color: "#1B4D3E", fontWeight: 600 }}
          >
            Create an account
          </Link>
        </p>

        <p style={{ textAlign: "center", fontSize: 13 }}>
          <Link to="/discover" style={{ color: "#1B4D3E" }}>
            Browse stays
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
