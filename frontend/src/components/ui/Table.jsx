// columns: [{ key, header, render?: (row) => node, align?: 'right' }]
export default function Table({ columns, rows, rowKey = 'id' }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="bg-fill text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-t border-line">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
