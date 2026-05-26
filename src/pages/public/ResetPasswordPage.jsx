import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import api from "../../api/axios";
import { handleApiError } from "../../utils/apiErrorHandler";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromUrl = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);
  
  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      setMessage("Password reset successfully. You can log in now.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(handleApiError(err) || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>
            <FaLock />
          </span>

          <div>
            <h1>Reset password</h1>
            <p>Create a new password for your account.</p>
          </div>
        </div>

        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <div className="auth-input">
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </label>

          <label>
            Reset token
            <div className="auth-input">
              <input
                onChange={(event) => setToken(event.target.value)}
                placeholder="Token from email link"
                required
                value={token}
              />
            </div>
          </label>

          <label>
            New password
            <div className="auth-input">
              <FaLock />
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Create new password"
                required
                type={showPassword ? "text" : "password"}
                value={newPassword}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <label>
            Confirm password
            <div className="auth-input">
              <FaLock />
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
              />
            </div>
          </label>

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="auth-switch">
          Back to <Link to="/login">login</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
