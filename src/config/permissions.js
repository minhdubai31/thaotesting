const permissions = [
  "products:read",
  "products:create",
  "products:update",
  "products:delete",
  "categories:read",
  "categories:create",
  "categories:update",
  "suppliers:read",
  "suppliers:create",
  "suppliers:update",
  "inventory:read",
  "inventory:adjust",
  "customers:read",
  "customers:create",
  "customers:update",
  "delivery_companies:read",
  "delivery_companies:create",
  "delivery_companies:update",
  "employees:read",
  "employees:create",
  "employees:update",
  "orders:read",
  "orders:create",
  "orders:update",
  "users:update_roles"
];

const rolePermissions = {
  admin: permissions,
  manager: permissions.filter((permission) => permission !== "users:update_roles"),
  staff: [
    "products:read",
    "categories:read",
    "suppliers:read",
    "inventory:read",
    "customers:read",
    "customers:create",
    "delivery_companies:read",
    "employees:read",
    "orders:read",
    "orders:create"
  ],
  user: []
};

function getPermissionsForRoles(roles) {
  return [
    ...new Set(
      roles.flatMap((role) => rolePermissions[String(role).toLowerCase()] || [])
    )
  ];
}

module.exports = {
  permissions,
  rolePermissions,
  getPermissionsForRoles
};
