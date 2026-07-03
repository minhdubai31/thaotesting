const bearerAuth = [{ bearerAuth: [] }];

const successEnvelope = (dataRef) => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string" },
    data: dataRef || { type: "object", nullable: true }
  }
});

const errorEnvelope = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
    errors: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
};

const authResponses = {
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" }
};

const uuidParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" }
};

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Cellphone Store API",
    version: "1.0.0",
    description:
      "Express API for authentication, inventory, products, customers, orders, and store master data."
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    {
      url: "https://thaotesting-git-main-minhdubai.vercel.app",
      description: "Production"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Categories" },
    { name: "Suppliers" },
    { name: "Delivery Companies" },
    { name: "Employees" },
    { name: "Products" },
    { name: "Inventory" },
    { name: "Customers" },
    { name: "Orders" },
    { name: "Users" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: successEnvelope({
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" }
                  }
                })
              }
            }
          }
        }
      }
    },
    "/api/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: successEnvelope({
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                })
              }
            }
          },
          400: { $ref: "#/components/responses/ValidationError" }
        }
      }
    },
    "/api/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: successEnvelope({
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                })
              }
            }
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/api/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the authenticated user",
        security: bearerAuth,
        responses: {
          200: { $ref: "#/components/responses/UserResponse" },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/api/user-area": {
      get: {
        tags: ["Auth"],
        summary: "Authenticated user test route",
        security: bearerAuth,
        responses: {
          200: { $ref: "#/components/responses/Success" },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/api/admin-area": {
      get: {
        tags: ["Auth"],
        summary: "Admin-only test route",
        description: "Requires the admin role.",
        security: bearerAuth,
        responses: { 200: { $ref: "#/components/responses/Success" }, ...authResponses }
      }
    },
    "/api/manager-area": {
      get: {
        tags: ["Auth"],
        summary: "Admin or manager test route",
        description: "Requires the admin or manager role.",
        security: bearerAuth,
        responses: { 200: { $ref: "#/components/responses/Success" }, ...authResponses }
      }
    },
    "/api/categories": {
      get: protectedList("Categories", "List categories", "categories:read", "Category"),
      post: protectedCreate(
        "Categories",
        "Create a category",
        "categories:create",
        "CategoryInput",
        "Category"
      )
    },
    "/api/categories/{id}": {
      patch: protectedPatch(
        "Categories",
        "Update a category",
        "categories:update",
        "CategoryInput",
        "Category"
      )
    },
    "/api/suppliers": {
      get: protectedList("Suppliers", "List suppliers", "suppliers:read", "Supplier"),
      post: protectedCreate(
        "Suppliers",
        "Create a supplier",
        "suppliers:create",
        "SupplierInput",
        "Supplier"
      )
    },
    "/api/suppliers/{id}": {
      patch: protectedPatch(
        "Suppliers",
        "Update a supplier",
        "suppliers:update",
        "SupplierInput",
        "Supplier"
      )
    },
    "/api/delivery-companies": {
      get: protectedList(
        "Delivery Companies",
        "List delivery companies",
        "delivery_companies:read",
        "DeliveryCompany"
      ),
      post: protectedCreate(
        "Delivery Companies",
        "Create a delivery company",
        "delivery_companies:create",
        "DeliveryCompanyInput",
        "DeliveryCompany"
      )
    },
    "/api/delivery-companies/{id}": {
      patch: protectedPatch(
        "Delivery Companies",
        "Update a delivery company",
        "delivery_companies:update",
        "DeliveryCompanyInput",
        "DeliveryCompany"
      )
    },
    "/api/employees": {
      get: protectedList("Employees", "List employees", "employees:read", "Employee"),
      post: protectedCreate(
        "Employees",
        "Create an employee",
        "employees:create",
        "EmployeeInput",
        "Employee"
      )
    },
    "/api/employees/{id}": {
      patch: protectedPatch(
        "Employees",
        "Update an employee",
        "employees:update",
        "EmployeeInput",
        "Employee"
      )
    },
    "/api/products": {
      get: protectedList("Products", "List products", "products:read", "Product"),
      post: protectedCreate(
        "Products",
        "Create a product",
        "products:create",
        "ProductInput",
        "Product"
      )
    },
    "/api/products/{id}": {
      patch: protectedPatch(
        "Products",
        "Update a product",
        "products:update",
        "ProductInput",
        "Product"
      ),
      delete: {
        tags: ["Products"],
        summary: "Mark a product inactive",
        description: "Requires products:delete.",
        security: bearerAuth,
        parameters: [uuidParam],
        responses: {
          200: { $ref: "#/components/responses/Success" },
          ...authResponses,
          404: { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/api/inventory": {
      get: protectedList("Inventory", "List inventory", "inventory:read", "InventoryItem")
    },
    "/api/inventory/adjustments": {
      post: protectedCreate(
        "Inventory",
        "Adjust inventory",
        "inventory:adjust",
        "InventoryAdjustmentInput",
        "InventoryItem"
      )
    },
    "/api/customers": {
      get: protectedList("Customers", "List customers", "customers:read", "Customer"),
      post: protectedCreate(
        "Customers",
        "Create a customer",
        "customers:create",
        "CustomerInput",
        "Customer"
      )
    },
    "/api/customers/{id}": {
      patch: protectedPatch(
        "Customers",
        "Update a customer",
        "customers:update",
        "CustomerInput",
        "Customer"
      )
    },
    "/api/orders": {
      get: protectedList("Orders", "List orders", "orders:read", "Order"),
      post: protectedCreate(
        "Orders",
        "Create an order",
        "orders:create",
        "OrderInput",
        "Order"
      )
    },
    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status",
        description: "Requires orders:update.",
        security: bearerAuth,
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderStatusInput" }
            }
          }
        },
        responses: {
          200: entityResponse("Order"),
          400: { $ref: "#/components/responses/ValidationError" },
          ...authResponses,
          404: { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/api/users/{id}/roles": {
      patch: {
        tags: ["Users"],
        summary: "Update user roles",
        description: "Requires users:update_roles. Only admin has this permission by default.",
        security: bearerAuth,
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserRolesInput" }
            }
          }
        },
        responses: {
          200: { $ref: "#/components/responses/UserResponse" },
          400: { $ref: "#/components/responses/ValidationError" },
          ...authResponses,
          404: { $ref: "#/components/responses/NotFound" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    responses: {
      Success: {
        description: "Success",
        content: { "application/json": { schema: successEnvelope() } }
      },
      UserResponse: {
        description: "User response",
        content: {
          "application/json": {
            schema: successEnvelope({
              type: "object",
              properties: { user: { $ref: "#/components/schemas/User" } }
            })
          }
        }
      },
      ValidationError: {
        description: "Validation failed",
        content: { "application/json": { schema: errorEnvelope } }
      },
      Unauthorized: {
        description: "Authentication required or invalid credentials",
        content: { "application/json": { schema: errorEnvelope } }
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: { "application/json": { schema: errorEnvelope } }
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: errorEnvelope } }
      }
    },
    schemas: {
      AuthRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", minLength: 8, example: "secret123" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          roles: {
            type: "array",
            items: { type: "string", enum: ["admin", "manager", "staff", "user"] }
          }
        }
      },
      UserRolesInput: {
        type: "object",
        required: ["roles"],
        properties: {
          roles: {
            type: "array",
            minItems: 1,
            items: { type: "string", enum: ["admin", "manager", "staff", "user"] },
            example: ["manager"]
          }
        }
      },
      Category: entitySchema({
        name: { type: "string", example: "Smartphones" },
        description: { type: "string", nullable: true },
        picture: { type: "string", nullable: true }
      }),
      CategoryInput: inputSchema({
        name: { type: "string", example: "Smartphones" },
        description: { type: "string", example: "Unlocked and carrier phones" },
        picture: {
          type: "string",
          example: "https://example.com/images/smartphones.png"
        }
      }),
      Supplier: entitySchema(supplierFields()),
      SupplierInput: inputSchema(supplierFields()),
      DeliveryCompany: entitySchema({
        companyName: { type: "string", example: "Fast Delivery" },
        phone: { type: "string", nullable: true, example: "555-0199" },
        trackingUrl: {
          type: "string",
          nullable: true,
          example: "https://delivery.example.com/track"
        }
      }),
      DeliveryCompanyInput: inputSchema({
        companyName: { type: "string", example: "Fast Delivery" },
        phone: { type: "string", example: "555-0199" },
        trackingUrl: { type: "string", example: "https://delivery.example.com/track" }
      }),
      Employee: entitySchema(employeeFields()),
      EmployeeInput: inputSchema(employeeFields()),
      Product: entitySchema(productFields()),
      ProductInput: inputSchema(productFields()),
      InventoryItem: entitySchema({
        productId: { type: "string", format: "uuid" },
        quantity: { type: "integer", minimum: 0 },
        product: { $ref: "#/components/schemas/Product" }
      }),
      InventoryAdjustmentInput: {
        type: "object",
        required: ["productId", "type", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["in", "out", "audit"], example: "in" },
          quantity: { type: "integer", minimum: 0, example: 10 },
          note: { type: "string", example: "Restock from supplier" }
        }
      },
      Customer: entitySchema(customerFields()),
      CustomerInput: inputSchema(customerFields()),
      Order: entitySchema({
        customerId: { type: "string", format: "uuid" },
        employeeId: { type: "string", format: "uuid", nullable: true },
        deliveryCompanyId: { type: "string", format: "uuid", nullable: true },
        status: { type: "string", enum: ["pending", "completed", "cancelled"] },
        freight: { type: "number", example: 3.5 },
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/OrderItem" }
        }
      }),
      OrderInput: {
        type: "object",
        required: ["customerId", "items"],
        properties: {
          customerId: { type: "string", format: "uuid" },
          employeeId: { type: "string", format: "uuid" },
          deliveryCompanyId: { type: "string", format: "uuid" },
          requiredDate: { type: "string", format: "date", example: "2026-07-10" },
          shippedDate: { type: "string", format: "date", example: "2026-07-04" },
          freight: { type: "number", example: 3.5 },
          shipName: { type: "string", example: "Jane Buyer" },
          shipAddress: { type: "string", example: "123 Main St" },
          shipCity: { type: "string", example: "Ho Chi Minh City" },
          shipRegion: { type: "string", example: "HCMC" },
          shipPostalCode: { type: "string", example: "700000" },
          shipCountry: { type: "string", example: "Vietnam" },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderItemInput" }
          }
        }
      },
      OrderItem: entitySchema({
        productId: { type: "string", format: "uuid" },
        quantity: { type: "integer", minimum: 1 },
        unitPrice: { type: "number" },
        discount: { type: "number", minimum: 0, maximum: 1 }
      }),
      OrderItemInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1, example: 1 },
          unitPrice: { type: "number", example: 799 },
          discount: { type: "number", minimum: 0, maximum: 1, example: 0.1 }
        }
      },
      OrderStatusInput: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["pending", "completed", "cancelled"],
            example: "completed"
          }
        }
      }
    }
  }
};

