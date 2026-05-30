import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

export default function Alert({ type = "info", message, onClose }) {
  if (!message) return null;

  const Icon =
    type === "success"
      ? FaCheckCircle
      : type === "error"
      ? FaExclamationTriangle
      : FaInfoCircle;

  return (
    <div className={`app-alert app-alert-${type}`} role="alert">
      <Icon />
      <span>{message}</span>

      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close alert">
          ×
        </button>
      )}
    </div>
  );
}