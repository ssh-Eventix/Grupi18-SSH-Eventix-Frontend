import { useCallback, useEffect, useMemo, useState } from "react";
import { FaKey, FaRedo, FaUsers } from "react-icons/fa";
import { tenantAdminsService } from "../../services/tenantAdminsService";
import { tenantEmailDomainsService } from "../../services/tenantEmailDomainsService";
import { tenantsService } from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = {
  tenantId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const adminRoles = ["Admin"];

export default function TenantAdminsPage() {
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [tenantData, domainData] = await Promise.all([
        tenantsService.getAll(),
        tenantEmailDomainsService.getAll(),
      ]);

      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setDomains(Array.isArray(domainData) ? domainData : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === form.tenantId),
    [tenants, form.tenantId]
  );

  const filteredTenants = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return tenants;

    return tenants.filter((tenant) =>
      `${tenant.name || ""} ${tenant.slug || ""} ${tenant.contactEmail || ""}`
        .toLowerCase()
        .includes(text)
    );
  }, [tenants, query]);

const allowedDomains = useMemo(() => {
  return domains.filter(
    (domain) =>
      String(domain.tenantId).toLowerCase() === String(form.tenantId).toLowerCase() &&
      domain.isDeleted !== true &&
      adminRoles.includes(domain.defaultRoleName)
  );
}, [domains, form.tenantId]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");

    if (name === "tenantId") {
      setSelectedDomain("");
    }
  };

  const fillSuggestedEmail = () => {
    if (!selectedDomain) {
      setError("Select an allowed admin domain first.");
      return;
    }

    const first = form.firstName.trim().toLowerCase() || "admin";
    const last = form.lastName.trim().toLowerCase();
    const localPart = [first, last].filter(Boolean).join(".");

    updateField("email", `${localPart}@${selectedDomain}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await tenantAdminsService.create(form);
      setSuccess(`Tenant admin created${result?.email ? `: ${result.email}` : "."}`);
      setForm(initialForm);
      setSelectedDomain("");
      await loadData();
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
          <span className="superadmin-kicker"><FaUsers /> Tenant access</span>
          <h1>Tenant Admins</h1>
          <p>Create administrator accounts using only the active email domains configured for each tenant.</p>
        </div>
        <button className="secondary-action" type="button" onClick={loadData} disabled={loading}>
          <FaRedo /> Refresh
        </button>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-8">
          <div className="panel-title">
            <div>
              <h2>Create tenant admin</h2>
              <p>Select tenant, select a valid admin domain, then create the account.</p>
            </div>
          </div>

          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field full">
              <label>Search tenants</label>
              <input
                className="superadmin-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by tenant name, slug or email"
              />
            </div>

            <div className="superadmin-field full">
              <label>Tenant</label>
              <select
                className="superadmin-select"
                value={form.tenantId}
                onChange={(e) => updateField("tenantId", e.target.value)}
                disabled={loading || saving}
                required
              >
                <option value="">{loading ? "Loading tenants..." : "Select tenant"}</option>
                {filteredTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="superadmin-field">
              <label>First name</label>
              <input className="superadmin-input" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
            </div>

            <div className="superadmin-field">
              <label>Last name</label>
              <input className="superadmin-input" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
            </div>

            <div className="superadmin-field">
              <label>Allowed admin domain</label>
              <select
                className="superadmin-select"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                disabled={!form.tenantId || saving}
              >
                <option value="">Select domain</option>
                {allowedDomains.map((domain) => (
                  <option key={domain.id} value={domain.domain}>
                    {domain.domain}
                  </option>
                ))}
              </select>
            </div>

            <div className="superadmin-field">
              <label>Email</label>
              <input className="superadmin-input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
            </div>

            <div className="superadmin-field">
              <label>Password</label>
              <input className="superadmin-input" type="text" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
            </div>

            <div className="form-row-actions">
              <button className="primary-action" type="submit" disabled={saving || loading}>
                {saving ? "Creating..." : "Create admin"}
              </button>
              <button className="secondary-action" type="button" onClick={fillSuggestedEmail} disabled={!selectedDomain || saving}>
                Suggest email
              </button>
              <button className="ghost-action" type="button" onClick={() => updateField("password", generatePassword())} disabled={saving}>
                <FaKey /> Generate password
              </button>
            </div>
          </form>
        </article>

        <aside className="superadmin-card span-4">
          <div className="panel-title">
            <div>
              <h2>Selected tenant</h2>
              <p>Configured admin domains for this tenant.</p>
            </div>
          </div>

          {selectedTenant ? (
            <div className="details-list">
              <div><strong>{selectedTenant.name}</strong><span>{selectedTenant.slug}</span></div>
              <div><strong>Status</strong><span>{selectedTenant.isActive ? "Active" : "Inactive"}</span></div>
              <div><strong>Admin domains</strong><span>{allowedDomains.length}</span></div>
              {allowedDomains.map((domain) => (
                <div key={domain.id}><strong>{domain.domain}</strong><span>{domain.defaultRoleName}</span></div>
              ))}
              {!allowedDomains.length && <div className="empty-state small"><strong>No admin domain</strong>Add an Admin or Staff domain first.</div>}
            </div>
          ) : (
            <div className="empty-state small"><strong>No tenant selected</strong>Select a tenant to see its admin domains.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
