const bearerAuth = [{ bearerAuth: [] }];

const listKeys = {
	StoreProduct: 'products',
	Product: 'products',
	Category: 'categories',
	Supplier: 'suppliers',
	DeliveryCompany: 'deliveryCompanies',
	Employee: 'employees',
	InventoryItem: 'inventory',
	Customer: 'customers',
	Order: 'orders',
};

const pageParams = [
	{ name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
	{
		name: 'pageSize',
		in: 'query',
		schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
];

function queryParam(name, description, schema = { type: 'string' }) {
	return { name, in: 'query', description, schema };
}

const sortParams = (fields) => [
	queryParam('sort', `Sort field. One of: ${fields.join(', ')}.`),
	queryParam('order', 'Sort direction.', { type: 'string', enum: ['asc', 'desc'] }),
];

const successEnvelope = (dataRef) => ({
	type: 'object',
	properties: {
		success: { type: 'boolean', example: true },
		message: { type: 'string' },
		data: dataRef || { type: 'object', nullable: true },
	},
});

const errorEnvelope = {
	type: 'object',
	properties: {
		success: { type: 'boolean', example: false },
		message: { type: 'string' },
		errors: {
			type: 'object',
			additionalProperties: {
				type: 'array',
				items: { type: 'string' },
			},
		},
	},
};

const authResponses = {
	401: { $ref: '#/components/responses/Unauthorized' },
	403: { $ref: '#/components/responses/Forbidden' },
};

const uuidParam = {
	name: 'id',
	in: 'path',
	required: true,
	schema: { type: 'string', format: 'uuid' },
};

const openApiSpec = {
	openapi: '3.0.3',
	info: {
		title: 'THAO Store API',
		version: '1.0.0',
		description:
			'Express API for authentication, inventory, products, customers, orders, and store master data.',
	},
	servers: [
		{ url: 'http://localhost:3000', description: 'Local development' },
		{
			url: 'https://thaotesting-git-main-minhdubai.vercel.app',
			description: 'Production',
		},
	],
	tags: [
		{ name: 'Health' },
		{ name: 'Auth' },
		{ name: 'Categories' },
		{ name: 'Suppliers' },
		{ name: 'Delivery Companies' },
		{ name: 'Employees' },
		{ name: 'Products' },
		{ name: 'Inventory' },
		{ name: 'Customers' },
		{ name: 'Orders' },
		{ name: 'Users' },
	],
	paths: {
		'/health': {
			get: {
				tags: ['Health'],
				summary: 'Health check',
				responses: {
					200: {
						description: 'Server is healthy',
						content: {
							'application/json': {
								schema: successEnvelope({
									type: 'object',
									properties: {
										status: { type: 'string', example: 'ok' },
									},
								}),
							},
						},
					},
				},
			},
		},

		'/api/store/products': {
			get: {
				tags: ['Storefront'],
				summary: 'Browse the product catalog (public)',
				parameters: [
					...pageParams,
					queryParam('q', 'Search name, SKU, brand or model.'),
					queryParam('category', 'Category slug, for example dien-thoai-cao-cap.'),
					queryParam('brand', 'Brand name.'),
					queryParam('minPrice', 'Minimum price in VND.', { type: 'number' }),
					queryParam('maxPrice', 'Maximum price in VND.', { type: 'number' }),
					queryParam('sort', 'Sort order.', {
						type: 'string',
						enum: ['newest', 'price_asc', 'price_desc', 'rating', 'name'],
					}),
				],
				responses: { 200: listResponse('StoreProduct', true) },
			},
		},
		'/api/store/products/{slug}': {
			get: {
				tags: ['Storefront'],
				summary: 'Product detail with reviews and related products (public)',
				parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'apl-ip17-256' }],
				responses: {
					200: { description: 'Product', content: { 'application/json': { schema: successEnvelope({ type: 'object', properties: { product: { $ref: '#/components/schemas/StoreProduct' }, related: { type: 'array', items: { $ref: '#/components/schemas/StoreProduct' } } } }) } } },
					404: { $ref: '#/components/responses/NotFound' },
				},
			},
		},
		'/api/store/products/{slug}/reviews': {
			post: {
				tags: ['Storefront'],
				summary: 'Review a product you have received',
				description: 'Requires a completed order that contains the product. One review per customer per product.',
				security: bearerAuth,
				parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
				requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rating'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 }, title: { type: 'string' }, body: { type: 'string' } } } } } },
				responses: { 201: { description: 'Review added' }, ...authResponses, 403: { description: 'Not purchased' }, 409: { description: 'Already reviewed' } },
			},
		},
		'/api/store/categories': {
			get: { tags: ['Storefront'], summary: 'List categories with product counts (public)', responses: { 200: { description: 'Categories' } } },
		},
		'/api/store/brands': {
			get: { tags: ['Storefront'], summary: 'List brands (public)', responses: { 200: { description: 'Brands' } } },
		},
		'/api/cart': {
			get: { tags: ['Cart'], summary: 'Get my cart with totals', description: 'Requires a signed-in customer.', security: bearerAuth, responses: { 200: { description: 'Cart' }, ...authResponses } },
		},
		'/api/cart/items': {
			post: {
				tags: ['Cart'],
				summary: 'Add a product to my cart',
				security: bearerAuth,
				requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string', format: 'uuid' }, quantity: { type: 'integer', minimum: 1, maximum: 99, default: 1 } } } } } },
				responses: { 201: { description: 'Item added' }, ...authResponses, 409: { description: 'Not enough stock' } },
			},
		},
		'/api/cart/items/{productId}': {
			patch: {
				tags: ['Cart'],
				summary: 'Change quantity of a cart item',
				security: bearerAuth,
				parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 } } } } } },
				responses: { 200: { description: 'Cart updated' }, ...authResponses },
			},
			delete: {
				tags: ['Cart'],
				summary: 'Remove an item from my cart',
				security: bearerAuth,
				parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				responses: { 200: { description: 'Item removed' }, ...authResponses },
			},
		},
		'/api/addresses': {
			get: { tags: ['Checkout'], summary: 'List my delivery addresses', security: bearerAuth, responses: { 200: { description: 'Addresses' }, ...authResponses } },
			post: {
				tags: ['Checkout'],
				summary: 'Save a delivery address',
				security: bearerAuth,
				requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressInput' } } } },
				responses: { 201: { description: 'Address saved' }, ...authResponses },
			},
		},
		'/api/addresses/{id}': {
			delete: {
				tags: ['Checkout'],
				summary: 'Delete one of my addresses',
				security: bearerAuth,
				parameters: [uuidParam],
				responses: { 200: { $ref: '#/components/responses/Success' }, ...authResponses, 404: { $ref: '#/components/responses/NotFound' } },
			},
		},
		'/api/checkout': {
			post: {
				tags: ['Checkout'],
				summary: 'Place an order from my cart',
				description: 'Reserves stock, applies an optional coupon and clears the cart. Payment is simulated: "cod" leaves the order pending, "card" marks it paid.',
				security: bearerAuth,
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['addressId'],
								properties: {
									addressId: { type: 'string', format: 'uuid' },
									paymentMethod: { type: 'string', enum: ['cod', 'card'], default: 'cod' },
									couponCode: { type: 'string', nullable: true, example: 'SAVE10' },
								},
							},
						},
					},
				},
				responses: { 201: { description: 'Order placed' }, ...authResponses, 409: { description: 'Stock or product problem' } },
			},
		},
		'/api/my/orders': {
			get: {
				tags: ['Checkout'],
				summary: 'List my orders (paged)',
				security: bearerAuth,
				parameters: pageParams,
				responses: { 200: { description: 'Orders', content: { 'application/json': { schema: successEnvelope({ type: 'object', properties: { orders: { type: 'array', items: { $ref: '#/components/schemas/CustomerOrder' } }, meta: { $ref: '#/components/schemas/PageMeta' } } }) } } }, ...authResponses },
			},
		},
		'/api/my/orders/{id}': {
			get: {
				tags: ['Checkout'],
				summary: 'Get one of my orders',
				security: bearerAuth,
				parameters: [uuidParam],
				responses: { 200: { description: 'Order' }, ...authResponses, 404: { $ref: '#/components/responses/NotFound' } },
			},
		},
		'/api/my/orders/{id}/cancel': {
			post: {
				tags: ['Checkout'],
				summary: 'Cancel my order while it is pending',
				security: bearerAuth,
				parameters: [uuidParam],
				responses: { 200: { description: 'Order cancelled' }, ...authResponses, 409: { description: 'Order can no longer be cancelled' } },
			},
		},
		'/api/coupons': {
			get: { tags: ['Coupons'], summary: 'List coupons (paged)', description: 'Requires coupons:read.', security: bearerAuth, parameters: [...pageParams, queryParam('q', 'Search code.')], responses: { 200: { description: 'Coupons' }, ...authResponses } },
			post: {
				tags: ['Coupons'],
				summary: 'Create a coupon',
				description: 'Requires coupons:manage.',
				security: bearerAuth,
				requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CouponInput' } } } },
				responses: { 201: { description: 'Coupon created' }, ...authResponses, 409: { description: 'Code exists' } },
			},
		},
		'/api/coupons/{id}': {
			patch: {
				tags: ['Coupons'],
				summary: 'Update a coupon',
				description: 'Requires coupons:manage.',
				security: bearerAuth,
				parameters: [uuidParam],
				requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CouponInput' } } } },
				responses: { 200: { description: 'Coupon updated' }, ...authResponses, 404: { $ref: '#/components/responses/NotFound' } },
			},
		},
		'/api/analytics/summary': {
			get: {
				tags: ['Analytics'],
				summary: 'Revenue, orders by status, revenue by day, top products and low stock',
				description: 'Requires analytics:read.',
				security: bearerAuth,
				responses: { 200: { description: 'Summary' }, ...authResponses },
			},
		},
		'/api/signup': {
			post: {
				tags: ['Auth'],
				summary: 'Create a user account',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/SignupRequest' },
						},
					},
				},
				responses: {
					201: {
						description: 'User created',
						content: {
							'application/json': {
								schema: successEnvelope({
									type: 'object',
									properties: {
										token: { type: 'string' },
										user: { $ref: '#/components/schemas/User' },
									},
								}),
							},
						},
					},
					400: { $ref: '#/components/responses/ValidationError' },
				},
			},
		},
		'/api/login': {
			post: {
				tags: ['Auth'],
				summary: 'Log in with a username or email and receive a JWT',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/LoginRequest' },
						},
					},
				},
				responses: {
					200: {
						description: 'Logged in',
						content: {
							'application/json': {
								schema: successEnvelope({
									type: 'object',
									properties: {
										token: { type: 'string' },
										user: { $ref: '#/components/schemas/User' },
									},
								}),
							},
						},
					},
					400: { $ref: '#/components/responses/ValidationError' },
					401: { $ref: '#/components/responses/Unauthorized' },
				},
			},
		},
		'/api/me': {
			get: {
				tags: ['Auth'],
				summary: 'Get the authenticated user',
				security: bearerAuth,
				responses: {
					200: { $ref: '#/components/responses/UserResponse' },
					401: { $ref: '#/components/responses/Unauthorized' },
				},
			},
		},
		'/api/user-area': {
			get: {
				tags: ['Auth'],
				summary: 'Authenticated user test route',
				security: bearerAuth,
				responses: {
					200: { $ref: '#/components/responses/Success' },
					401: { $ref: '#/components/responses/Unauthorized' },
				},
			},
		},
		'/api/admin-area': {
			get: {
				tags: ['Auth'],
				summary: 'Admin-only test route',
				description: 'Requires the admin role.',
				security: bearerAuth,
				responses: { 200: { $ref: '#/components/responses/Success' }, ...authResponses },
			},
		},
		'/api/manager-area': {
			get: {
				tags: ['Auth'],
				summary: 'Admin or manager test route',
				description: 'Requires the admin or manager role.',
				security: bearerAuth,
				responses: { 200: { $ref: '#/components/responses/Success' }, ...authResponses },
			},
		},
		'/api/categories': {
			get: protectedList('Categories', 'List categories', 'categories:read', 'Category'),
			post: protectedCreate(
				'Categories',
				'Create a category',
				'categories:create',
				'CategoryInput',
				'Category',
			),
		},
		'/api/categories/{id}': {
			patch: protectedPatch(
				'Categories',
				'Update a category',
				'categories:update',
				'CategoryInput',
				'Category',
			),
		},
		'/api/suppliers': {
			get: protectedList('Suppliers', 'List suppliers', 'suppliers:read', 'Supplier'),
			post: protectedCreate(
				'Suppliers',
				'Create a supplier',
				'suppliers:create',
				'SupplierInput',
				'Supplier',
			),
		},
		'/api/suppliers/{id}': {
			patch: protectedPatch(
				'Suppliers',
				'Update a supplier',
				'suppliers:update',
				'SupplierInput',
				'Supplier',
			),
		},
		'/api/delivery-companies': {
			get: protectedList(
				'Delivery Companies',
				'List delivery companies',
				'delivery_companies:read',
				'DeliveryCompany',
			),
			post: protectedCreate(
				'Delivery Companies',
				'Create a delivery company',
				'delivery_companies:create',
				'DeliveryCompanyInput',
				'DeliveryCompany',
			),
		},
		'/api/delivery-companies/{id}': {
			patch: protectedPatch(
				'Delivery Companies',
				'Update a delivery company',
				'delivery_companies:update',
				'DeliveryCompanyInput',
				'DeliveryCompany',
			),
		},
		'/api/employees': {
			get: protectedList('Employees', 'List employees', 'employees:read', 'Employee'),
			post: protectedCreate(
				'Employees',
				'Create an employee',
				'employees:create',
				'EmployeeInput',
				'Employee',
			),
		},
		'/api/employees/{id}': {
			patch: protectedPatch(
				'Employees',
				'Update an employee',
				'employees:update',
				'EmployeeInput',
				'Employee',
			),
		},
		'/api/products': {
			get: protectedList('Products', 'List products (paged)', 'products:read', 'Product', {
				paged: true,
				params: [
					queryParam('q', 'Search name, SKU, brand or model.'),
					queryParam('categoryId', 'Filter by category ID.', { type: 'string', format: 'uuid' }),
					queryParam('status', 'Filter by active state.', {
						type: 'string',
						enum: ['all', 'active', 'inactive'],
					}),
					...sortParams(['name', 'price', 'unitsInStock', 'createdAt', 'sku']),
				],
			}),
			post: protectedCreate(
				'Products',
				'Create a product',
				'products:create',
				'ProductInput',
				'Product',
			),
		},
		'/api/products/{id}': {
			get: {
				tags: ['Products'],
				summary: 'Get one product',
				description: 'Requires products:read.',
				security: bearerAuth,
				parameters: [uuidParam],
				responses: {
					200: entityResponse('Product'),
					...authResponses,
					404: { $ref: '#/components/responses/NotFound' },
				},
			},
			patch: protectedPatch(
				'Products',
				'Update a product',
				'products:update',
				'ProductInput',
				'Product',
			),
			delete: {
				tags: ['Products'],
				summary: 'Mark a product inactive',
				description: 'Requires products:delete.',
				security: bearerAuth,
				parameters: [uuidParam],
				responses: {
					200: { $ref: '#/components/responses/Success' },
					...authResponses,
					404: { $ref: '#/components/responses/NotFound' },
				},
			},
		},
		'/api/inventory': {
			get: protectedList('Inventory', 'List inventory (paged)', 'inventory:read', 'InventoryItem', {
				paged: true,
				params: [
					queryParam('q', 'Search product name, SKU or brand.'),
					...sortParams(['quantity', 'updatedAt']),
				],
			}),
		},
		'/api/inventory/adjustments': {
			post: protectedCreate(
				'Inventory',
				'Adjust inventory',
				'inventory:adjust',
				'InventoryAdjustmentInput',
				'InventoryItem',
			),
		},
		'/api/customers': {
			get: protectedList('Customers', 'List customers (paged)', 'customers:read', 'Customer', {
				paged: true,
				params: [
					queryParam('q', 'Search name, phone or email.'),
					...sortParams(['name', 'createdAt']),
				],
			}),
			post: protectedCreate(
				'Customers',
				'Create a customer',
				'customers:create',
				'CustomerInput',
				'Customer',
			),
		},
		'/api/customers/{id}': {
			patch: protectedPatch(
				'Customers',
				'Update a customer',
				'customers:update',
				'CustomerInput',
				'Customer',
			),
		},
		'/api/orders': {
			get: protectedList('Orders', 'List orders (paged)', 'orders:read', 'Order', {
				paged: true,
				params: [
					queryParam('q', 'Search customer name, ship name or city.'),
					queryParam('status', 'Filter by status.', {
						type: 'string',
						enum: ['pending', 'completed', 'cancelled'],
					}),
					...sortParams(['orderDate', 'totalAmount', 'status']),
				],
			}),
			post: protectedCreate(
				'Orders',
				'Create an order',
				'orders:create',
				'OrderInput',
				'Order',
			),
		},
		'/api/orders/{id}/status': {
			patch: {
				tags: ['Orders'],
				summary: 'Update order status',
				description: 'Requires orders:update.',
				security: bearerAuth,
				parameters: [uuidParam],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/OrderStatusInput' },
						},
					},
				},
				responses: {
					200: entityResponse('Order'),
					400: { $ref: '#/components/responses/ValidationError' },
					...authResponses,
					404: { $ref: '#/components/responses/NotFound' },
				},
			},
		},
		'/api/users/{id}/roles': {
			patch: {
				tags: ['Users'],
				summary: 'Update user roles',
				description:
					'Requires users:update_roles. Only admin has this permission by default.',
				security: bearerAuth,
				parameters: [uuidParam],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/UserRolesInput' },
						},
					},
				},
				responses: {
					200: { $ref: '#/components/responses/UserResponse' },
					400: { $ref: '#/components/responses/ValidationError' },
					...authResponses,
					404: { $ref: '#/components/responses/NotFound' },
				},
			},
		},
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
		responses: {
			Success: {
				description: 'Success',
				content: { 'application/json': { schema: successEnvelope() } },
			},
			UserResponse: {
				description: 'User response',
				content: {
					'application/json': {
						schema: successEnvelope({
							type: 'object',
							properties: { user: { $ref: '#/components/schemas/User' } },
						}),
					},
				},
			},
			ValidationError: {
				description: 'Validation failed',
				content: { 'application/json': { schema: errorEnvelope } },
			},
			Unauthorized: {
				description: 'Authentication required or invalid credentials',
				content: { 'application/json': { schema: errorEnvelope } },
			},
			Forbidden: {
				description: 'Insufficient permissions',
				content: { 'application/json': { schema: errorEnvelope } },
			},
			NotFound: {
				description: 'Resource not found',
				content: { 'application/json': { schema: errorEnvelope } },
			},
		},
		schemas: {
			LoginRequest: {
				type: 'object',
				description: 'Sign in with either a username or an email address in "identifier".',
				required: ['identifier', 'password'],
				properties: {
					identifier: {
						type: 'string',
						description: 'Username or email address.',
						example: 'admin',
					},
					password: { type: 'string', example: 'admin' },
				},
			},
			SignupRequest: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email', example: 'jane@example.com' },
					username: {
						type: 'string',
						nullable: true,
						minLength: 3,
						maxLength: 30,
						pattern: '^[a-z0-9_]{3,30}$',
						description: 'Optional. Letters, numbers and underscore. Stored in lowercase.',
						example: 'jane_doe',
					},
					password: { type: 'string', minLength: 8, example: 'secret123' },
				},
			},
			User: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					email: { type: 'string', format: 'email' },
					username: { type: 'string', nullable: true, example: 'admin' },
					roles: {
						type: 'array',
						items: { type: 'string', enum: ['admin', 'manager', 'staff', 'user'] },
					},
				},
			},
			StoreProduct: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					slug: { type: 'string', example: 'apl-ip17-256' },
					sku: { type: 'string' },
					name: { type: 'string' },
					brand: { type: 'string' },
					model: { type: 'string' },
					price: { type: 'string', example: '24590000.00' },
					imageUrl: { type: 'string', nullable: true },
					gallery: { type: 'array', items: { type: 'string' } },
					description: { type: 'string', nullable: true },
					ratingAverage: { type: 'string', example: '4.50' },
					reviewCount: { type: 'integer' },
					inStock: { type: 'boolean' },
					category: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' } } },
				},
			},
			AddressInput: {
				type: 'object',
				required: ['fullName', 'phone', 'line1', 'city'],
				properties: {
					fullName: { type: 'string', example: 'Nguyen Van A' },
					phone: { type: 'string', example: '0900000001' },
					line1: { type: 'string', example: '12 Le Loi' },
					city: { type: 'string', example: 'TP. Hồ Chí Minh' },
					region: { type: 'string', nullable: true },
					country: { type: 'string', default: 'Việt Nam' },
					isDefault: { type: 'boolean' },
				},
			},
			CustomerOrder: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'] },
					paymentMethod: { type: 'string', nullable: true, enum: ['cod', 'card'] },
					paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
					couponCode: { type: 'string', nullable: true },
					subtotal: { type: 'number' },
					discountAmount: { type: 'number' },
					shipping: { type: 'number' },
					total: { type: 'number' },
					trackingNumber: { type: 'string', nullable: true },
					items: { type: 'array', items: { type: 'object' } },
				},
			},
			CouponInput: {
				type: 'object',
				properties: {
					code: { type: 'string', example: 'SAVE10' },
					description: { type: 'string', nullable: true },
					type: { type: 'string', enum: ['percent', 'fixed'] },
					value: { type: 'number', example: 10 },
					minSubtotal: { type: 'number', example: 0 },
					usageLimit: { type: 'integer', nullable: true, example: 100 },
					startsAt: { type: 'string', format: 'date-time', nullable: true },
					endsAt: { type: 'string', format: 'date-time', nullable: true },
					active: { type: 'boolean' },
				},
			},
			PageMeta: {
				type: 'object',
				properties: {
					page: { type: 'integer', example: 1 },
					pageSize: { type: 'integer', example: 10 },
					total: { type: 'integer', example: 32 },
					totalPages: { type: 'integer', example: 4 },
				},
			},
			UserRolesInput: {
				type: 'object',
				required: ['roles'],
				properties: {
					roles: {
						type: 'array',
						minItems: 1,
						items: { type: 'string', enum: ['admin', 'manager', 'staff', 'user'] },
						example: ['manager'],
					},
				},
			},
			Category: entitySchema({
				name: { type: 'string', example: 'Smartphones' },
				description: { type: 'string', nullable: true },
				picture: { type: 'string', nullable: true },
			}),
			CategoryInput: inputSchema({
				name: { type: 'string', example: 'Smartphones' },
				description: { type: 'string', example: 'Unlocked and carrier phones' },
				picture: {
					type: 'string',
					example: 'https://example.com/images/smartphones.png',
				},
			}),
			Supplier: entitySchema(supplierFields()),
			SupplierInput: inputSchema(supplierFields()),
			DeliveryCompany: entitySchema({
				companyName: { type: 'string', example: 'Fast Delivery' },
				phone: { type: 'string', nullable: true, example: '555-0199' },
				trackingUrl: {
					type: 'string',
					nullable: true,
					example: 'https://delivery.example.com/track',
				},
			}),
			DeliveryCompanyInput: inputSchema({
				companyName: { type: 'string', example: 'Fast Delivery' },
				phone: { type: 'string', example: '555-0199' },
				trackingUrl: { type: 'string', example: 'https://delivery.example.com/track' },
			}),
			Employee: entitySchema(employeeFields()),
			EmployeeInput: inputSchema(employeeFields()),
			Product: entitySchema(productFields()),
			ProductInput: inputSchema(productFields()),
			InventoryItem: entitySchema({
				productId: { type: 'string', format: 'uuid' },
				quantity: { type: 'integer', minimum: 0 },
				product: { $ref: '#/components/schemas/Product' },
			}),
			InventoryAdjustmentInput: {
				type: 'object',
				required: ['productId', 'type', 'quantity'],
				properties: {
					productId: { type: 'string', format: 'uuid' },
					type: { type: 'string', enum: ['in', 'out', 'audit'], example: 'in' },
					quantity: { type: 'integer', minimum: 0, example: 10 },
					note: { type: 'string', example: 'Restock from supplier' },
				},
			},
			Customer: entitySchema(customerFields()),
			CustomerInput: inputSchema(customerFields()),
			Order: entitySchema({
				customerId: { type: 'string', format: 'uuid' },
				employeeId: { type: 'string', format: 'uuid', nullable: true },
				deliveryCompanyId: { type: 'string', format: 'uuid', nullable: true },
				status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
				freight: { type: 'number', example: 3.5 },
				items: {
					type: 'array',
					items: { $ref: '#/components/schemas/OrderItem' },
				},
			}),
			OrderInput: {
				type: 'object',
				required: ['customerId', 'items'],
				properties: {
					customerId: { type: 'string', format: 'uuid' },
					employeeId: { type: 'string', format: 'uuid' },
					deliveryCompanyId: { type: 'string', format: 'uuid' },
					requiredDate: { type: 'string', format: 'date', example: '2026-07-10' },
					shippedDate: { type: 'string', format: 'date', example: '2026-07-04' },
					freight: { type: 'number', example: 3.5 },
					shipName: { type: 'string', example: 'Jane Buyer' },
					shipAddress: { type: 'string', example: '123 Main St' },
					shipCity: { type: 'string', example: 'Ho Chi Minh City' },
					shipRegion: { type: 'string', example: 'HCMC' },
					shipPostalCode: { type: 'string', example: '700000' },
					shipCountry: { type: 'string', example: 'Vietnam' },
					items: {
						type: 'array',
						minItems: 1,
						items: { $ref: '#/components/schemas/OrderItemInput' },
					},
				},
			},
			OrderItem: entitySchema({
				productId: { type: 'string', format: 'uuid' },
				quantity: { type: 'integer', minimum: 1 },
				unitPrice: { type: 'number' },
				discount: { type: 'number', minimum: 0, maximum: 1 },
			}),
			OrderItemInput: {
				type: 'object',
				required: ['productId', 'quantity'],
				properties: {
					productId: { type: 'string', format: 'uuid' },
					quantity: { type: 'integer', minimum: 1, example: 1 },
					unitPrice: { type: 'number', example: 799 },
					discount: { type: 'number', minimum: 0, maximum: 1, example: 0.1 },
				},
			},
			OrderStatusInput: {
				type: 'object',
				required: ['status'],
				properties: {
					status: {
						type: 'string',
						enum: ['pending', 'completed', 'cancelled'],
						example: 'completed',
					},
				},
			},
		},
	},
};


