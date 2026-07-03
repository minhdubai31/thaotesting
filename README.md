# Manual Auth Supabase Node Backend

Express backend for a cellphone-store inventory/order system. It uses Supabase Postgres through Prisma, manual email/password authentication, bcrypt password hashes, backend-issued JWTs, role-based authorization, and permission-based route guards.

## Base URL

Production:

```text
https://thaotesting-git-main-minhdubai.vercel.app
```

Local development:

```text
http://localhost:3000
```

All API routes are under `/api` except the public health check.

Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

The raw OpenAPI document is available at:

```text
http://localhost:3000/api-docs.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase database connection string.

For Supabase, use the Session pooler connection string if the direct database host is not reachable. Use port `5432`, not the Transaction pooler port `6543`, when running Prisma schema commands.

```env
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_DATABASE_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

Find the database URL in Supabase Dashboard -> Project Settings -> Database -> Connection string -> Session pooler.

3. Create or update the database tables:

```bash
npm run db:push
```

4. Start the server:

```bash
npm run dev
```

## Scripts

```bash
npm run dev          # Start with nodemon
npm start            # Start with node
npm run build        # Generate Prisma client
npm run db:push      # Push Prisma schema to the database
npm run db:generate  # Generate Prisma client
npm run db:seed      # Insert Vietnamese sample data
```

## Seed Data

Run this after `npm run db:push` to insert Vietnamese sample data:

```bash
npm run db:seed
```

The seed is idempotent and uses fixed IDs/upserts, so running it again updates the same sample rows instead of creating duplicates.

Seeded data includes:

- 20 users
- 20 categories
- 20 suppliers
- 20 delivery companies
- 20 employees
- 50 customers
- 50 products
- 50 inventory items
- 50 orders
- 50 order items
- 50 stock movements

Seeded users use this default password:

```text
secret123
```

## Database

The database is modeled after Northwind and adjusted for a cellphone store. `prisma/schema.prisma` defines users, categories, suppliers, products, inventory, customers, orders, order items, delivery companies, employees, and stock movements.

Keep `.env` server-only and never expose it to browsers.

## Authentication

Protected routes require a JWT returned from `/api/login` or `/api/signup`.

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Roles are stored in `public.users.roles`.

Default roles:

- `admin`: all store permissions, including user role updates.
- `manager`: product, category, supplier, inventory, customer, delivery company, employee, and order management.
- `staff`: read master data, products, inventory, customers, employees, delivery companies, and create customers/orders.

## Response Format

All responses use the same envelope.

Success:

```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "product": {}
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email already exists."]
  }
}
```

## Quick Start With Production URL

Signup:

```bash
curl -X POST https://thaotesting-git-main-minhdubai.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"secret123\"}"
```

Login:

```bash
curl -X POST https://thaotesting-git-main-minhdubai.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"secret123\"}"
```

Use the returned token for protected routes:

```bash
curl https://thaotesting-git-main-minhdubai.vercel.app/api/products \
  -H "Authorization: Bearer <token>"
```

## API Reference

### Health

#### `GET /health`

Public health check.

Sample request body: none.

### Auth

#### `POST /api/signup`

Creates a new user and returns a JWT.

Sample request body:

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Validation:

- `email` is required, must be a valid email, and must not already exist.
- `password` is required and must be at least 8 characters.

#### `POST /api/login`

Logs in a user and returns a JWT.

Sample request body:

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

#### `GET /api/me`

Returns the authenticated user.

Sample request body: none.

#### `GET /api/user-area`

Requires any authenticated user.

Sample request body: none.

#### `GET /api/admin-area`

Requires the `admin` role.

Sample request body: none.

#### `GET /api/manager-area`

Requires either the `admin` or `manager` role.

Sample request body: none.

### Categories

#### `GET /api/categories`

Requires `categories:read`.

Sample request body: none.

#### `POST /api/categories`

Requires `categories:create`.

Sample request body:

```json
{
  "name": "Smartphones",
  "description": "Unlocked and carrier phones",
  "picture": "https://example.com/images/smartphones.png"
}
```

#### `PATCH /api/categories/:id`

Requires `categories:update`.

Sample request body:

```json
{
  "name": "Flagship Smartphones",
  "description": "Premium unlocked and carrier phones",
  "picture": "https://example.com/images/flagship-smartphones.png"
}
```

### Suppliers

#### `GET /api/suppliers`

Requires `suppliers:read`.

Sample request body: none.

#### `POST /api/suppliers`

Requires `suppliers:create`.

Sample request body:

```json
{
  "companyName": "Apple Distribution",
  "contactName": "Sales Desk",
  "contactTitle": "Account Manager",
  "address": "1 Infinite Loop",
  "city": "Cupertino",
  "region": "CA",
  "postalCode": "95014",
  "country": "USA",
  "phone": "555-0101",
  "fax": "555-0102",
  "homepage": "https://apple.example.com"
}
```

#### `PATCH /api/suppliers/:id`

Requires `suppliers:update`.

Sample request body:

```json
{
  "companyName": "Apple Distribution Vietnam",
  "contactName": "Retail Sales",
  "phone": "555-0199",
  "country": "Vietnam"
}
```

### Delivery Companies

#### `GET /api/delivery-companies`

Requires `delivery_companies:read`.

Sample request body: none.

#### `POST /api/delivery-companies`

Requires `delivery_companies:create`.

Sample request body:

```json
{
  "companyName": "Fast Delivery",
  "phone": "555-0199",
  "trackingUrl": "https://delivery.example.com/track"
}
```

#### `PATCH /api/delivery-companies/:id`

Requires `delivery_companies:update`.

Sample request body:

