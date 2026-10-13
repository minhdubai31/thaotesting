import { PAGE_SIZES } from "../lib/format";

export default function Pager({ meta, onPage, onPageSize }) {
  if (!meta) return null;

  const { page, totalPages, total, pageSize } = meta;

  return (
    <div className="pager">
      <span className="muted">
        {total} item{total === 1 ? "" : "s"}
      </span>
      <div className="pager-buttons">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹ Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next ›
        </button>
      </div>
      <label className="page-size">
        Per page
        <select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
