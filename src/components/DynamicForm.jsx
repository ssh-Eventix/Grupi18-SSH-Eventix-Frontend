/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

export default function DynamicForm({
  fields,
  onSubmit,
  initialValues = {},
  submitText = "Save",
  loadingText = "Saving...",
  loading = false
}) {
  const [formData, setFormData] = useState(initialValues || {});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(initialValues || {});
    setErrors({});
  }, [initialValues]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined
    }));
  };

  const validate = () => {
    const newErrors = {};

    fields.forEach((field) => {
      const value = formData[field.name];
      const isEmpty = value === undefined || value === null || String(value).trim() === "";

      if (field.required && isEmpty) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(formData);
  };

  const renderField = (field) => {
    const value = formData[field.name] ?? "";

    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          placeholder={field.placeholder || ""}
          disabled={loading || field.disabled}
          rows={field.rows || 4}
          onChange={(e) => handleChange(field.name, e.target.value)}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={value}
          disabled={loading || field.disabled}
          onChange={(e) => handleChange(field.name, e.target.value)}
        >
          <option value="">{field.placeholder || "Select"}</option>
          {field.options?.map((opt) => (
            <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
              {opt.label ?? opt.name}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type || "text"}
        value={value}
        placeholder={field.placeholder || ""}
        disabled={loading || field.disabled}
        onChange={(e) => handleChange(field.name, e.target.value)}
      />
    );
  };

  return (
    <form className="dynamic-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div className="form-field" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required-mark"> *</span>}
          </label>

          {renderField(field)}

          {errors[field.name] && <span className="field-error">{errors[field.name]}</span>}
        </div>
      ))}

      <button className="form-submit" type="submit" disabled={loading}>
        {loading ? loadingText : submitText}
      </button>
    </form>
  );
}