```json
{
  "companyName": "Fast Delivery Express",
  "phone": "555-0200",
  "trackingUrl": "https://express.example.com/track"
}
```

### Employees

#### `GET /api/employees`

Requires `employees:read`.

Sample request body: none.

#### `POST /api/employees`

Requires `employees:create`.

Sample request body:

```json
{
  "firstName": "Nina",
  "lastName": "Sales",
  "title": "Store Manager",
  "titleOfCourtesy": "Ms.",
  "birthDate": "1995-05-20",
  "hireDate": "2026-07-03",
  "address": "123 Retail Street",
  "city": "Ho Chi Minh City",
  "region": "HCMC",
  "postalCode": "700000",
  "country": "Vietnam",
  "homePhone": "555-0123",
  "extension": "101",
  "photo": "https://example.com/photos/nina.png",
  "notes": "Store manager for District 1 branch",
  "reportsToId": "00000000-0000-4000-8000-000000000001",
  "photoPath": "/employees/nina.png"
}
```

#### `PATCH /api/employees/:id`

Requires `employees:update`.

Sample request body:

```json
{
  "title": "Regional Store Manager",
  "homePhone": "555-0456",
  "reportsToId": "00000000-0000-4000-8000-000000000002",
  "notes": "Promoted to regional manager"
}
```

### Products

#### `GET /api/products`

Requires `products:read`.

Sample request body: none.

#### `POST /api/products`

Requires `products:create`.

Sample request body:

```json
{
  "sku": "IPH15-128-BLK",
  "name": "iPhone 15 128GB",
  "brand": "Apple",
  "model": "iPhone 15",
  "category": "phone",
  "categoryId": "00000000-0000-4000-8000-000000000010",
  "supplierId": "00000000-0000-4000-8000-000000000020",
  "quantityPerUnit": "1 phone / box",
  "price": 799,
  "unitsInStock": 5,
  "unitsOnOrder": 0,
  "reorderLevel": 2,
  "discontinued": false,
  "isActive": true
}
```

Notes:

- `price` can also be sent as `unitPrice`.
- Initial inventory is created from `quantity` or `unitsInStock`.

#### `PATCH /api/products/:id`

Requires `products:update`.

Sample request body:

```json
{
  "name": "iPhone 15 128GB Black",
  "price": 749,
  "unitsInStock": 12,
  "unitsOnOrder": 3,
  "reorderLevel": 4,
  "isActive": true
}
```

#### `DELETE /api/products/:id`

Requires `products:delete`. This marks the product inactive.

Sample request body: none.

### Inventory

#### `GET /api/inventory`

Requires `inventory:read`.

Sample request body: none.

#### `POST /api/inventory/adjustments`

Requires `inventory:adjust`.

Use `type: "in"` for restock, `type: "out"` for manual stock removal, and `type: "audit"` to set the stock count to an exact value.

Sample request body:

```json
{
  "productId": "00000000-0000-4000-8000-000000000030",
  "type": "in",
  "quantity": 10,
  "note": "Restock from supplier"
}
```

### Customers

#### `GET /api/customers`

Requires `customers:read`.

Sample request body: none.

#### `POST /api/customers`

Requires `customers:create`.

Sample request body:

```json
{
  "name": "Jane Buyer",
  "phone": "555-0100",
  "email": "jane.buyer@example.com",
  "address": "123 Main St"
}
```

#### `PATCH /api/customers/:id`

Requires `customers:update`.

Sample request body:

```json
{
  "name": "Jane Nguyen",
  "phone": "555-0111",
  "email": "jane.nguyen@example.com",
  "address": "456 New Main St"
}
```

### Orders

#### `GET /api/orders`

Requires `orders:read`.

Sample request body: none.

#### `POST /api/orders`

Requires `orders:create`.

Sample request body:

```json
{
  "customerId": "00000000-0000-4000-8000-000000000040",
  "employeeId": "00000000-0000-4000-8000-000000000050",
  "deliveryCompanyId": "00000000-0000-4000-8000-000000000060",
  "requiredDate": "2026-07-10",
  "shippedDate": "2026-07-04",
  "freight": 3.5,
  "shipName": "Jane Buyer",
  "shipAddress": "123 Main St",
  "shipCity": "Ho Chi Minh City",
  "shipRegion": "HCMC",
  "shipPostalCode": "700000",
  "shipCountry": "Vietnam",
  "items": [
    {
      "productId": "00000000-0000-4000-8000-000000000030",
      "quantity": 1,
      "unitPrice": 799,
      "discount": 0.1
    }
  ]
}
```

Notes:

- `items` must be a non-empty array.
- `discount` is a decimal between `0` and `1`.
- `unitPrice` is optional. If omitted, the current product price is used.

#### `PATCH /api/orders/:id/status`

Requires `orders:update`.

Sample request body:

```json
{
  "status": "completed"
}
```

Allowed statuses:

- `pending`
- `completed`
- `cancelled`

### Users

#### `PATCH /api/users/:id/roles`

Requires `users:update_roles`.

Sample request body:

```json
{
  "roles": ["manager"]
}
```

Allowed roles:

- `admin`
- `manager`
- `staff`
- `user`

## Validation Notes

The API returns field-level validation details in `errors`.

Example:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "items[0].quantity": ["Quantity must be an integer greater than zero."],
    "customerId": ["Customer does not exist."]
  }
}
```

Common validation rules:

- UUID route params and relation IDs must be valid UUIDs.
- Required string fields cannot be empty.
- Email fields must use a valid email format.
- Product SKU must be unique.
- Category name must be unique.
- Product stock, reorder levels, and quantities must be non-negative integers.
- Order item quantity must be greater than zero.
- Related records such as customer, employee, product, category, supplier, and delivery company must exist.