// Lists that page (products, orders, customers, inventory) take these query params.
function protectedList(tag, summary, permission, schemaName, { params = [], paged = false } = {}) {
	return {
		tags: [tag],
		summary,
		description: `Requires ${permission}.`,
		security: bearerAuth,
		parameters: paged ? [...pageParams, ...params] : [],
		responses: {
			200: listResponse(schemaName, paged),
			...authResponses,
		},
	};
}

function protectedCreate(tag, summary, permission, inputSchemaName, outputSchemaName) {
	return {
		tags: [tag],
		summary,
		description: `Requires ${permission}.`,
		security: bearerAuth,
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: { $ref: `#/components/schemas/${inputSchemaName}` },
				},
			},
		},
		responses: {
			201: entityResponse(outputSchemaName),
			400: { $ref: '#/components/responses/ValidationError' },
			...authResponses,
		},
	};
}

function protectedPatch(tag, summary, permission, inputSchemaName, outputSchemaName) {
	return {
		tags: [tag],
		summary,
		description: `Requires ${permission}.`,
		security: bearerAuth,
		parameters: [uuidParam],
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: { $ref: `#/components/schemas/${inputSchemaName}` },
				},
			},
		},
		responses: {
			200: entityResponse(outputSchemaName),
			400: { $ref: '#/components/responses/ValidationError' },
			...authResponses,
			404: { $ref: '#/components/responses/NotFound' },
		},
	};
}

