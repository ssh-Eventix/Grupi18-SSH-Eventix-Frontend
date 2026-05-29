import React, { useEffect, useState } from "react";
import { auditLogsService } from "../../services/auditLogsService";
import "./SuperAdmin.css";

const actionOptions = [
  { label: "All actions", value: "" },
  { label: "Create", value: 1 },
  { label: "Update", value: 2 },
  { label: "Delete", value: 3 },
  { label: "Login", value: 4 },
  { label: "Logout", value: 5 },
  { label: "Payment", value: 6 },
  { label: "Failed payment", value: 7 },
];

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    tenantId: "",
    entityName: "",
    userId: "",
    action: "",
    fromDateUtc: "",
    toDateUtc: "",
    page: 1,
    pageSize: 20,
  });

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
  });

  useEffect(() => {
    loadLogs();
  }, [filters.page]);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const params = {
        ...filters,
        tenantId: filters.tenantId || undefined,
        userId: filters.userId || undefined,
        search: filters.search || undefined,
        entityName: filters.entityName || undefined,
        action: filters.action || undefined,
        fromDateUtc: filters.fromDateUtc || undefined,
        toDateUtc: filters.toDateUtc || undefined,
      };

      const data = await auditLogsService.getAll(params);

      setLogs(data.items || []);
      setPagination({
        totalCount: data.totalCount || 0,
        totalPages: Math.max(1, Math.ceil((data.totalCount || 0) / (data.pageSize || 20))),
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const applyFilters = () => {
    loadLogs();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      tenantId: "",
      entityName: "",
      userId: "",
      action: "",
      fromDateUtc: "",
      toDateUtc: "",
      page: 1,
      pageSize: 20,
    });
  };

  const exportCsv = () => {
    const headers = [
      "Date",
      "Tenant",
      "User",
      "Action",
      "Entity",
      "EntityId",
      "OldValues",
      "NewValues",
    ];

    const rows = logs.map((log) => [
      log.createdAtUtc,
      log.tenantName || log.tenantId || "System",
      log.userEmail || log.userId,
      log.action,
      log.entityName,
      log.entityId,
      cleanCsv(log.oldValues),
      cleanCsv(log.newValues),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value ?? ""}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();

    window.URL.revokeObjectURL(url);
  };

  const cleanCsv = (value) => {
    if (!value) return "";
    return String(value).replaceAll('"', '""');
  };

  const getActionClass = (action) => {
    const normalized = String(action || "").toLowerCase();

    if (normalized.includes("delete") || normalized.includes("failed")) {
      return "badge danger";
    }

    if (normalized.includes("update")) {
      return "badge warning";
    }

    if (normalized.includes("create") || normalized.includes("login")) {
      return "badge success";
    }

    return "badge";
  };

  const formatJson = (value) => {
    if (!value) return "No details";

    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>View system activity, user actions, and entity changes.</p>
        </div>

        <button onClick={exportCsv} disabled={!logs.length}>
          Export CSV
        </button>
      </div>

      <div className="filters-card">
        <input
          name="search"
          placeholder="Search logs..."
          value={filters.search}
          onChange={handleFilterChange}
        />

        <input
          name="tenantId"
          placeholder="Tenant ID..."
          value={filters.tenantId}
          onChange={handleFilterChange}
        />

        <input
          name="entityName"
          placeholder="Entity name..."
          value={filters.entityName}
          onChange={handleFilterChange}
        />

        <input
          name="userId"
          placeholder="User ID..."
          value={filters.userId}
          onChange={handleFilterChange}
        />

        <select
          name="action"
          value={filters.action}
          onChange={handleFilterChange}
        >
          {actionOptions.map((action) => (
          <option key={action.label} value={action.value}>
            {action.label}
          </option>
        ))}
        </select>

        <input
          type="date"
          name="fromDateUtc"
          value={filters.fromDateUtc}
          onChange={handleFilterChange}
        />

        <input
          type="date"
          name="toDateUtc"
          value={filters.toDateUtc}
          onChange={handleFilterChange}
        />

        <button onClick={applyFilters}>Apply</button>
        <button onClick={clearFilters}>Clear</button>
      </div>

      <div className="table-card">
        {loading ? (
          <p>Loading audit logs...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tenant</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                    <React.Fragment key={log.id}>
                    <tr>
                      <td>{new Date(log.createdAtUtc).toLocaleString()}</td>
                      <td>{log.tenantName || log.tenantId || "System"}</td>
                      <td>{log.userEmail || log.userId}</td>
                      <td>
                        <span className={getActionClass(log.action)}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entityName}</td>
                      <td>{log.entityId}</td>
                      <td>
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                        >
                          {expandedId === log.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {expandedId === log.id && (
                      <tr>
                        <td colSpan="7">
                          <div className="json-details">
                            <h4>Old Values</h4>
                            <pre>{formatJson(log.oldValues)}</pre>

                            <h4>New Values</h4>
                            <pre>{formatJson(log.newValues)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button
          disabled={filters.page <= 1}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
          }
        >
          Previous
        </button>

        <span>
          Page {filters.page} of {pagination.totalPages}
        </span>

        <button
          disabled={filters.page >= pagination.totalPages}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}