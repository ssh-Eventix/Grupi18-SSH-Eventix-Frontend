import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClock, FaRedo, FaShieldAlt, FaUserSecret } from "react-icons/fa";
import { tenantsService } from "../../services/tenantsService";
import { impersonationService } from "../../services/impersonationService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = { targetTenantId: "", targetPublicUserId: "", minutes: 10, reason: "" };
const minuteOptions = [10, 15, 30, 60];

export default function ImpersonatePage() {
  const [tenants, setTenants] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === form.targetTenantId), [tenants, form.targetTenantId]);

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
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await impersonationService.start({ ...form, minutes: Number(form.minutes) });
      setResult(response);
      setSuccess("Impersonation session started successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStop = async () => {
    if (!result?.sessionId) return;
    setSubmitting(true);
    setError("");
    try {
      await impersonationService.stop(result.sessionId);
      setResult(null);
      setSuccess("Impersonation session stopped.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker"><FaUserSecret /> Support access</span>
          <h1>Impersonate Tenant</h1>
          <p>Start a temporary, reason-based support session. Keep this page strictly for platform support and debugging.</p>
        </div>
        <button className="secondary-action" type="button" onClick={loadTenants}><FaRedo /> Refresh tenants</button>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-7">
          <div className="panel-title"><div><h2>Start support session</h2><p>Choose tenant, target user and session length.</p></div></div>
          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field full"><label>Search tenants</label><input className="superadmin-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tenant name, slug or email..." /></div>
            <div className="superadmin-field full"><label>Tenant</label><select className="superadmin-select" value={form.targetTenantId} onChange={(e) => updateField("targetTenantId", e.target.value)} disabled={loadingTenants || submitting} required><option value="">{loadingTenants ? "Loading tenants..." : "Select tenant"}</option>{filteredTenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>)}</select></div>
            <div className="superadmin-field full"><label>Target Public User Id</label><input className="superadmin-input" value={form.targetPublicUserId} onChange={(e) => updateField("targetPublicUserId", e.target.value)} placeholder="Paste the tenant admin public user id" disabled={submitting} required /></div>
            <div className="superadmin-field"><label>Minutes</label><input className="superadmin-input" type="number" min="1" max="120" value={form.minutes} disabled={submitting} onChange={(e) => updateField("minutes", e.target.value)} required /></div>
            <div className="superadmin-field"><label>Quick duration</label><div className="inline-actions">{minuteOptions.map((minutes) => <button type="button" key={minutes} onClick={() => updateField("minutes", minutes)}><FaClock /> {minutes}m</button>)}</div></div>
            <div className="superadmin-field full"><label>Reason</label><input className="superadmin-input" value={form.reason} disabled={submitting} onChange={(e) => updateField("reason", e.target.value)} placeholder="Support request, debugging, onboarding help..." required /></div>
            <div className="form-row-actions"><button className="primary-action" type="submit" disabled={submitting || loadingTenants}>{submitting ? "Starting..." : "Start impersonation"}</button>{result?.sessionId && <button className="danger-action" type="button" onClick={handleStop} disabled={submitting}>Stop session</button>}</div>
          </form>
        </article>

        <aside className="superadmin-card span-5">
          <div className="panel-title"><div><h2>Safety checklist</h2><p>Use impersonation only when it is justified.</p></div></div>
          <ul className="checklist">
            <li><FaCheckCircle /> Use a short session duration.</li>
            <li><FaCheckCircle /> Always write a clear support reason.</li>
            <li><FaCheckCircle /> Stop the session when testing is complete.</li>
            <li><FaCheckCircle /> Do not use this for normal tenant operations.</li>
          </ul>

          {selectedTenant && <div className="selected-tenant-card" style={{ marginTop: 18 }}><span className="entity-main"><strong>{selectedTenant.name}</strong><small>{selectedTenant.slug}</small></span><p>{selectedTenant.contactEmail || "No contact email"}</p><span className={`badge ${selectedTenant.isActive ? "good" : "bad"}`}>{selectedTenant.isActive ? "Active" : "Inactive"}</span></div>}

          {result && <div className="info-box" style={{ marginTop: 18 }}><strong>Active session</strong>{result.expiresAtUtc && <span>Expires: {new Date(result.expiresAtUtc).toLocaleString()}</span>}{result.impersonationToken && <span>Token returned by API. Keep it only for this session.</span>}</div>}
        </aside>
      </div>
    </section>
  );
}
