import { useEffect, useState } from "react";

export default function EntityCrudPage({ title, api, initialForm, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    const res = await api.getAll();
    setItems(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await api.update(editingId, form);
    } else {
      await api.create(form);
    }

    setForm(initialForm);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...initialForm, ...item });
  };

  const handleDelete = async (id) => {
    await api.delete(id);
    loadData();
  };

  return (
    <div>
      <h2>{title}</h2>

      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name}>
            <label>{field.label}</label>

            {field.type === "checkbox" ? (
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

        <button type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button type="button" onClick={() => {
            setEditingId(null);
            setForm(initialForm);
          }}>
            Cancel
          </button>
        )}
      </form>

      <table border="1" cellPadding="8">
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
                  {typeof item[field.name] === "boolean"
                    ? item[field.name] ? "Yes" : "No"
                    : item[field.name]}
                </td>
              ))}
              <td>
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}