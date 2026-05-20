import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaStore, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
import { handleApiError } from "../../utils/apiErrorHandler";

function Register() {
  const { isAuthenticated, register } = useAuth();
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    tenantSlug: localStorage.getItem("tenantSlug") || "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const updateField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!values.tenantSlug.trim()) {
      setError("Tenant slug is required for registration.");
      return;
    }

    setLoading(true);

    try {
      await register(values);
      navigate("/", { replace: true });
    } catch (err) {
      setError(handleApiError(err) || "Registration failed. Check the tenant slug and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card">
        <div className="auth-brand">
          <span><FaStore /></span>
          <div>
            <h1>Create account</h1>
            <p>Join a tenant organization and start booking events.</p>
          </div>
        </div>

        {error && <div className="form-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-two-col">
            <label>
              First name
              <div className="auth-input">
                <FaUserCircle />
                <input
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="First name"
                  required
                  value={values.firstName}
                />
              </div>
            </label>

            <label>
              Last name
              <div className="auth-input">
                <FaUserCircle />
                <input
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Last name"
                  required
                  value={values.lastName}
                />
              </div>
            </label>
          </div>

          <label>
            Tenant slug
            <div className="auth-input">
              <FaStore />
              <input
                onChange={(event) => updateField("tenantSlug", event.target.value)}
                placeholder="example: viola"
                required
                value={values.tenantSlug}
              />
            </div>
            <small>Use the slug of an existing tenant, for example the one created by SuperAdmin.</small>
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

          <div className="auth-two-col">
            <label>
              Password
              <div className="auth-input">
                <FaLock />
                <input
                  autoComplete="new-password"
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Create password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                />
              </div>
            </label>

            <label>
              Confirm password
              <div className="auth-input">
                <FaLock />
                <input
                  autoComplete="new-password"
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  placeholder="Repeat password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={values.confirmPassword}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>
          </div>

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
