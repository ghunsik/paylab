import { standardRows } from "@/lib/site-content";

export function AnnualStandards() {
  return (
    <table className="data-table annual-standards" aria-label="2026년과 2027년 적용 기준 비교">
      <thead>
        <tr>
          <th scope="col">항목</th>
          <th scope="col">2026년</th>
          <th scope="col">2027년</th>
        </tr>
      </thead>
      {standardRows.map((row) => (
        <tbody key={row.label}>
          <tr>
            <th scope="rowgroup">{row.label}</th>
            <td>{row.y2026}</td>
            <td>
              {row.changed && <span className="change-label">변경</span>}
              {row.y2027}
            </td>
          </tr>
          {row.note && (
            <tr>
              <td colSpan={3} className="standard-note">{row.note}</td>
            </tr>
          )}
        </tbody>
      ))}
    </table>
  );
}
