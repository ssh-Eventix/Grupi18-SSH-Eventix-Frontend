import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicTable from "../../components/DynamicTable.jsx";
import { staffService } from "../../services/staffService";
import { handleApiError } from "../../utils/apiErrorHandler";
import Alert from "../../components/Alert";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  isActive: true,
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await staffService.getAll();
      setStaff(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    setSaving(true);

    try {
      await staffService.create(form);
      setForm(initialForm);
      await loadStaff();
      setMessage("Staff member was created.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (staffMember) => {
    setError("");
    setMessage("");

    try {
      await staffService.deactivate(staffMember.id);
      await loadStaff();
      setMessage("Staff member was deactivated.");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const rows = useMemo(() => {
    return staff.map((staffMember) => ({
      ...staffMember,
      statusText: staffMember.isActive ? "Active" : "Inactive",
      createdAtText: staffMember.createdAtUtc
        ? new Date(staffMember.createdAtUtc).toLocaleString()
        : "",
    }));
  }, [staff]);

  const fetchStaff = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = rows.filter((staffMember) =>
        [
          staffMember.fullName,
          staffMember.email,
          staffMember.role,
          staffMember.statusText,
          staffMember.createdAtText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [rows]
  );

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "statusText", label: "Status" },
    { key: "createdAtText", label: "Created" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Staff</h1>
          <p>Create staff users for check-in and event operations.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={message} onClose={() => setMessage("")} />

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>First Name</label>
          <input
            value={form.firstName}
            disabled={saving}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Last Name</label>
          <input
            value={form.lastName}
            disabled={saving}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            disabled={saving}
            placeholder="name@staff.sunnyhill.com"
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            disabled={saving}
            onChange={(event) => updateField("password", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Active</label>
          <input
            type="checkbox"
            checked={form.isActive}
            disabled={saving}
            onChange={(event) => updateField("isActive", event.target.checked)}
          />
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Staff"}
        </button>
      </form>

      {loading ? (
        <div className="table-panel">
          <p>Loading staff...</p>
        </div>
      ) : (
        <DynamicTable
          columns={columns}
          fetchData={fetchStaff}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
          actions={{
            custom: [
              {
                key: "deactivate",
                label: "Deactivate",
                disabled: (staffMember) => !staffMember.isActive,
                onClick: handleDeactivate,
              },
            ],
          }}
        />
      )}
    </section>
  );
}
