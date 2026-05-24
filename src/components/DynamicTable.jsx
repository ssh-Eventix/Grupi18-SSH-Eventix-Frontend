import { useCallback, useEffect, useState } from "react";
import SearchBar from "./SearchBar.jsx";
import TableSkeleton from "./TableSkeleton.jsx";

export default function DynamicTable({
  columns,
  fetchData,
  actions = {},
  pageSizeOptions = [5, 10, 20, 50],
  refreshKey = 0
}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const hasActions = actions.onEdit || actions.onDelete || actions.onView;

  const loadData = useCallback(async (searchValue = search) => {
    setLoading(true);

    try {
      const res = await fetchData(page, pageSize, searchValue);

      setData(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
      setData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, pageSize, search]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadData(search);
  };

  return (
    <div className="table-panel">
      <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} />

      {loading && (
        <TableSkeleton
          columnsCount={columns.length + (hasActions ? 1 : 0)}
          rowsCount={Math.min(pageSize, 5)}
        />
      )}

      {!loading && data.length === 0 && <p className="status-text">No data found</p>}

      {!loading && data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {hasActions && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}

                  {hasActions && (
                    <td className="actions-cell">
                      {actions.onView && (
                        <button type="button" onClick={() => actions.onView(row)}>
                          View
                        </button>
                      )}

                      {actions.onEdit && (
                        <button type="button" onClick={() => actions.onEdit(row)}>
                          Edit
                        </button>
                      )}

                      {actions.onDelete && (
                        <button type="button" onClick={() => actions.onDelete(row)}>
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))}>
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
          Next
        </button>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
