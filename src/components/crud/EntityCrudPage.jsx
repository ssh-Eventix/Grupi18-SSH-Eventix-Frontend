import { useCallback, useEffect, useState } from "react";
import DynamicTable from "../DynamicTable.jsx";
import { handleApiError } from "../../utils/apiErrorHandler";

const formatValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} items`;
  if (value && typeof value === "object") return JSON.stringify(value);
  return value ?? "";
};

export default function EntityCrudPage({
  title,
  api,
  initialForm,
  fields,
  description,
  readonly = false,
  tableFields,
}) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldActionLoading, setFieldActionLoading] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.getAll();
      setItems(Array.isArray(res) ? res : res.data ?? []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
    setMessage("");
  };

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFieldAction = async (field) => {
    if (!field.action?.onClick) return;

    setError("");
    setMessage("");
    setFieldActionLoading((current) => ({ ...current, [field.name]: true }));

    try {
      await field.action.onClick({
        form,
        setForm,
        updateField,
        setError,
        setMessage,
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setFieldActionLoading((current) => ({ ...current, [field.name]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.update(editingId, form);
      } else {
        await api.create(form);
      }

      setForm(initialForm);
      setEditingId(null);
      loadData();
      setMessage(editingId ? "Record updated." : "Record created.");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...initialForm, ...item });
    setError("");
    setMessage("");
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");

    try {
      await api.delete(id);
      loadData();
      setMessage("Record deleted.");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const visibleFields = tableFields ?? fields;
  const columns = visibleFields.map((field) => ({
    key: field.name,
    label: field.label,
    render: field.render,
  }));

  const fetchTableData = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = items.filter((item) =>
        visibleFields
          .map((field) => {
            const value = field.render ? field.render(item) : formatValue(item[field.name]);
            return typeof value === "string" || typeof value === "number" ? value : formatValue(value);
          })
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
    [items, visibleFields]
  );

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {message && <div className="form-alert success">{message}</div>}

      {!readonly && (
      <form className="dynamic-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className={`form-field ${field.fullWidth ? "full-span" : ""}`} key={field.name}>
            <div className="field-label-row">
              <label>{field.label}</label>
              {field.action && (
                <button
                  className="field-action-button"
                  type="button"
                  title={field.action.title || field.action.label}
                  disabled={fieldActionLoading[field.name]}
                  onClick={() => handleFieldAction(field)}
                >
                  {field.action.icon &&
                    (() => {
                      const Icon = field.action.icon;
                      return <Icon />;
                    })()}
                  <span>
                    {fieldActionLoading[field.name]
                      ? field.action.loadingLabel || "Generating..."
                      : field.action.label}
                  </span>
                </button>
              )}
            </div>

            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                onChange={handleChange}
                value={form[field.name] ?? ""}
                rows={field.rows ?? 4}
                maxLength={field.maxLength}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                name={field.name}
                onChange={handleChange}
                value={form[field.name] ?? ""}
                required={field.required}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {option.label ?? option}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                name={field.name}
                checked={form[field.name] || false}
                onChange={handleChange}
              />
            ) : (
              <input
                type={field.type || "text"}
                name={field.name}
                value={form[field.name] ?? ""}
                onChange={handleChange}
                min={field.min}
                step={field.step}
                maxLength={field.maxLength}
                required={field.required}
              />
            )}
          </div>
        ))}

        <button className="primary-button" type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button type="button" onClick={() => {
            setEditingId(null);
            setForm(initialForm);
            setError("");
            setMessage("");
          }}>
            Cancel
          </button>
        )}
      </form>
      )}

      {loading ? (
        <div className="table-panel">
          <p>Loading...</p>
        </div>
      ) : (
        <DynamicTable
          columns={columns}
          fetchData={fetchTableData}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
          refreshKey={`${items.length}-${loading}-${editingId || ""}`}
          actions={
            readonly
              ? {}
              : {
                  onEdit: handleEdit,
                  onDelete: (item) => handleDelete(item.id),
                }
          }
        />
      )}
    </section>
  );
}