function listResponse(schemaName, paged = false) {
	const key = listKeys[schemaName];
	const data = {
		type: 'object',
		properties: {
			[key]: {
				type: 'array',
				items: { $ref: `#/components/schemas/${schemaName}` },
			},
		},
	};

	if (paged) {
		data.properties.meta = { $ref: '#/components/schemas/PageMeta' };
	}

	return {
		description: 'List response',
		content: {
			'application/json': {
				schema: successEnvelope(data),
			},
		},
	};
}

function entityResponse(schemaName) {
	return {
		description: 'Entity response',
		content: {
			'application/json': {
				schema: successEnvelope({ $ref: `#/components/schemas/${schemaName}` }),
			},
		},
	};
}

function entitySchema(properties) {
	return {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			...properties,
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	};
}

function inputSchema(properties) {
	return {
		type: 'object',
		properties,
	};
}

function supplierFields() {
	return {
		companyName: { type: 'string', example: 'Apple Distribution' },
		contactName: { type: 'string', nullable: true, example: 'Sales Desk' },
		contactTitle: { type: 'string', nullable: true, example: 'Account Manager' },
		address: { type: 'string', nullable: true, example: '1 Infinite Loop' },
		city: { type: 'string', nullable: true, example: 'Cupertino' },
		region: { type: 'string', nullable: true, example: 'CA' },
		postalCode: { type: 'string', nullable: true, example: '95014' },
		country: { type: 'string', nullable: true, example: 'USA' },
		phone: { type: 'string', nullable: true, example: '555-0101' },
		fax: { type: 'string', nullable: true, example: '555-0102' },
		homepage: { type: 'string', nullable: true, example: 'https://apple.example.com' },
	};
}

