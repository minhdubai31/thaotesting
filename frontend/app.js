// The API is served from the same origin as this page. When the page is opened as a local file,
// fall back to the deployed backend. Change it in the API settings box if needed.
const DEFAULT_API_BASE =
  location.protocol.startsWith("http") ? location.origin : "https://thaotesting-git-main-minhdubai.vercel.app";

const storage = {
  get(key, fallback = "") {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be blocked (private mode). The app still works for this page load.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Same as above.
    }
  },
};

const state = {
  apiBase: normalizeBase(storage.get("apiBase", DEFAULT_API_BASE)),
  token: storage.get("token", ""),
  user: null,
  tab: "products",
  mode: "login",
  search: "",
  open: { product: false, customer: false, order: false, adjust: false },
  data: {
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
    deliveries: [],
    orders: [],
    inventory: [],
  },
};

const app = document.getElementById("app");

function normalizeBase(value) {
  return String(value || DEFAULT_API_BASE).trim().replace(/\/+$/, "") || DEFAULT_API_BASE;
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}

const vnd = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateText = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

function flattenErrors(errors) {
  if (!errors) return "";
  return Object.entries(errors)
    .map(([key, value]) => {
      const text = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      return `${key}: ${text}`;
    })
    .join(" · ");
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(`${state.apiBase}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(`Cannot reach the API at ${state.apiBase}.`);
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response (for example a Vercel error page).
  }

  if (!response.ok || !json?.success) {
    const details = flattenErrors(json?.errors);
    const message = json?.message || `Request failed (${response.status}).`;
    const error = new Error(details ? `${message} ${details}` : message);
    error.status = response.status;
    throw error;
  }

  return json.data;
}

function setNotice(text, type = "") {
  const box = document.getElementById("notice");
  if (!box) return;
  box.className = `notice ${type}`.trim();
  box.textContent = text || "";
  box.hidden = !text;
}

async function loadAll() {
  const sources = {
    products: ["/api/products", (d) => d.products],
    categories: ["/api/categories", (d) => d.categories],
    suppliers: ["/api/suppliers", (d) => d.suppliers],
    customers: ["/api/customers", (d) => d.customers],
    deliveries: ["/api/delivery-companies", (d) => d.deliveryCompanies],
    orders: ["/api/orders", (d) => d.orders],
    inventory: ["/api/inventory", (d) => d.inventory],
  };

  const entries = Object.entries(sources);
  const results = await Promise.allSettled(entries.map(([, [path]]) => api(path)));

  const failures = [];
  results.forEach((result, index) => {
    const [key, [, pick]] = entries[index];
    if (result.status === "fulfilled") {
      state.data[key] = pick(result.value) || [];
    } else {
      failures.push(`${key}: ${result.reason.message}`);
    }
  });

  return failures;
}

async function refresh() {
  const failures = await loadAll();
  render();
  if (failures.length) {
    setNotice(`Some data could not be loaded. ${failures.join(" | ")}`, "error");
  }
}

function logout(message = "") {
  state.token = "";
  state.user = null;
  storage.remove("token");
  state.mode = "login";
  state.data = Object.fromEntries(Object.keys(state.data).map((key) => [key, []]));
  render();
  if (message) setNotice(message, "error");
}

function settingsHtml() {
  return `
    <details class="settings">
      <summary>API settings</summary>
      <label>
        API base URL
        <input data-action="api-base" value="${esc(state.apiBase)}" />
      </label>
    </details>`;
}

function renderAuth() {
  const isLogin = state.mode === "login";
  app.innerHTML = `
    <div class="container auth">
      <div class="card">
        <h2>${isLogin ? "Sign in" : "Create an account"}</h2>
        <div id="notice" class="notice" hidden></div>
        <form data-form="auth" class="auth-form">
          ${
            isLogin
              ? `<label>Username or email
                  <input name="identifier" required autocomplete="username" />
                </label>`
              : `<label>Email
                  <input type="email" name="email" required autocomplete="email" />
                </label>
                <label>Username (optional)
                  <input name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" autocomplete="username" />
                </label>`
          }
          <label>Password
            <input type="password" name="password" required ${isLogin ? "" : 'minlength="8"'}
              autocomplete="${isLogin ? "current-password" : "new-password"}" />
          </label>
          <button class="primary" type="submit">${isLogin ? "Sign in" : "Sign up"}</button>
        </form>
        <p class="switch">
          ${isLogin ? "No account yet?" : "Already have an account?"}
          <button type="button" data-action="mode">${isLogin ? "Sign up" : "Sign in"}</button>
        </p>
        ${settingsHtml()}
      </div>
    </div>`;
}

function tabButton(key, label) {
  return `<button type="button" data-action="tab" data-tab="${key}"
    class="${state.tab === key ? "active" : ""}">${label}</button>`;
}

function renderShell(content) {
  const roles = (state.user?.roles || []).join(", ");
  app.innerHTML = `
    <header class="topbar">
      <h1>Cellphone Store Admin</h1>
      <nav class="tabs">
        ${tabButton("products", "Products")}
        ${tabButton("orders", "Orders")}
        ${tabButton("customers", "Customers")}
        ${tabButton("inventory", "Inventory")}
      </nav>
      <div class="muted">
        ${esc(state.user?.email)} <span class="muted">(${esc(roles)})</span>
        <button type="button" data-action="logout">Log out</button>
      </div>
    </header>
    <main class="container">
      <div id="notice" class="notice" hidden></div>
      ${content}
      ${settingsHtml()}
    </main>`;
}

function productOptions(selectedId = "") {
  return state.data.products
    .map((p) => `<option value="${esc(p.id)}" ${p.id === selectedId ? "selected" : ""}>${esc(p.name)} — ${vnd(p.price)}</option>`)
    .join("");
}

function selectOptions(list, labelKey, { placeholder = "—", selectedId = "" } = {}) {
  return `<option value="">${esc(placeholder)}</option>` +
    list
      .map((item) => `<option value="${esc(item.id)}" ${item.id === selectedId ? "selected" : ""}>${esc(item[labelKey])}</option>`)
      .join("");
}

function filteredProducts() {
  const query = state.search.trim().toLowerCase();
  if (!query) return state.data.products;
  return state.data.products.filter((p) =>
    [p.name, p.sku, p.brand, p.model, p.category].some((value) =>
      String(value || "").toLowerCase().includes(query)
    )
  );
}

function productRowsHtml() {
  const rows = filteredProducts()
    .map((p) => {
      const low = p.unitsInStock <= p.reorderLevel;
      return `<tr>
        <td>${esc(p.sku)}</td>
        <td class="wrap">${esc(p.name)}</td>
        <td>${esc(p.categoryRef?.name || p.category)}</td>
        <td class="num">${vnd(p.price)}</td>
        <td class="num ${low ? "stock-low" : ""}">${p.unitsInStock}</td>
        <td>${p.isActive ? '<span class="badge ok">Active</span>' : '<span class="badge">Inactive</span>'}</td>
        <td>${p.isActive ? `<button type="button" class="danger" data-action="deactivate" data-id="${esc(p.id)}">Deactivate</button>` : ""}</td>
      </tr>`;
    })
    .join("");

  return `<div class="table-wrap"><table>
    <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th class="num">Price</th><th class="num">Stock</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="muted">No products found.</td></tr>'}</tbody>
  </table></div>`;
}

function renderProducts() {
  const form = state.open.product
    ? `<form data-form="product" class="row" style="margin-top:12px">
        <label>SKU <input name="sku" required /></label>
        <label>Name <input name="name" required /></label>
        <label>Brand <input name="brand" required /></label>
        <label>Model <input name="model" required /></label>
        <label>Category
          <select name="categoryId">${selectOptions(state.data.categories, "name", { placeholder: "No category" })}</select>
        </label>
        <label>Supplier
          <select name="supplierId">${selectOptions(state.data.suppliers, "companyName", { placeholder: "No supplier" })}</select>
        </label>
        <label>Price (VND) <input name="price" type="number" min="0" step="1000" required /></label>
        <label>Stock <input name="quantity" type="number" min="0" value="0" required /></label>
        <label>Reorder level <input name="reorderLevel" type="number" min="0" value="5" required /></label>
        <button class="primary" type="submit">Save product</button>
      </form>`
    : "";

  return `
    <section class="card">
      <div class="row">
        <label style="flex:2 1 240px">Search
          <input type="search" placeholder="Name, SKU, brand, category…" value="${esc(state.search)}" data-action="search" />
        </label>
        <button type="button" data-action="toggle" data-open="product">${state.open.product ? "Close form" : "Add product"}</button>
      </div>
      ${form}
    </section>
    <section class="card" id="products-table">${productRowsHtml()}</section>`;
}

function renderOrders() {
  const rows = state.data.orders
    .map((o) => {
      const items = (o.items || []).map((i) => `${esc(i.product?.name || "")} × ${i.quantity}`).join("<br>");
      return `<tr>
        <td>${dateText(o.orderDate)}</td>
        <td class="wrap">${esc(o.customer?.name || o.shipName || "Walk-in")}</td>
        <td class="wrap">${items}</td>
        <td>${esc(o.deliveryCompany?.companyName || "—")}</td>
        <td class="num">${vnd(o.totalAmount)}</td>
        <td>
          <select data-action="status" data-id="${esc(o.id)}" style="width:auto">
            ${["pending", "completed", "cancelled"]
              .map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
        </td>
      </tr>`;
    })
    .join("");

  const form = state.open.order
    ? `<form data-form="order" class="row" style="margin-top:12px">
        <label>Customer
          <select name="customerId">${selectOptions(state.data.customers, "name", { placeholder: "Walk-in" })}</select>
        </label>
        <label>Product
          <select name="productId" required>${productOptions()}</select>
        </label>
        <label>Quantity <input name="quantity" type="number" min="1" value="1" required /></label>
        <label>Delivery
          <select name="deliveryCompanyId">${selectOptions(state.data.deliveries, "companyName", { placeholder: "None" })}</select>
        </label>
        <label>Freight (VND) <input name="freight" type="number" min="0" step="1000" value="30000" /></label>
        <button class="primary" type="submit">Create order</button>
      </form>`
    : "";

  return `
    <section class="card">
      <div class="row">
        <h2 style="flex:1">Orders</h2>
        <button type="button" data-action="toggle" data-open="order">${state.open.order ? "Close form" : "New order"}</button>
      </div>
      ${form}
    </section>
    <section class="card"><div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Delivery</th><th class="num">Total</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">No orders yet.</td></tr>'}</tbody>
    </table></div></section>`;
}

function renderCustomers() {
  const rows = state.data.customers
    .map((c) => `<tr>
      <td class="wrap">${esc(c.name)}</td>
      <td>${esc(c.phone || "—")}</td>
      <td>${esc(c.email || "—")}</td>
      <td class="wrap">${esc(c.address || "—")}</td>
    </tr>`)
    .join("");

  const form = state.open.customer
    ? `<form data-form="customer" class="row" style="margin-top:12px">
        <label>Name <input name="name" required /></label>
        <label>Phone <input name="phone" /></label>
        <label>Email <input name="email" type="email" /></label>
        <label>Address <input name="address" /></label>
        <button class="primary" type="submit">Save customer</button>
      </form>`
    : "";

  return `
    <section class="card">
      <div class="row">
        <h2 style="flex:1">Customers</h2>
        <button type="button" data-action="toggle" data-open="customer">${state.open.customer ? "Close form" : "Add customer"}</button>
      </div>
      ${form}
    </section>
    <section class="card"><div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No customers yet.</td></tr>'}</tbody>
    </table></div></section>`;
}

function renderInventory() {
  const rows = state.data.inventory
    .map((item) => {
      const low = item.quantity <= (item.product?.reorderLevel ?? 0);
      return `<tr>
        <td class="wrap">${esc(item.product?.name || "")}</td>
        <td>${esc(item.product?.sku || "")}</td>
        <td class="num ${low ? "stock-low" : ""}">${item.quantity}</td>
        <td class="num">${item.product?.reorderLevel ?? 0}</td>
        <td>${low ? '<span class="badge warn">Reorder</span>' : '<span class="badge ok">OK</span>'}</td>
      </tr>`;
    })
    .join("");

  const form = state.open.adjust
    ? `<form data-form="adjust" class="row" style="margin-top:12px">
        <label>Product
          <select name="productId" required>${productOptions()}</select>
        </label>
        <label>Type
          <select name="type">
            <option value="in">In (received)</option>
            <option value="out">Out (removed)</option>
            <option value="audit">Audit (set count)</option>
          </select>
        </label>
        <label>Quantity <input name="quantity" type="number" min="0" value="1" required /></label>
        <label>Note <input name="note" /></label>
        <button class="primary" type="submit">Record</button>
      </form>`
    : "";

  return `
    <section class="card">
      <div class="row">
        <h2 style="flex:1">Inventory</h2>
        <button type="button" data-action="toggle" data-open="adjust">${state.open.adjust ? "Close form" : "Adjust stock"}</button>
      </div>
      ${form}
    </section>
    <section class="card"><div class="table-wrap"><table>
      <thead><tr><th>Product</th><th>SKU</th><th class="num">On hand</th><th class="num">Reorder at</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="muted">No inventory records.</td></tr>'}</tbody>
    </table></div></section>`;
}

const tabRenderers = {
  products: renderProducts,
  orders: renderOrders,
  customers: renderCustomers,
  inventory: renderInventory,
};

function render() {
  if (!state.token || !state.user) {
    renderAuth();
    return;
  }
  renderShell(tabRenderers[state.tab]());
}

async function handleSubmit(event) {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();

  const kind = form.dataset.form;
  const values = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    if (kind === "auth") {
      const path = state.mode === "login" ? "/api/login" : "/api/signup";
      const body = state.mode === "login" ? { identifier: values.identifier, password: values.password } : values;
      const data = await api(path, { method: "POST", body });
      state.token = data.token;
      state.user = data.user;
      storage.set("token", data.token);
      await refresh();
      setNotice("Signed in.", "success");
      return;
    }

    if (kind === "product") {
      await api("/api/products", {
        method: "POST",
        body: {
          sku: values.sku,
          name: values.name,
          brand: values.brand,
          model: values.model,
          category: state.data.categories.find((c) => c.id === values.categoryId)?.name || "phone",
          categoryId: values.categoryId || null,
          supplierId: values.supplierId || null,
          price: Number(values.price),
          quantity: Number(values.quantity),
          reorderLevel: Number(values.reorderLevel),
        },
      });
      state.open.product = false;
      await refresh();
      setNotice("Product saved.", "success");
      return;
    }

    if (kind === "customer") {
      await api("/api/customers", { method: "POST", body: values });
      state.open.customer = false;
      await refresh();
      setNotice("Customer saved.", "success");
      return;
    }

    if (kind === "order") {
      await api("/api/orders", {
        method: "POST",
        body: {
          customerId: values.customerId || null,
          deliveryCompanyId: values.deliveryCompanyId || null,
          freight: Number(values.freight || 0),
          items: [{ productId: values.productId, quantity: Number(values.quantity) }],
        },
      });
      state.open.order = false;
      await refresh();
      setNotice("Order created. Stock was reduced.", "success");
      return;
    }

    if (kind === "adjust") {
      await api("/api/inventory/adjustments", {
        method: "POST",
        body: {
          productId: values.productId,
          type: values.type,
          quantity: Number(values.quantity),
          note: values.note || undefined,
        },
      });
      state.open.adjust = false;
      await refresh();
      setNotice("Stock updated.", "success");
    }
  } catch (error) {
    if (kind !== "auth" && error.status === 401) return logout("Your session expired. Please sign in again.");
    setNotice(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;

  if (action === "mode") {
    state.mode = state.mode === "login" ? "signup" : "login";
    return render();
  }

  if (action === "logout") return logout();

  if (action === "tab") {
    state.tab = target.dataset.tab;
    return render();
  }

  if (action === "toggle") {
    const key = target.dataset.open;
    state.open[key] = !state.open[key];
    return render();
  }

  if (action === "deactivate") {
    if (!confirm("Deactivate this product? It will be hidden from sales.")) return;
    try {
      await api(`/api/products/${target.dataset.id}`, { method: "DELETE" });
      await refresh();
      setNotice("Product deactivated.", "success");
    } catch (error) {
      setNotice(error.message, "error");
    }
  }
}

async function handleChange(event) {
  const target = event.target;

  if (target.dataset.action === "api-base") {
    state.apiBase = normalizeBase(target.value);
    storage.set("apiBase", state.apiBase);
    return;
  }

  if (target.dataset.action === "status") {
    try {
      await api(`/api/orders/${target.dataset.id}/status`, {
        method: "PATCH",
        body: { status: target.value },
      });
      await refresh();
      setNotice("Order status updated.", "success");
    } catch (error) {
      setNotice(error.message, "error");
    }
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.dataset.action !== "search") return;

  // Update only the table so the search box keeps focus while typing.
  state.search = target.value;
  const table = document.getElementById("products-table");
  if (table) table.innerHTML = productRowsHtml();
}

document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("change", handleChange);
document.addEventListener("input", handleInput);

async function boot() {
  if (state.token) {
    try {
      state.user = (await api("/api/me")).user;
      await refresh();
      return;
    } catch (error) {
      if (error.status === 401) {
        state.token = "";
        storage.remove("token");
      } else {
        render();
        setNotice(error.message, "error");
        return;
      }
    }
  }
  render();
}

boot();
