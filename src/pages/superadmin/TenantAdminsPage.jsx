import { useEffect, useState } from "react";
import { tenantAdminsService } from "../../services/tenantAdminsService";
import { tenantsService} from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";

const initialForm = {
  tenantId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export default function TenantAdminsPage() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tenantsService.getAll()
      .then(setTenants)
      .catch((err) => setError(handleApiError(err)));
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await tenantAdminsService.create(form);
      setSuccess(`Admin created: ${result.email}`);
      setForm(initialForm);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Tenant Admins</h1>
          <p>Create the first admin user for a tenant.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="form-alert success-alert">{success}</div>}

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Tenant</label>
          <select
            value={form.tenantId}
            onChange={(event) => updateField("tenantId", event.target.value)}
            required
          >
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>First Name</label>
          <input
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Last Name</label>
          <input
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="admin@admin.sunnyhill.com"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            required
          />
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Tenant Admin"}
        </button>
      </form>
    </section>
  );
}