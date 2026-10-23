
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "../app/store";
import { clearAuthError, registerUser } from "../features/auth/authSlice";

interface RegisterLocationState {
  from?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const navigationState = (location.state ?? {}) as RegisterLocationState;

  const safeReturnPath = (path?: string) => {
    if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
    if (path.startsWith("/admin")) return "/";
    return path;
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setValidationError("");

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password) {
      setValidationError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Your password must contain at least 8 characters.");
      return;
    }

    const result = await dispatch(
      registerUser({
        name: trimmedName,
        email: normalizedEmail,
        password,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: normalizedEmail,
          message: "Account created successfully. Please sign in.",
          from: safeReturnPath(navigationState.from),
        },
      });
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

  const linkStyle: React.CSSProperties = {
    color: "#1B4D3E",
    fontWeight: 600,
    cursor: "pointer",
    border: 0,
    background: "none",
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
          Create an account.
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>
          Join La Villa today to discover stays and book your next escape.
        </p>

        {(validationError || error) && (
          <p role="alert" style={{ color: "#dc2626", fontSize: 14 }}>
            {validationError || error}
          </p>
        )}

        <form
          onSubmit={handleRegisterSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <label>
            <span style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              Full name
            </span>
            <input
              required
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError("");
                if (error) dispatch(clearAuthError());
              }}
              style={inputStyle}
            />
          </label>

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
                setValidationError("");
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
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError("");
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
              marginTop: 8,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 24 }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                state: { from: safeReturnPath(navigationState.from) },
              })
            }
            style={linkStyle}
          >
            Sign in →
          </button>
        </p>

        <p style={{ textAlign: "center", fontSize: 13 }}>
          <button type="button" onClick={() => navigate("/")} style={linkStyle}>
            Browse stays as a guest →
          </button>
        </p>

        <p style={{ textAlign: "center", fontSize: 12, marginTop: 24 }}>
          <button type="button" onClick={() => navigate("/admin/login")} style={{ ...linkStyle, color: "#64748b" }}>
            Staff? Admin Portal login →
          </button>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
