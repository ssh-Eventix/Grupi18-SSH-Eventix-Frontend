import { useCallback, useEffect, useMemo, useState } from "react";
import { handleApiError } from "../../utils/apiErrorHandler";
import { tenantEmailDomainsService } from "../../services/tenantEmailDomainsService";
import { tenantsService } from "../../services/tenantsService";

const initialForm = {
  tenantId: "",
  domain: "",
  defaultRoleName: "Buyer",
  autoApprove: true,
};

const roleOptions = ["Buyer", "Staff", "Admin"];

const stripRolePrefix = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(admin|staff)\./, "");
};

const domainForRole = (value, role) => {
  const baseDomain = stripRolePrefix(value);

  if (!baseDomain) return "";
  if (role === "Admin") return `admin.${baseDomain}`;
  if (role === "Staff") return `staff.${baseDomain}`;

  return baseDomain;
};

const normalizeDomain = (value) => value.trim().toLowerCase();

export default function TenantEmailDomainsPage() {
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tenantNameById = useMemo(() => {
    return tenants.reduce((map, tenant) => {
      map[tenant.id] = tenant.name;
      return map;
    }, {});
  }, [tenants]);

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

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
  };

  const updateRole = (role) => {
    setForm((current) => ({
      ...current,
      defaultRoleName: role,
      domain: domainForRole(current.domain, role),
    }));
    setError("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.tenantId || !form.domain.trim() || !form.defaultRoleName) {
      setError("Tenant, domain, and default role are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        domain: normalizeDomain(form.domain),
      };

      if (editingId) {
        await tenantEmailDomainsService.update(editingId, payload);
      } else {
        await tenantEmailDomainsService.create(payload);
      }

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
    setForm({
      tenantId: domain.tenantId,
      domain: domain.domain,
      defaultRoleName: domain.defaultRoleName || "Buyer",
      autoApprove: Boolean(domain.autoApprove),
    });
    setError("");
  };

  const handleDelete = async (id) => {
    setError("");

    try {
      await tenantEmailDomainsService.delete(id);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Tenant Domains</h1>
        </div>
        <button type="button" onClick={loadData}>
          Refresh
        </button>
      </div>

      {error && <div className="form-alert">{error}</div>}

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Tenant</label>
          <select
            value={form.tenantId}
            disabled={saving || Boolean(editingId)}
            onChange={(event) => updateField("tenantId", event.target.value)}
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
          <label>Domain</label>
          <input
            value={form.domain}
            disabled={saving}
            placeholder="sunnyhill.com"
            onChange={(event) => updateField("domain", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Default Role</label>
          <select
            value={form.defaultRoleName}
            disabled={saving}
            onChange={(event) => updateRole(event.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Auto Approve</label>
          <input
            type="checkbox"
            checked={form.autoApprove}
            disabled={saving}
            onChange={(event) => updateField("autoApprove", event.target.checked)}
          />
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update domain" : "Create domain"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm} disabled={saving}>
            Cancel
          </button>
        )}
      </form>

      <div className="table-panel">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Domain</th>
                <th>Default Role</th>
                <th>Auto Approve</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id}>
                  <td>{tenantNameById[domain.tenantId] || domain.tenantId}</td>
                  <td>{domain.domain}</td>
                  <td>{domain.defaultRoleName}</td>
                  <td>{domain.autoApprove ? "Yes" : "No"}</td>
                  <td>
                    <button type="button" onClick={() => handleEdit(domain)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(domain.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
