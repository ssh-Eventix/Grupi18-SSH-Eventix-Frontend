import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCopy, FaEdit, FaRedo, FaStore, FaTrash } from "react-icons/fa";
import { tenantsService } from "../../services/tenantsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./SuperAdmin.css";

const initialForm = {
  name: "",
  slug: "",
  schemaName: "",
  description: "",
  contactEmail: "",
  city: "",
  country: "",
  logoUrl: "",
  status: 1,
  isTrial: false,
  isActive: true,
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const schemaFromSlug = (slug) => slug.replace(/-/g, "_");

const statusLabel = (status) => {
  if (Number(status) === 1) return "Active";
  if (Number(status) === 2) return "Suspended";
  if (Number(status) === 3) return "Pending";
  return "Unknown";
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tenantsService.getAll();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const text = `${tenant.name || ""} ${tenant.slug || ""} ${tenant.contactEmail || ""} ${tenant.city || ""} ${tenant.country || ""}`.toLowerCase();
      const matchesText = text.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && tenant.isActive) ||
        (statusFilter === "inactive" && !tenant.isActive) ||
        (statusFilter === "trial" && tenant.isTrial);

      return matchesText && matchesStatus;
    });
  }, [tenants, query, statusFilter]);

  const updateField = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "name" && !editingId) {
        const nextSlug = slugify(value);
        next.slug = nextSlug;
        next.schemaName = schemaFromSlug(nextSlug);
      }
      if (name === "slug") next.schemaName = schemaFromSlug(value);
      return next;
    });
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

    try {
      const payload = { ...form, status: Number(form.status) };
      if (editingId) {
        await tenantsService.update(editingId, payload);
        setSuccess("Tenant updated successfully.");
      } else {
        await tenantsService.create(payload);
        setSuccess("Tenant created successfully.");
      }
      resetForm();
      await loadTenants();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tenant) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name || "",
      slug: tenant.slug || "",
      schemaName: tenant.schemaName || "",
      description: tenant.description || "",
      contactEmail: tenant.contactEmail || "",
      city: tenant.city || "",
      country: tenant.country || "",
      logoUrl: tenant.logoUrl || "",
      status: tenant.status || 1,
      isTrial: Boolean(tenant.isTrial),
      isActive: Boolean(tenant.isActive),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (tenant) => {
    const confirmed = window.confirm(`Delete tenant "${tenant.name}"?`);
    if (!confirmed) return;

    setError("");
    try {
      await tenantsService.delete(tenant.id);
      setSuccess("Tenant deleted successfully.");
      await loadTenants();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const copyValue = async (value) => {
    await navigator.clipboard.writeText(value || "");
    setSuccess("Copied to clipboard.");
  };

  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker"><FaStore /> Tenant registry</span>
          <h1>Tenants</h1>
          <p>Create and maintain the organizations that use Eventix. This page should only contain platform-level tenant data.</p>
        </div>
        <button className="secondary-action" type="button" onClick={loadTenants}><FaRedo /> Refresh</button>
      </header>

      {error && <div className="form-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="superadmin-grid">
        <article className="superadmin-card span-12">
          <div className="panel-title">
            <div>
              <h2>{editingId ? "Edit tenant" : "Create tenant"}</h2>
              <p>Name automatically generates slug and schema, but you can still adjust them.</p>
            </div>
          </div>

          <form className="superadmin-form" onSubmit={handleSubmit}>
            <div className="superadmin-field third"><label>Name</label><input className="superadmin-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} required /></div>
            <div className="superadmin-field third"><label>Slug</label><input className="superadmin-input" value={form.slug} onChange={(e) => updateField("slug", slugify(e.target.value))} required /></div>
            <div className="superadmin-field third"><label>Schema name</label><input className="superadmin-input" value={form.schemaName} onChange={(e) => updateField("schemaName", e.target.value)} required /></div>
            <div className="superadmin-field third"><label>Contact email</label><input className="superadmin-input" type="email" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} /></div>
            <div className="superadmin-field third"><label>City</label><input className="superadmin-input" value={form.city} onChange={(e) => updateField("city", e.target.value)} /></div>
            <div className="superadmin-field third"><label>Country</label><input className="superadmin-input" value={form.country} onChange={(e) => updateField("country", e.target.value)} /></div>
            <div className="superadmin-field full"><label>Description</label><input className="superadmin-input" value={form.description} onChange={(e) => updateField("description", e.target.value)} /></div>
            <div className="superadmin-field third"><label>Logo URL</label><input className="superadmin-input" value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} /></div>
            <div className="superadmin-field small"><label>Status</label><select className="superadmin-select" value={form.status} onChange={(e) => updateField("status", e.target.value)}><option value={1}>Active</option><option value={2}>Suspended</option><option value={3}>Pending</option></select></div>
            <div className="superadmin-field small"><label>Trial</label><select className="superadmin-select" value={form.isTrial ? "yes" : "no"} onChange={(e) => updateField("isTrial", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
            <div className="superadmin-field small"><label>Enabled</label><select className="superadmin-select" value={form.isActive ? "yes" : "no"} onChange={(e) => updateField("isActive", e.target.value === "yes")}><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div className="form-row-actions"><button className="primary-action" disabled={saving}>{saving ? "Saving..." : editingId ? "Update tenant" : "Create tenant"}</button>{editingId && <button className="ghost-action" type="button" onClick={resetForm}>Cancel edit</button>}</div>
          </form>
        </article>

        <article className="superadmin-card span-12">
          <div className="data-toolbar">
            <div className="panel-title" style={{ marginBottom: 0 }}><div><h2>Tenant list</h2><p>{filteredTenants.length} of {tenants.length} tenants shown</p></div></div>
            <input className="search-input" placeholder="Search by name, slug, email, city..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All tenants</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="trial">Trial</option></select>
          </div>

          <div className="table-wrap">
            <table className="superadmin-table">
              <thead><tr><th>Tenant</th><th>Contact</th><th>Schema</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td><span className="entity-main"><strong>{tenant.name}</strong><small>{tenant.slug}</small></span></td>
                    <td>{tenant.contactEmail || "Not set"}</td>
                    <td><span className="badge purple">{tenant.schemaName}</span></td>
                    <td>{[tenant.city, tenant.country].filter(Boolean).join(", ") || "Not set"}</td>
                    <td><span className={`badge ${tenant.isActive ? "good" : "bad"}`}>{statusLabel(tenant.status)}</span>{tenant.isTrial && <span className="badge warn" style={{ marginLeft: 6 }}>Trial</span>}</td>
                    <td><div className="inline-actions"><button type="button" onClick={() => handleEdit(tenant)}><FaEdit /> Edit</button><button type="button" onClick={() => copyValue(tenant.slug)}><FaCopy /> Slug</button><button type="button" onClick={() => handleDelete(tenant)}><FaTrash /> Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !filteredTenants.length && <div className="empty-state"><strong>No tenants found</strong>Try changing search or filters.</div>}
            {loading && <div className="empty-state"><strong>Loading tenants...</strong></div>}
          </div>
        </article>
      </div>
    </section>
  );
}
