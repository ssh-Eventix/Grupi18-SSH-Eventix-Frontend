import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaRedo, FaTrash } from "react-icons/fa";
import DynamicTable from "../../components/DynamicTable";
import { tenantEmailDomainsService } from "../../services/tenantEmailDomainsService";
import { tenantsService } from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = {
  tenantId: "",
  domain: "",
  defaultRoleName: "Staff",
  autoApprove: true,
};

const roleOptions = ["Staff", "Admin"];

const normalizeDomain = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

export default function TenantEmailDomainsPage() {
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const tenantNameById = useMemo(() => {
    return tenants.reduce((map, tenant) => ({ ...map, [tenant.id]: tenant.name }), {});
  }, [tenants]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === form.tenantId),
    [tenants, form.tenantId]
  );

  const domainColumns = useMemo(
    () => [
      {
        key: "tenantId",
        label: "Tenant",
        render: (domain) => tenantNameById[domain.tenantId] || "Unknown tenant",
      },
      {
        key: "domain",
        label: "Domain",
        render: (domain) => <strong>{domain.domain}</strong>,
      },
      {
        key: "defaultRoleName",
        label: "Role",
        render: (domain) => <span className="badge info">{domain.defaultRoleName}</span>,
      },
      {
        key: "autoApprove",
        label: "Auto approve",
        render: (domain) => (domain.autoApprove ? "Yes" : "No"),
      },
    ],
    [tenantNameById]
  );

  const fetchDomainRows = useCallback(
    async (page, pageSize, search) => {
      const text = search.trim().toLowerCase();
      const filtered = domains.filter((domain) =>
        `${domain.domain || ""} ${domain.defaultRoleName || ""} ${tenantNameById[domain.tenantId] || ""}`
          .toLowerCase()
          .includes(text)
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      };
    },
    [domains, tenantNameById]
  );

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      domain: normalizeDomain(form.domain),
    };

    try {
      if (editingId) {
        await tenantEmailDomainsService.update(editingId, payload);
        setSuccess("Email domain updated.");
      } else {
        await tenantEmailDomainsService.create(payload);
        setSuccess("Email domain saved.");
      }

      resetForm();
      await loadData();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (domain) => {
    setEditingId(domain.id);
    setForm({
      tenantId: domain.tenantId,
      domain: domain.domain,
      defaultRoleName: domain.defaultRoleName,
      autoApprove: Boolean(domain.autoApprove),
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this email domain rule?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await tenantEmailDomainsService.delete(id);
      setSuccess("Email domain deleted.");
      await loadData();
      setRefreshKey((current) => current + 1);
      if (editingId === id) resetForm();
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
          <span className="superadmin-kicker"><FaEnvelope /> Domain rules</span>
          <h1>Tenant Email Domains</h1>
          <p>Define which email domains are allowed for each tenant and which default role they create.</p>
        </div>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-5">
          <div className="panel-title">
            <div>
              <h2>{editingId ? "Edit domain" : "Add domain"}</h2>
              <p>Use the real domain only. Do not auto-prefix with admin or staff.</p>
            </div>
          </div>

          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field full">
              <label>Tenant</label>
              <select
                className="superadmin-select"
                value={form.tenantId}
                onChange={(e) => updateField("tenantId", e.target.value)}
                disabled={saving || Boolean(editingId)}
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

            <div className="superadmin-field full">
              <label>Domain</label>
              <input
                className="superadmin-input"
                value={form.domain}
                onChange={(e) => updateField("domain", e.target.value)}
                onBlur={(e) => updateField("domain", normalizeDomain(e.target.value))}
                placeholder="example.com"
                required
              />
            </div>

            <div className="superadmin-field">
              <label>Default role</label>
              <select
                className="superadmin-select"
                value={form.defaultRoleName}
                onChange={(e) => updateField("defaultRoleName", e.target.value)}
                required
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="superadmin-field">
              <label>Auto approve</label>
              <select
                className="superadmin-select"
                value={form.autoApprove ? "true" : "false"}
                onChange={(e) => updateField("autoApprove", e.target.value === "true")}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="form-row-actions">
              <button className="primary-action" type="submit" disabled={saving || loading}>
                {saving ? "Saving..." : editingId ? "Update domain" : "Add domain"}
              </button>
              {editingId && (
                <button className="secondary-action" type="button" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {selectedTenant && (
            <div className="info-box compact">
              <strong>{selectedTenant.name}</strong>
              <span>{selectedTenant.slug}</span>
              <span>{selectedTenant.contactEmail || "No contact email"}</span>
            </div>
          )}
        </article>

        <article className="superadmin-card span-7">
          <div className="panel-title">
            <div>
              <h2>Domain rules</h2>
              <p>{domains.length} configured rule{domains.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <DynamicTable
            columns={domainColumns}
            fetchData={fetchDomainRows}
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 20]}
            refreshKey={refreshKey}
            actions={{
              onEdit: startEdit,
              custom: [
                {
                  key: "delete",
                  label: (
                    <>
                      <FaTrash /> Delete
                    </>
                  ),
                  onClick: (domain) => handleDelete(domain.id),
                },
              ],
            }}
          />
        </article>
      </div>
    </section>
  );
}
