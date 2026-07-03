# Manual Auth Supabase Node Backend

Simple Express backend using Supabase Postgres through Prisma. Authentication is implemented manually with email/password, bcrypt password hashes, backend-issued JWTs, and role-based authorization.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase database connection string.

For Supabase, use the **Session pooler** connection string if the direct database host is not reachable. Use port `5432`, not the Transaction pooler port `6543`, when running Prisma schema commands:

```env
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_DATABASE_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"
```

Find it in Supabase Dashboard -> Project Settings -> Database -> Connection string -> Session pooler.

If `npm run db:push` appears stuck at the datasource line, stop it with `Ctrl+C` and check that your `DATABASE_URL` is not using `:6543`.

3. Create the database table from the Prisma schema:

```bash
npm run db:push
```

4. Start the server:

```bash
npm run dev
```

## Database

The database is modeled after Northwind, adjusted for a cellphone store. `prisma/schema.prisma` defines users, categories, suppliers, products, inventory, customers, orders, order items, delivery companies, employees, and stock movements.

Run `npm run db:push` to create or update the tables in Supabase.

Use the Supabase Session pooler Postgres connection string for `DATABASE_URL` if `db.<project-ref>.supabase.co:5432` cannot be reached. Keep `.env` server-only and never expose it to browsers.

## Auth Model

Requests to protected routes must include this backend's JWT:

```http
Authorization: Bearer <jwt_from_login>
```

Roles are stored in `public.users.roles`.

Default roles:

- `admin`: all store permissions, including user role updates.
- `manager`: product, category, supplier, inventory, customer, delivery company, employee, and order management.
- `staff`: read master data, products, inventory, customers, employees, delivery companies, and create customers/orders.

## Routes

- `GET /health` public health check.
- `POST /api/signup` creates a user. Body: `{ "email": "a@b.com", "password": "secret123" }`
- `POST /api/login` returns a JWT. Body: `{ "email": "a@b.com", "password": "secret123" }`
- `GET /api/me` returns the authenticated user.
- `GET /api/user-area` requires any authenticated user.
- `GET /api/admin-area` requires the `admin` role.
- `GET /api/manager-area` requires either `admin` or `manager`.
- `GET /api/categories` requires `categories:read`.
- `POST /api/categories` requires `categories:create`. Body: `{ "name": "Smartphones", "description": "Unlocked and carrier phones" }`
- `PATCH /api/categories/:id` requires `categories:update`.
- `GET /api/suppliers` requires `suppliers:read`.
- `POST /api/suppliers` requires `suppliers:create`. Body: `{ "companyName": "Apple Distribution", "contactName": "Sales Desk", "phone": "555-0101", "country": "USA" }`
- `PATCH /api/suppliers/:id` requires `suppliers:update`.
- `GET /api/products` requires `products:read`.
- `POST /api/products` requires `products:create`. Body: `{ "sku": "IPH15-128-BLK", "name": "iPhone 15 128GB", "brand": "Apple", "model": "iPhone 15", "categoryId": "...", "supplierId": "...", "quantityPerUnit": "1 phone / box", "price": 799, "unitsInStock": 5, "unitsOnOrder": 0, "reorderLevel": 2 }`
- `PATCH /api/products/:id` requires `products:update`.
- `DELETE /api/products/:id` requires `products:delete` and marks the product inactive.
- `GET /api/inventory` requires `inventory:read`.
- `POST /api/inventory/adjustments` requires `inventory:adjust`. Body: `{ "productId": "...", "type": "in", "quantity": 10, "note": "Restock" }`
- `GET /api/customers` requires `customers:read`.
- `POST /api/customers` requires `customers:create`. Body: `{ "name": "Jane Buyer", "phone": "555-0100", "email": "jane@example.com", "address": "123 Main St" }`
- `PATCH /api/customers/:id` requires `customers:update`.
- `GET /api/delivery-companies` requires `delivery_companies:read`.
- `POST /api/delivery-companies` requires `delivery_companies:create`. Body: `{ "companyName": "Fast Delivery", "phone": "555-0199", "trackingUrl": "https://delivery.example/track" }`
- `PATCH /api/delivery-companies/:id` requires `delivery_companies:update`.
- `GET /api/employees` requires `employees:read`.
- `POST /api/employees` requires `employees:create`. Body: `{ "firstName": "Nina", "lastName": "Sales", "title": "Store Manager", "hireDate": "2026-07-03" }`
- `PATCH /api/employees/:id` requires `employees:update`.
- `GET /api/orders` requires `orders:read`.
- `POST /api/orders` requires `orders:create`. Body: `{ "customerId": "...", "employeeId": "...", "deliveryCompanyId": "...", "freight": 3.5, "shipName": "Jane Buyer", "shipAddress": "123 Main St", "shipCity": "Bangkok", "shipCountry": "Thailand", "items": [{ "productId": "...", "quantity": 1, "discount": 0.1 }] }`
- `PATCH /api/orders/:id/status` requires `orders:update`. Body: `{ "status": "completed" }`
- `PATCH /api/users/:id/roles` requires `users:update_roles`. Body: `{ "roles": ["manager"] }`
