import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "../../utils/apiErrorHandler";

const formatValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} items`;
  if (value && typeof value === "object") return JSON.stringify(value);
  return value ?? "";
};

export default function EntityCrudPage({ title, api, initialForm, fields, description, readonly = false }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.update(editingId, form);
      } else {
        await api.create(form);
      }

      setForm(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...initialForm, ...item });
  };

  const handleDelete = async (id) => {
    setError("");

    try {
      await api.delete(id);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <button type="button" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="form-alert">{error}</div>}

      {!readonly && (
      <form className="dynamic-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="form-field" key={field.name}>
            <label>{field.label}</label>

            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                onChange={handleChange}
                value={form[field.name] ?? ""}
              />
            ) : field.type === "select" ? (
              <select name={field.name} onChange={handleChange} value={form[field.name] ?? ""}>
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
              />
            )}
          </div>
        ))}

        <button className="primary-button" type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button type="button" onClick={() => {
            setEditingId(null);
            setForm(initialForm);
          }}>
            Cancel
          </button>
        )}
      </form>
      )}

      <div className="table-panel">
      {loading ? <p>Loading...</p> : (
      <table>
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.name}>{field.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {fields.map((field) => (
                <td key={field.name}>
                  {formatValue(item[field.name])}
                </td>
              ))}
              <td>
                {!readonly && <button onClick={() => handleEdit(item)}>Edit</button>}
                {!readonly && <button onClick={() => handleDelete(item.id)}>Delete</button>}
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
