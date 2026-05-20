import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import DynamicForm from "../../components/DynamicForm";
import { useAuth } from "../../auth/AuthContext";
import { handleApiError } from "../../utils/apiErrorHandler";

const registerFields = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    placeholder: "Your name",
    required: true,
  },
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
    placeholder: "Create a password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    placeholder: "Repeat your password",
    required: true,
  },
];

function Register() {
  const { isAuthenticated, register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values) => {
    setError("");

    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        tenantSlug: values.tenantSlug,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(handleApiError(err) || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <h1>Create account</h1>

      {error && <div className="form-alert">{error}</div>}

      <DynamicForm
        fields={registerFields}
        onSubmit={handleSubmit}
        submitText="Create account"
        loadingText="Creating account..."
        loading={loading}
      />

      <p className="page-note">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export default Register;
