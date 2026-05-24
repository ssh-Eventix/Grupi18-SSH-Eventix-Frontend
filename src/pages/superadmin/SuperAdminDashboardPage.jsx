import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaEnvelope,
  FaRedo,
  FaShieldAlt,
  FaStore,
  FaUserSecret,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { tenantsService } from "../../services/tenantsService";
import { tenantEmailDomainsService } from "../../services/tenantEmailDomainsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const getTenantStatusLabel = (status) => {
  const normalized = Number(status);
  if (normalized === 1) return "Active";
  if (normalized === 2) return "Suspended";
  if (normalized === 3) return "Pending";
  return "Unknown";
};

const getTenantStatusClass = (tenant) => {
  if (tenant.isActive) return "good";
  if (Number(tenant.status) === 2) return "bad";
  return "warn";
};

const buildCountryStats = (tenants) => {
  const map = tenants.reduce((result, tenant) => {
    const country = tenant.country?.trim() || "Not set";
    result[country] = (result[country] || 0) + 1;
    return result;
  }, {});

  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export default function SuperAdminDashboardPage() {
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
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
    loadDashboard();
  }, [loadDashboard]);

  const activeTenants = useMemo(
    () => tenants.filter((tenant) => tenant.isActive).length,
    [tenants]
  );

  const inactiveTenants = tenants.length - activeTenants;

  const trialTenants = useMemo(
    () => tenants.filter((tenant) => tenant.isTrial).length,
    [tenants]
  );

  const tenantsWithDomains = useMemo(() => {
    const tenantIds = new Set(domains.map((domain) => domain.tenantId));
    return tenantIds.size;
  }, [domains]);

  const domainCoverage = tenants.length
    ? Math.round((tenantsWithDomains / tenants.length) * 100)
    : 0;

  const activePercent = tenants.length
    ? Math.round((activeTenants / tenants.length) * 100)
    : 0;

  const countryStats = useMemo(() => buildCountryStats(tenants), [tenants]);
  const maxCountryCount = Math.max(...countryStats.map((item) => item.count), 1);

  const recentTenants = useMemo(() => {
    return [...tenants]
      .sort((a, b) => new Date(b.createdAtUtc || 0) - new Date(a.createdAtUtc || 0))
      .slice(0, 6);
  }, [tenants]);

  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker">
            <FaShieldAlt /> Platform control center
          </span>
          <h1>SuperAdmin Overview</h1>
          <p>
            Manage tenant onboarding, domain rules, platform access, and safe support
            impersonation from one clean workspace.
          </p>
        </div>

        <div className="superadmin-hero-actions">
          <button className="secondary-action" type="button" onClick={loadDashboard}>
            <FaRedo /> Refresh
          </button>
          <Link className="primary-action" to="/superadmin/tenants">
            <FaStore /> New tenant
          </Link>
        </div>
      </header>

      {error && <div className="form-alert">{error}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card metric-card span-3">
          <div>
            <span className="metric-label">Total tenants</span>
            <strong className="metric-value">{loading ? "..." : tenants.length}</strong>
            <span className="metric-note">Registered organizations</span>
          </div>
          <span className="metric-icon"><FaStore /></span>
        </article>

        <article className="superadmin-card metric-card span-3">
          <div>
            <span className="metric-label">Active tenants</span>
            <strong className="metric-value">{loading ? "..." : activeTenants}</strong>
            <span className="metric-note">Currently enabled</span>
          </div>
          <span className="metric-icon"><FaCheckCircle /></span>
        </article>

        <article className="superadmin-card metric-card span-3">
          <div>
            <span className="metric-label">Trial tenants</span>
            <strong className="metric-value">{loading ? "..." : trialTenants}</strong>
            <span className="metric-note">Trial onboarding</span>
          </div>
          <span className="metric-icon"><FaUsers /></span>
        </article>

        <article className="superadmin-card metric-card span-3">
          <div>
            <span className="metric-label">Email domains</span>
            <strong className="metric-value">{loading ? "..." : domains.length}</strong>
            <span className="metric-note">Auto-approval rules</span>
          </div>
          <span className="metric-icon"><FaEnvelope /></span>
        </article>

        <article className="superadmin-card span-5">
          <div className="panel-title">
            <div>
              <h2>Tenant health</h2>
              <p>Active vs inactive platform accounts.</p>
            </div>
            <span className="badge good">{activePercent}% active</span>
          </div>

          <div className="chart-donut-wrap">
            <svg className="donut-chart" viewBox="0 0 172 172" aria-label="Tenant activity chart">
              <circle className="donut-bg" cx="86" cy="86" r="68" />
              <circle
                className="donut-progress"
                cx="86"
                cy="86"
                r="68"
                strokeDasharray={`${activePercent * 4.27} 427`}
              />
              <text className="donut-center" x="86" y="92">
                {activePercent}%
              </text>
            </svg>

            <div className="legend-list">
              <div className="legend-item">
                <span><i className="status-dot good" /> Active</span>
                <strong>{activeTenants}</strong>
              </div>
              <div className="legend-item">
                <span><i className="status-dot muted" /> Inactive</span>
                <strong>{inactiveTenants}</strong>
              </div>
              <div className="legend-item">
                <span><i className="status-dot warn" /> Trial</span>
                <strong>{trialTenants}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="superadmin-card span-7">
          <div className="panel-title">
            <div>
              <h2>Platform coverage</h2>
              <p>Useful setup signals for SuperAdmin work.</p>
            </div>
            <span className="badge info">{domainCoverage}% domain coverage</span>
          </div>

          <div className="bar-list">
            <div className="bar-row">
              <div className="bar-meta">
                <span>Tenants with email-domain rules</span>
                <strong>{tenantsWithDomains}/{tenants.length}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${domainCoverage}%` }} />
              </div>
            </div>

            <div className="bar-row">
              <div className="bar-meta">
                <span>Active tenants</span>
                <strong>{activePercent}%</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${activePercent}%` }} />
              </div>
            </div>

            <div className="bar-row">
              <div className="bar-meta">
                <span>Trial tenants</span>
                <strong>{tenants.length ? Math.round((trialTenants / tenants.length) * 100) : 0}%</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${tenants.length ? Math.round((trialTenants / tenants.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="superadmin-card span-7">
          <div className="panel-title">
            <div>
              <h2>Recent tenants</h2>
              <p>Newest organizations created on the platform.</p>
            </div>
            <Link className="secondary-action" to="/superadmin/tenants">View all</Link>
          </div>

          <div className="table-wrap">
            <table className="superadmin-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Trial</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <span className="entity-main">
                        <strong>{tenant.name}</strong>
                        <small>{tenant.slug}</small>
                      </span>
                    </td>
                    <td>{[tenant.city, tenant.country].filter(Boolean).join(", ") || "Not set"}</td>
                    <td><span className={`badge ${getTenantStatusClass(tenant)}`}>{getTenantStatusLabel(tenant.status)}</span></td>
                    <td>{tenant.isTrial ? <span className="badge warn">Trial</span> : <span className="badge good">Live</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!recentTenants.length && (
              <div className="empty-state">
                <strong>No tenants yet</strong>
                Create your first tenant to start using the platform.
              </div>
            )}
          </div>
        </article>

        <article className="superadmin-card span-5">
          <div className="panel-title">
            <div>
              <h2>Tenants by country</h2>
              <p>Simple distribution based on tenant profile data.</p>
            </div>
          </div>

          <div className="bar-list">
            {countryStats.map((item) => (
              <div className="bar-row" key={item.label}>
                <div className="bar-meta">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.count / maxCountryCount) * 100}%` }} />
                </div>
              </div>
            ))}

            {!countryStats.length && (
              <div className="empty-state">
                <strong>No country data</strong>
                Add country values when creating tenants.
              </div>
            )}
          </div>
        </article>

        <article className="superadmin-card span-12">
          <div className="panel-title">
            <div>
              <h2>Quick actions</h2>
              <p>Only platform-level actions belong here.</p>
            </div>
          </div>

          <div className="quick-grid">
            <Link className="quick-tile" to="/superadmin/tenants">
              <FaStore />
              <span><strong>Manage tenants</strong><br />Create, edit and disable tenant accounts.</span>
            </Link>
            <Link className="quick-tile" to="/superadmin/tenant-domains">
              <FaEnvelope />
              <span><strong>Email domains</strong><br />Control automatic role mapping by domain.</span>
            </Link>
            <Link className="quick-tile" to="/superadmin/tenant-admins">
              <FaUsers />
              <span><strong>Tenant admins</strong><br />Create the first admin for a tenant.</span>
            </Link>
            <Link className="quick-tile" to="/superadmin/impersonate">
              <FaUserSecret />
              <span><strong>Impersonate</strong><br />Start a controlled support session.</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
