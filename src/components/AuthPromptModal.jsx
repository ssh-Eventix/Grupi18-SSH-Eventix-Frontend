import { Link, useLocation } from "react-router-dom";
import { FaLock, FaTimes, FaUserPlus } from "react-icons/fa";

const AuthPromptModal = ({ message, onClose, redirectTo }) => {
  const location = useLocation();
  const [redirectPath, redirectQuery = ""] = redirectTo ? redirectTo.split("?") : [];
  const redirectLocation = redirectTo
    ? {
        pathname: redirectPath,
        search: redirectQuery ? `?${redirectQuery}` : "",
      }
    : location;

  return (
    <div className="auth-prompt-overlay" role="dialog" aria-modal="true">
      <article className="auth-prompt panel">
        <button className="auth-prompt-close" type="button" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
        <div className="auth-prompt-icon">
          <FaLock />
        </div>
        <h2>Join Eventix first</h2>
        <p>{message || "Create an account or log in to continue with tickets, favorites, and your profile."}</p>
        <div className="auth-prompt-actions">
          <Link className="primary-button" to="/register">
            <FaUserPlus /> Create account
          </Link>
          <Link className="auth-secondary-button" to="/login" state={{ from: redirectLocation, forceAuthPrompt: true }}>
            Log in
          </Link>
        </div>
      </article>
    </div>
  );
};

export default AuthPromptModal;