function employeeFields() {
	return {
		firstName: { type: 'string', example: 'Nina' },
		lastName: { type: 'string', example: 'Sales' },
		title: { type: 'string', nullable: true, example: 'Store Manager' },
		titleOfCourtesy: { type: 'string', nullable: true, example: 'Ms.' },
		birthDate: { type: 'string', format: 'date', nullable: true },
		hireDate: { type: 'string', format: 'date', nullable: true },
		address: { type: 'string', nullable: true },
		city: { type: 'string', nullable: true, example: 'Ho Chi Minh City' },
		region: { type: 'string', nullable: true, example: 'HCMC' },
		postalCode: { type: 'string', nullable: true, example: '700000' },
		country: { type: 'string', nullable: true, example: 'Vietnam' },
		homePhone: { type: 'string', nullable: true, example: '555-0123' },
		extension: { type: 'string', nullable: true, example: '101' },
		photo: { type: 'string', nullable: true },
		notes: { type: 'string', nullable: true },
		reportsToId: { type: 'string', format: 'uuid', nullable: true },
		photoPath: { type: 'string', nullable: true },
	};
}

function productFields() {
	return {
		sku: { type: 'string', example: 'IPH15-128-BLK' },
		name: { type: 'string', example: 'iPhone 15 128GB' },
		brand: { type: 'string', nullable: true, example: 'Apple' },
		model: { type: 'string', nullable: true, example: 'iPhone 15' },
		category: { type: 'string', nullable: true, example: 'phone' },
		categoryId: { type: 'string', format: 'uuid', nullable: true },
		supplierId: { type: 'string', format: 'uuid', nullable: true },
		quantityPerUnit: { type: 'string', nullable: true, example: '1 phone / box' },
		description: { type: 'string', nullable: true, example: 'Flagship smartphone with a 6.3-inch display.' },
		imageUrl: { type: 'string', format: 'uri', nullable: true, example: 'https://upload.wikimedia.org/example.jpg' },
		price: { type: 'number', example: 799 },
		unitPrice: { type: 'number', example: 799 },
		unitsInStock: { type: 'integer', minimum: 0, example: 5 },
		unitsOnOrder: { type: 'integer', minimum: 0, example: 0 },
		reorderLevel: { type: 'integer', minimum: 0, example: 2 },
		discontinued: { type: 'boolean', example: false },
		isActive: { type: 'boolean', example: true },
	};
}

function customerFields() {
	return {
		name: { type: 'string', example: 'Jane Buyer' },
		phone: { type: 'string', nullable: true, example: '555-0100' },
		email: { type: 'string', format: 'email', nullable: true },
		address: { type: 'string', nullable: true, example: '123 Main St' },
	};
}

module.exports = {
	openApiSpec,
};
