import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import DynamicForm from "../../components/DynamicForm";
import { useAuth } from "../../auth/AuthContext";
import { handleApiError } from "../../utils/apiErrorHandler";

const loginFields = [
  {
    name: "tenantSlug",
    label: "Tenant slug",
    type: "text",
    placeholder: "eventix",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
];

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (values) => {
    setError("");
    setLoading(true);

    try {
      await login({
        email: values.email,
        password: values.password,
        tenantSlug: values.tenantSlug,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(handleApiError(err) || "Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <h1>Log in</h1>

      {error && <div className="form-alert">{error}</div>}

      <DynamicForm
        fields={loginFields}
        onSubmit={handleSubmit}
        submitText="Log in"
        loadingText="Logging in..."
        loading={loading}
      />

      <p className="page-note">
        New to Eventix? <Link to="/register">Create an account</Link>
      </p>
    </main>
  );
}

export default LoginPage;
