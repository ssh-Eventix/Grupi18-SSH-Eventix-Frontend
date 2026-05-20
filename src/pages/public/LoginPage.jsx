import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaStore, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import { defaultPathForRole, startupPathFromToken } from "../../utils/routeDestinations";

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [values, setValues] = useState({
    tenantSlug: localStorage.getItem("tenantSlug") || "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname;

  if (isAuthenticated) {
    return <Navigate to={redirectTo || startupPathFromToken()} replace />;
  }

  const updateField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(values);
      const role = response.user?.role || response.role;
      navigate(redirectTo || defaultPathForRole(role), { replace: true });
    } catch (err) {
      setError(handleApiError(err) || "Login failed. Check your email, password, and tenant slug.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span><FaStore /></span>
          <div>
            <h1>Welcome back</h1>
            <p>Log in to manage events, tickets, and bookings.</p>
          </div>
        </div>

        {error && <div className="form-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Tenant slug
            <div className="auth-input">
              <FaStore />
              <input
                autoComplete="organization"
                onChange={(event) => updateField("tenantSlug", event.target.value)}
                placeholder="example: viola"
                value={values.tenantSlug}
              />
            </div>
            <small>Required for tenant users. SuperAdmin can leave it empty.</small>
          </label>

          <label>
            Email
            <div className="auth-input">
              <FaUserCircle />
              <input
                autoComplete="email"
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={values.email}
              />
            </div>
          </label>

          <label>
            Password
            <div className="auth-input">
              <FaLock />
              <input
                autoComplete="current-password"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Enter your password"
                required
                type={showPassword ? "text" : "password"}
                value={values.password}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to Eventix? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
