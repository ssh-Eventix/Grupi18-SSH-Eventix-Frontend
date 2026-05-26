import { useEffect, useMemo, useState } from "react";
import { FaClock, FaRedo, FaUserSecret } from "react-icons/fa";
import { tenantsService } from "../../services/tenantsService";
import { impersonationService } from "../../services/impersonationService";
import { handleApiError } from "../../utils/apiErrorHandler";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
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
  const navigate = useNavigate();
  const { impersonate, stopImpersonation } = useAuth();

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === form.targetTenantId),
    [tenants, form.targetTenantId]
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

  useEffect(() => {
    loadTenants();
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

const handleSubmit = async (event) => {
  event.preventDefault();
  setSubmitting(true);
  setError("");
  setSuccess("");
  setResult(null);

  try {
    const response = await impersonationService.start({
      ...form,
      minutes: Number(form.minutes),
    });

    const tenantSlug = selectedTenant?.slug;

    localStorage.setItem("superAdminToken", localStorage.getItem("token"));
    localStorage.setItem(
      "impersonationSessionId",
      response.impersonationSessionId
    );

    impersonate(response.accessToken, tenantSlug);

    setResult(response);
    setSuccess("Impersonation session started.");

    navigate("/tenant", { replace: true });
  } catch (err) {
    setError(handleApiError(err));
  } finally {
    setSubmitting(false);
  }
};

const handleStop = async () => {
  const sessionId = localStorage.getItem("impersonationSessionId");

  if (!sessionId) return;

  setSubmitting(true);
  setError("");

  try {
    await impersonationService.stop(sessionId);

    stopImpersonation();

    setResult(null);
    setSuccess("Impersonation session stopped.");

    navigate("/superadmin/impersonate", { replace: true });
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
          <p>Start or stop a temporary tenant support session.</p>
        </div>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-8">
          <div className="panel-title">
            <div>
              <h2>Start session</h2>
              <p>Choose tenant, target public user and session length.</p>
            </div>
          </div>

          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field full">
              <label>Search tenants</label>
              <input className="superadmin-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tenant name, slug or email" />
            </div>

            <div className="superadmin-field full">
              <label>Tenant</label>
              <select className="superadmin-select" value={form.targetTenantId} onChange={(e) => updateField("targetTenantId", e.target.value)} disabled={loadingTenants || submitting} required>
                <option value="">{loadingTenants ? "Loading tenants..." : "Select tenant"}</option>
                {filteredTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>
                ))}
              </select>
            </div>

            <div className="superadmin-field full">
              <label>Target public user id</label>
              <input className="superadmin-input" value={form.targetPublicUserId} onChange={(e) => updateField("targetPublicUserId", e.target.value)} disabled={submitting} required />
            </div>

            <div className="superadmin-field">
              <label>Minutes</label>
              <input className="superadmin-input" type="number" min="1" max="120" value={form.minutes} disabled={submitting} onChange={(e) => updateField("minutes", e.target.value)} required />
            </div>

            <div className="superadmin-field">
              <label>Quick duration</label>
              <div className="inline-actions">
                {minuteOptions.map((minutes) => (
                  <button type="button" key={minutes} onClick={() => updateField("minutes", minutes)} disabled={submitting}>
                    <FaClock /> {minutes}m
                  </button>
                ))}
              </div>
            </div>

            <div className="superadmin-field full">
              <label>Reason</label>
              <input className="superadmin-input" value={form.reason} disabled={submitting} onChange={(e) => updateField("reason", e.target.value)} required />
            </div>

            <div className="form-row-actions">
              <button className="primary-action" type="submit" disabled={submitting || loadingTenants}>
                {submitting ? "Starting..." : "Start impersonation"}
              </button>
              {result?.impersonationSessionId && (
                <button className="danger-action" type="button" onClick={handleStop} disabled={submitting}>
                  Stop session
                </button>
              )}
            </div>
          </form>
        </article>

        <aside className="superadmin-card span-4">
          <div className="panel-title">
            <div>
              <h2>Session details</h2>
              <p>Selected tenant and active session.</p>
            </div>
          </div>

          {selectedTenant ? (
            <div className="details-list">
              <div><strong>{selectedTenant.name}</strong><span>{selectedTenant.slug}</span></div>
              <div><strong>Email</strong><span>{selectedTenant.contactEmail || "Not set"}</span></div>
              <div><strong>Status</strong><span>{selectedTenant.isActive ? "Active" : "Inactive"}</span></div>
            </div>
          ) : (
            <div className="empty-state small"><strong>No tenant selected</strong>Select a tenant to see details.</div>
          )}

          {result && (
            <div className="info-box compact">
              <strong>Active session</strong>
              {result.accessTokenExpiresAtUtc && (
                  <span>
                    Expires:{" "}
                    {new Date(result.accessTokenExpiresAtUtc).toLocaleString()}
                  </span>
                )}
              {result.accessToken && <span>Token received from API.</span>}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
