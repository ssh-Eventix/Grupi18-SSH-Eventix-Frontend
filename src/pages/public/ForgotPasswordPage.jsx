import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import api from "../../api/axios";
import { handleApiError } from "../../utils/apiErrorHandler";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(
        response.data?.message ||
          "If this account exists, a password reset link has been sent."
      );
    } catch (err) {
      setError(handleApiError(err) || "Could not request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>
            <FaEnvelope />
          </span>

          <div>
            <h1>Forgot password</h1>
            <p>Enter your email and we will send a reset link.</p>
          </div>
        </div>

        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <div className="auth-input">
              <FaEnvelope />
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

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-switch">
          Remembered your password? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
