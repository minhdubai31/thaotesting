const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Reads ?page=&pageSize= from the query string. Invalid values fall back to defaults.
function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requested = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function buildMeta({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

// Reads ?sort=&order=. Only fields in `allowed` are accepted.
function parseSort(query = {}, allowed, fallbackField, fallbackOrder = "desc") {
  const field = allowed.includes(query.sort) ? query.sort : fallbackField;
  const order = query.order === "asc" || query.order === "desc" ? query.order : fallbackOrder;

  return { [field]: order };
}

// Trimmed search text, or null when empty.
function readSearch(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

module.exports = {
  buildMeta,
  parsePagination,
  parseSort,
  readSearch
};