function protectedList(tag, summary, permission, schemaName) {
  return {
    tags: [tag],
    summary,
    description: `Requires ${permission}.`,
    security: bearerAuth,
    responses: {
      200: listResponse(schemaName),
      ...authResponses
    }
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
        "application/json": {
          schema: { $ref: `#/components/schemas/${inputSchemaName}` }
        }
      }
    },
    responses: {
      201: entityResponse(outputSchemaName),
      400: { $ref: "#/components/responses/ValidationError" },
      ...authResponses
    }
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
        "application/json": {
          schema: { $ref: `#/components/schemas/${inputSchemaName}` }
        }
      }
    },
    responses: {
      200: entityResponse(outputSchemaName),
      400: { $ref: "#/components/responses/ValidationError" },
      ...authResponses,
      404: { $ref: "#/components/responses/NotFound" }
    }
  };
}

function listResponse(schemaName) {
  return {
    description: "List response",
    content: {
      "application/json": {
        schema: successEnvelope({
          type: "array",
          items: { $ref: `#/components/schemas/${schemaName}` }
        })
      }
    }
  };
}

function entityResponse(schemaName) {
  return {
    description: "Entity response",
    content: {
      "application/json": {
        schema: successEnvelope({ $ref: `#/components/schemas/${schemaName}` })
      }
    }
  };
}

