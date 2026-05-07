export default function TableSkeleton({ columnsCount = 4, rowsCount = 5 }) {
  return (
    <div className="table-wrap" aria-label="Loading table data">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columnsCount }).map((_, index) => (
              <th key={index}>
                <span className="skeleton skeleton-heading" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowsCount }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columnsCount }).map((_, colIndex) => (
                <td key={colIndex}>
                  <span className="skeleton skeleton-line" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
