import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaMagic, FaRedo, FaTrash } from "react-icons/fa";
import { tenantEmailDomainsService } from "../../services/tenantEmailDomainsService";
import { tenantsService } from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = { tenantId: "", domain: "", defaultRoleName: "Staff", autoApprove: true };
const roleOptions = ["Staff", "Admin"];
const normalizeDomain = (value) => value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
const stripRolePrefix = (value) => normalizeDomain(value).replace(/^(admin|staff)\./, "");
const domainForRole = (value, role) => {
  const base = stripRolePrefix(value);
  if (!base) return "";
  return role === "Admin" ? `admin.${base}` : role === "Staff" ? `staff.${base}` : base;
};

export default function TenantEmailDomainsPage() {
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tenantNameById = useMemo(() => tenants.reduce((map, tenant) => ({ ...map, [tenant.id]: tenant.name }), {}), [tenants]);
  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === form.tenantId), [tenants, form.tenantId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantData, domainData] = await Promise.all([tenantsService.getAll(), tenantEmailDomainsService.getAll()]);
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setDomains(Array.isArray(domainData) ? domainData : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredDomains = useMemo(() => {
    const text = query.toLowerCase();
    return domains.filter((domain) => `${domain.domain} ${domain.defaultRoleName} ${tenantNameById[domain.tenantId] || ""}`.toLowerCase().includes(text));
  }, [domains, query, tenantNameById]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const updateRole = (role) => {
    setForm((current) => ({ ...current, defaultRoleName: role, domain: domainForRole(current.domain, role) }));
  };

  const resetForm = () => { setForm(initialForm); setEditingId(null); };

  const submitDomain = async (payload) => {
    if (editingId) await tenantEmailDomainsService.update(editingId, payload);
    else await tenantEmailDomainsService.create(payload);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await submitDomain({ ...form, domain: normalizeDomain(form.domain) });
      setSuccess(editingId ? "Domain rule updated." : "Domain rule created.");
      resetForm();
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const createAdminAndStaffDomains = async () => {
    const baseDomain = stripRolePrefix(form.domain);
    if (!form.tenantId || !baseDomain) {
      setError("Select a tenant and enter a base domain first.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await tenantEmailDomainsService.create({ tenantId: form.tenantId, domain: `admin.${baseDomain}`, defaultRoleName: "Admin", autoApprove: form.autoApprove });
      await tenantEmailDomainsService.create({ tenantId: form.tenantId, domain: `staff.${baseDomain}`, defaultRoleName: "Staff", autoApprove: form.autoApprove });
      setSuccess("Admin and Staff domain rules created.");
      resetForm();
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (domain) => {
    setEditingId(domain.id);
    setForm({ tenantId: domain.tenantId, domain: domain.domain || "", defaultRoleName: domain.defaultRoleName || "Staff", autoApprove: Boolean(domain.autoApprove) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (domain) => {
    if (!window.confirm(`Delete domain rule "${domain.domain}"?`)) return;
    setError("");
    try {
      await tenantEmailDomainsService.delete(domain.id);
      setSuccess("Domain rule deleted.");
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker"><FaEnvelope /> Domain automation</span>
          <h1>Tenant Email Domains</h1>
          <p>Configure which email domains can automatically map users to tenant roles.</p>
        </div>
        <button className="secondary-action" type="button" onClick={loadData}><FaRedo /> Refresh</button>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-5 metric-card"><div><span className="metric-label">Domain rules</span><strong className="metric-value">{domains.length}</strong><span className="metric-note">Total configured rules</span></div><span className="metric-icon"><FaEnvelope /></span></article>
        <article className="superadmin-card span-7 metric-card"><div><span className="metric-label">Tenants with rules</span><strong className="metric-value">{new Set(domains.map((d) => d.tenantId)).size}</strong><span className="metric-note">Tenants covered by auto-approval</span></div><span className="metric-icon"><FaMagic /></span></article>

        <article className="superadmin-card span-12">
          <div className="panel-title"><div><h2>{editingId ? "Edit domain rule" : "Create domain rule"}</h2><p>Use the helper to create both admin and staff rules quickly.</p></div></div>
          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field third"><label>Tenant</label><select className="superadmin-select" value={form.tenantId} disabled={saving || Boolean(editingId)} onChange={(e) => updateField("tenantId", e.target.value)} required><option value="">Select tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>)}</select></div>
            <div className="superadmin-field third"><label>Domain</label><input className="superadmin-input" value={form.domain} disabled={saving} placeholder="example.com or staff.example.com" onChange={(e) => updateField("domain", e.target.value)} required /></div>
            <div className="superadmin-field small"><label>Default role</label><select className="superadmin-select" value={form.defaultRoleName} disabled={saving} onChange={(e) => updateRole(e.target.value)}>{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</select></div>
            <div className="superadmin-field small"><label>Auto approve</label><select className="superadmin-select" value={form.autoApprove ? "yes" : "no"} onChange={(e) => updateField("autoApprove", e.target.value === "yes")}><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div className="form-row-actions"><button className="primary-action" disabled={saving}>{saving ? "Saving..." : editingId ? "Update rule" : "Create rule"}</button><button className="secondary-action" type="button" disabled={saving || editingId} onClick={createAdminAndStaffDomains}><FaMagic /> Create Admin + Staff</button>{editingId && <button className="ghost-action" type="button" onClick={resetForm}>Cancel edit</button>}</div>
          </form>
          {selectedTenant && <div className="info-box" style={{ marginTop: 16 }}><strong>Selected tenant:</strong><span>{selectedTenant.name} · {selectedTenant.slug}</span></div>}
        </article>

        <article className="superadmin-card span-12">
          <div className="data-toolbar"><div className="panel-title" style={{ marginBottom: 0 }}><div><h2>Domain rules</h2><p>{filteredDomains.length} rules shown</p></div></div><input className="search-input" placeholder="Search domain, tenant or role..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="table-wrap">
            <table className="superadmin-table"><thead><tr><th>Tenant</th><th>Domain</th><th>Default role</th><th>Auto approve</th><th>Actions</th></tr></thead><tbody>{filteredDomains.map((domain) => <tr key={domain.id}><td>{tenantNameById[domain.tenantId] || domain.tenantId}</td><td><span className="badge purple">{domain.domain}</span></td><td>{domain.defaultRoleName}</td><td>{domain.autoApprove ? <span className="badge good">Yes</span> : <span className="badge warn">No</span>}</td><td><div className="inline-actions"><button type="button" onClick={() => handleEdit(domain)}>Edit</button><button type="button" onClick={() => handleDelete(domain)}><FaTrash /> Delete</button></div></td></tr>)}</tbody></table>
            {!loading && !filteredDomains.length && <div className="empty-state"><strong>No domain rules found</strong>Create a rule for admin/staff onboarding.</div>}
            {loading && <div className="empty-state"><strong>Loading domain rules...</strong></div>}
          </div>
        </article>
      </div>
    </section>
  );
}