function entitySchema(properties) {
  return {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      ...properties,
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  };
}

function inputSchema(properties) {
  return {
    type: "object",
    properties
  };
}

function supplierFields() {
  return {
    companyName: { type: "string", example: "Apple Distribution" },
    contactName: { type: "string", nullable: true, example: "Sales Desk" },
    contactTitle: { type: "string", nullable: true, example: "Account Manager" },
    address: { type: "string", nullable: true, example: "1 Infinite Loop" },
    city: { type: "string", nullable: true, example: "Cupertino" },
    region: { type: "string", nullable: true, example: "CA" },
    postalCode: { type: "string", nullable: true, example: "95014" },
    country: { type: "string", nullable: true, example: "USA" },
    phone: { type: "string", nullable: true, example: "555-0101" },
    fax: { type: "string", nullable: true, example: "555-0102" },
    homepage: { type: "string", nullable: true, example: "https://apple.example.com" }
  };
}

function employeeFields() {
  return {
    firstName: { type: "string", example: "Nina" },
    lastName: { type: "string", example: "Sales" },
    title: { type: "string", nullable: true, example: "Store Manager" },
    titleOfCourtesy: { type: "string", nullable: true, example: "Ms." },
    birthDate: { type: "string", format: "date", nullable: true },
    hireDate: { type: "string", format: "date", nullable: true },
    address: { type: "string", nullable: true },
    city: { type: "string", nullable: true, example: "Ho Chi Minh City" },
    region: { type: "string", nullable: true, example: "HCMC" },
    postalCode: { type: "string", nullable: true, example: "700000" },
    country: { type: "string", nullable: true, example: "Vietnam" },
    homePhone: { type: "string", nullable: true, example: "555-0123" },
    extension: { type: "string", nullable: true, example: "101" },
    photo: { type: "string", nullable: true },
    notes: { type: "string", nullable: true },
    reportsToId: { type: "string", format: "uuid", nullable: true },
    photoPath: { type: "string", nullable: true }
  };
}

