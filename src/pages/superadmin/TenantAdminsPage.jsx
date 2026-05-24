import { useEffect, useMemo, useState } from "react";
import { FaKey, FaRedo, FaShieldAlt, FaUsers } from "react-icons/fa";
import { tenantAdminsService } from "../../services/tenantAdminsService";
import { tenantsService } from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = { tenantId: "", firstName: "", lastName: "", email: "", password: "" };

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export default function TenantAdminsPage() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === form.tenantId), [tenants, form.tenantId]);

  const filteredTenants = useMemo(() => {
    const text = query.toLowerCase();
    return tenants.filter((tenant) => `${tenant.name} ${tenant.slug} ${tenant.contactEmail}`.toLowerCase().includes(text));
  }, [tenants, query]);

  const loadTenants = async () => {
    setLoadingTenants(true);
    setError("");
    try {
      const data = await tenantsService.getAll();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => { loadTenants(); }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const fillSuggestedEmail = () => {
    if (!selectedTenant?.slug) return;
    const first = form.firstName.trim().toLowerCase() || "admin";
    const last = form.lastName.trim().toLowerCase();
    const local = [first, last].filter(Boolean).join(".");
    updateField("email", `${local}@admin.${selectedTenant.slug}.test`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await tenantAdminsService.create(form);
      setSuccess(`Tenant admin created successfully${result?.email ? `: ${result.email}` : "."}`);
      setForm(initialForm);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker"><FaUsers /> Access provisioning</span>
          <h1>Tenant Admins</h1>
          <p>Create the first administrator account for a tenant. This is platform onboarding, not tenant staff management.</p>
        </div>
        <button className="secondary-action" type="button" onClick={loadTenants}><FaRedo /> Refresh tenants</button>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-7">
          <div className="panel-title"><div><h2>Create tenant admin</h2><p>Choose a tenant and create an owner/admin login for it.</p></div></div>
          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field full"><label>Search tenants</label><input className="superadmin-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenant before selecting..." /></div>
            <div className="superadmin-field full"><label>Tenant</label><select className="superadmin-select" value={form.tenantId} onChange={(e) => updateField("tenantId", e.target.value)} required><option value="">{loadingTenants ? "Loading tenants..." : "Select tenant"}</option>{filteredTenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>)}</select></div>
            <div className="superadmin-field"><label>First name</label><input className="superadmin-input" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required /></div>
            <div className="superadmin-field"><label>Last name</label><input className="superadmin-input" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required /></div>
            <div className="superadmin-field"><label>Email</label><input className="superadmin-input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required /></div>
            <div className="superadmin-field"><label>Password</label><input className="superadmin-input" type="text" value={form.password} onChange={(e) => updateField("password", e.target.value)} required /></div>
            <div className="form-row-actions"><button className="primary-action" disabled={saving}>{saving ? "Creating..." : "Create admin"}</button><button className="ghost-action" type="button" onClick={() => updateField("password", generatePassword())}><FaKey /> Generate password</button><button className="secondary-action" type="button" onClick={fillSuggestedEmail} disabled={!selectedTenant}>Suggest email</button></div>
          </form>
        </article>

        <aside className="superadmin-card span-5">
          <div className="panel-title"><div><h2>Selected tenant</h2><p>Confirm the tenant before creating access.</p></div></div>
          {selectedTenant ? (
            <div className="selected-tenant-card">
              <span className="entity-main"><strong>{selectedTenant.name}</strong><small>{selectedTenant.slug}</small></span>
              <p>{selectedTenant.description || "No description available."}</p>
              <span className={`badge ${selectedTenant.isActive ? "good" : "bad"}`}>{selectedTenant.isActive ? "Active" : "Inactive"}</span>
              {selectedTenant.isTrial && <span className="badge warn" style={{ marginLeft: 8 }}>Trial</span>}
            </div>
          ) : (
            <div className="info-box"><FaShieldAlt /><strong>No tenant selected</strong><span>Select a tenant first. SuperAdmin should only create the initial tenant admin or recovery admin.</span></div>
          )}
        </aside>
      </div>
    </section>
  );
}