function productFields() {
  return {
    sku: { type: "string", example: "IPH15-128-BLK" },
    name: { type: "string", example: "iPhone 15 128GB" },
    brand: { type: "string", nullable: true, example: "Apple" },
    model: { type: "string", nullable: true, example: "iPhone 15" },
    category: { type: "string", nullable: true, example: "phone" },
    categoryId: { type: "string", format: "uuid", nullable: true },
    supplierId: { type: "string", format: "uuid", nullable: true },
    quantityPerUnit: { type: "string", nullable: true, example: "1 phone / box" },
    price: { type: "number", example: 799 },
    unitPrice: { type: "number", example: 799 },
    unitsInStock: { type: "integer", minimum: 0, example: 5 },
    unitsOnOrder: { type: "integer", minimum: 0, example: 0 },
    reorderLevel: { type: "integer", minimum: 0, example: 2 },
    discontinued: { type: "boolean", example: false },
    isActive: { type: "boolean", example: true }
  };
}

function customerFields() {
  return {
    name: { type: "string", example: "Jane Buyer" },
    phone: { type: "string", nullable: true, example: "555-0100" },
    email: { type: "string", format: "email", nullable: true },
    address: { type: "string", nullable: true, example: "123 Main St" }
  };
}

module.exports = {
  openApiSpec
};
