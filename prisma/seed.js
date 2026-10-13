const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  console.error("Create a .env file in the project root and add your Supabase Postgres URL.");
  process.exit(1);
}

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Product names, brands and launch prices come from public Vietnamese retailer
// listings (2026). Entries marked "est" are estimates, not verified prices:
// check them against the official store before using them for real sales.

const categories = [
  { name: "Điện thoại cao cấp", description: "Flagship chính hãng, cấu hình hàng đầu" },
  { name: "Điện thoại tầm trung", description: "Cấu hình tốt, giá hợp lý" },
  { name: "Điện thoại phổ thông", description: "Pin lâu, dùng cơ bản, giá dễ tiếp cận" },
  { name: "Máy tính bảng", description: "Tablet học tập và giải trí" },
  { name: "Đồng hồ thông minh", description: "Smartwatch và vòng đeo theo dõi sức khỏe" },
  { name: "Tai nghe", description: "Tai nghe không dây và chụp tai" },
  { name: "Loa di động", description: "Loa Bluetooth nhỏ gọn" },
  { name: "Sạc & cáp", description: "Củ sạc, cáp USB-C và Lightning" },
  { name: "Pin dự phòng", description: "Sạc dự phòng dung lượng cao" },
  { name: "Ốp lưng & kính cường lực", description: "Bảo vệ máy và màn hình" },
];

const suppliers = [
  { companyName: "Apple Việt Nam", homepage: "https://www.apple.com/vn" },
  { companyName: "Samsung Electronics Việt Nam", homepage: "https://www.samsung.com/vn" },
  { companyName: "Xiaomi Việt Nam", homepage: "https://www.mi.com/vn" },
  { companyName: "OPPO Việt Nam", homepage: "https://www.oppo.com/vn" },
  { companyName: "Sony Việt Nam", homepage: "https://www.sony.com.vn" },
  { companyName: "JBL Việt Nam", homepage: "https://vn.jbl.com" },
  { companyName: "Baseus Việt Nam", homepage: "https://www.baseus.com" },
  { companyName: "Phụ kiện đa thương hiệu", homepage: null },
];

const deliveryCompanies = [
  { companyName: "Giao Hàng Nhanh (GHN)", trackingUrl: "https://ghn.vn" },
  { companyName: "Giao Hàng Tiết Kiệm (GHTK)", trackingUrl: "https://ghtk.vn" },
  { companyName: "Viettel Post", trackingUrl: "https://viettelpost.vn" },
  { companyName: "VNPost", trackingUrl: "https://vnpost.vn" },
  { companyName: "J&T Express", trackingUrl: "https://jtexpress.vn" },
  { companyName: "Ninja Van", trackingUrl: "https://ninjavan.co/vi-vn" },
];

// price is in VND. stock is the quantity on hand after sales.
const products = [
  // Apple
  { sku: "APL-IP17PM-256", brand: "Apple", model: "iPhone 17 Pro Max 256GB", category: "Điện thoại cao cấp", supplier: "Apple Việt Nam", price: 36990000, stock: 12, reorder: 3 },
  { sku: "APL-IP17-256", brand: "Apple", model: "iPhone 17 256GB", category: "Điện thoại cao cấp", supplier: "Apple Việt Nam", price: 24590000, stock: 18, reorder: 5 },
  { sku: "APL-IP16-128", brand: "Apple", model: "iPhone 16 128GB (est)", category: "Điện thoại tầm trung", supplier: "Apple Việt Nam", price: 23990000, stock: 10, reorder: 4 },
  { sku: "APL-IPADA16-128", brand: "Apple", model: "iPad (A16) 128GB Wi-Fi (est)", category: "Máy tính bảng", supplier: "Apple Việt Nam", price: 9990000, stock: 8, reorder: 3 },
  { sku: "APL-AW11-42", brand: "Apple", model: "Apple Watch Series 11 42mm (est)", category: "Đồng hồ thông minh", supplier: "Apple Việt Nam", price: 9990000, stock: 6, reorder: 2 },
  { sku: "APL-AP4", brand: "Apple", model: "AirPods 4 (est)", category: "Tai nghe", supplier: "Apple Việt Nam", price: 4490000, stock: 15, reorder: 5 },
  { sku: "APL-ADP20W", brand: "Apple", model: "Củ sạc Apple 20W USB-C (est)", category: "Sạc & cáp", supplier: "Apple Việt Nam", price: 490000, stock: 40, reorder: 10 },
  { sku: "APL-CBL-USBC-LTG", brand: "Apple", model: "Cáp USB-C to Lightning 1m (est)", category: "Sạc & cáp", supplier: "Apple Việt Nam", price: 490000, stock: 35, reorder: 10 },

  // Samsung
  { sku: "SAM-S26-256", brand: "Samsung", model: "Galaxy S26 12GB/256GB", category: "Điện thoại cao cấp", supplier: "Samsung Electronics Việt Nam", price: 20990000, stock: 14, reorder: 4 },
  { sku: "SAM-A57-256", brand: "Samsung", model: "Galaxy A57 5G 12GB/256GB", category: "Điện thoại tầm trung", supplier: "Samsung Electronics Việt Nam", price: 14490000, stock: 20, reorder: 5 },
  { sku: "SAM-A57-128", brand: "Samsung", model: "Galaxy A57 5G 8GB/128GB", category: "Điện thoại tầm trung", supplier: "Samsung Electronics Việt Nam", price: 12490000, stock: 22, reorder: 5 },
  { sku: "SAM-A37-256", brand: "Samsung", model: "Galaxy A37 5G", category: "Điện thoại tầm trung", supplier: "Samsung Electronics Việt Nam", price: 10290000, stock: 25, reorder: 6 },
  { sku: "SAM-A55-128", brand: "Samsung", model: "Galaxy A55 5G 8GB/128GB (est)", category: "Điện thoại tầm trung", supplier: "Samsung Electronics Việt Nam", price: 9990000, stock: 16, reorder: 5 },
  { sku: "SAM-A16-128", brand: "Samsung", model: "Galaxy A16 5G 6GB/128GB (est)", category: "Điện thoại phổ thông", supplier: "Samsung Electronics Việt Nam", price: 5990000, stock: 30, reorder: 8 },
  { sku: "SAM-TABS10FE", brand: "Samsung", model: "Galaxy Tab S10 FE (est)", category: "Máy tính bảng", supplier: "Samsung Electronics Việt Nam", price: 10990000, stock: 7, reorder: 2 },
  { sku: "SAM-BUDS3", brand: "Samsung", model: "Galaxy Buds3 (est)", category: "Tai nghe", supplier: "Samsung Electronics Việt Nam", price: 3990000, stock: 18, reorder: 5 },
  { sku: "SAM-WATCH8", brand: "Samsung", model: "Galaxy Watch8 (est)", category: "Đồng hồ thông minh", supplier: "Samsung Electronics Việt Nam", price: 7990000, stock: 9, reorder: 3 },
  { sku: "SAM-ADP45W", brand: "Samsung", model: "Củ sạc Samsung 45W (est)", category: "Sạc & cáp", supplier: "Samsung Electronics Việt Nam", price: 590000, stock: 30, reorder: 8 },

  // Xiaomi
  { sku: "XIA-17T", brand: "Xiaomi", model: "Xiaomi 17T", category: "Điện thoại cao cấp", supplier: "Xiaomi Việt Nam", price: 20090000, stock: 11, reorder: 4 },
  { sku: "XIA-RN14-256", brand: "Xiaomi", model: "Redmi Note 14 5G 8GB/256GB (est)", category: "Điện thoại tầm trung", supplier: "Xiaomi Việt Nam", price: 6990000, stock: 28, reorder: 6 },
  { sku: "XIA-R14C-128", brand: "Xiaomi", model: "Redmi 14C 4GB/128GB (est)", category: "Điện thoại phổ thông", supplier: "Xiaomi Việt Nam", price: 2990000, stock: 34, reorder: 8 },
  { sku: "XIA-BAND9", brand: "Xiaomi", model: "Xiaomi Smart Band 9 (est)", category: "Đồng hồ thông minh", supplier: "Xiaomi Việt Nam", price: 1090000, stock: 25, reorder: 6 },
  { sku: "XIA-PB20K", brand: "Xiaomi", model: "Xiaomi Power Bank 20000mAh (est)", category: "Pin dự phòng", supplier: "Xiaomi Việt Nam", price: 690000, stock: 30, reorder: 8 },

  // OPPO
  { sku: "OPP-FX9S-256", brand: "OPPO", model: "Find X9s 12GB/256GB", category: "Điện thoại cao cấp", supplier: "OPPO Việt Nam", price: 24990000, stock: 9, reorder: 3 },
  { sku: "OPP-FX9U-512", brand: "OPPO", model: "Find X9 Ultra 12GB/512GB", category: "Điện thoại cao cấp", supplier: "OPPO Việt Nam", price: 49990000, stock: 5, reorder: 2 },

  // Sony and JBL
  { sku: "SNY-WH1000XM5", brand: "Sony", model: "WH-1000XM5 (est)", category: "Tai nghe", supplier: "Sony Việt Nam", price: 7990000, stock: 8, reorder: 3 },
  { sku: "JBL-GO4", brand: "JBL", model: "JBL Go 4 (est)", category: "Loa di động", supplier: "JBL Việt Nam", price: 1290000, stock: 20, reorder: 5 },

  // Accessories
  { sku: "BAS-GAN65", brand: "Baseus", model: "Củ sạc GaN 65W USB-C (est)", category: "Sạc & cáp", supplier: "Baseus Việt Nam", price: 390000, stock: 40, reorder: 10 },
  { sku: "BAS-PB20K", brand: "Baseus", model: "Pin dự phòng 20000mAh (est)", category: "Pin dự phòng", supplier: "Baseus Việt Nam", price: 490000, stock: 26, reorder: 8 },
  { sku: "ACC-CBL-C100W", brand: "Đa thương hiệu", model: "Cáp USB-C 100W 1m (est)", category: "Sạc & cáp", supplier: "Phụ kiện đa thương hiệu", price: 199000, stock: 60, reorder: 15 },
  { sku: "ACC-CASE-IP17PM", brand: "Đa thương hiệu", model: "Ốp lưng silicone iPhone 17 Pro Max (est)", category: "Ốp lưng & kính cường lực", supplier: "Phụ kiện đa thương hiệu", price: 290000, stock: 45, reorder: 10 },
  { sku: "ACC-GLASS-IP17", brand: "Đa thương hiệu", model: "Kính cường lực iPhone 17 (est)", category: "Ốp lưng & kính cường lực", supplier: "Phụ kiện đa thương hiệu", price: 150000, stock: 55, reorder: 12 },
];

const customerNames = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Thu Hà", "Hoàng Minh Đức",
  "Huỳnh Ngọc Giang", "Phan Quốc Hải", "Vũ Thị Hạnh", "Võ Đình Khoa", "Đặng Mai Linh",
  "Nguyễn Thanh Long", "Trần Bảo Ngọc", "Lê Thị Phương", "Phạm Gia Quân", "Hoàng Thị Thảo",
  "Huỳnh Đức Trung", "Phan Thị Uyên", "Vũ Tuấn Vinh", "Võ Thị Yến", "Đặng Minh Tâm",
  "Nguyễn Hữu Phước", "Trần Quang Huy", "Lê Thanh Tú", "Phạm Ngọc Diệp", "Hoàng Văn Sơn",
  "Huỳnh Thị Kim", "Phan Anh Tuấn", "Vũ Hải Yến", "Võ Minh Châu", "Đặng Thùy Dương",
];

const customerCities = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Nha Trang",
  "Đà Lạt", "Biên Hòa", "Bình Dương", "Vũng Tàu", "Quy Nhơn",
];

const employees = [
  { firstName: "Minh", lastName: "Nguyễn", title: "Quản lý cửa hàng", titleOfCourtesy: "Anh", city: "TP. Hồ Chí Minh" },
  { firstName: "Hương", lastName: "Trần", title: "Quản lý kho", titleOfCourtesy: "Chị", city: "TP. Hồ Chí Minh" },
  { firstName: "Tuấn", lastName: "Lê", title: "Nhân viên bán hàng", titleOfCourtesy: "Anh", city: "Hà Nội" },
  { firstName: "Thảo", lastName: "Phạm", title: "Nhân viên bán hàng", titleOfCourtesy: "Chị", city: "Hà Nội" },
  { firstName: "Đạt", lastName: "Hoàng", title: "Nhân viên bán hàng", titleOfCourtesy: "Anh", city: "Đà Nẵng" },
  { firstName: "Ngọc", lastName: "Vũ", title: "Nhân viên bán hàng", titleOfCourtesy: "Chị", city: "Cần Thơ" },
];

const streets = [
  "Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", "Điện Biên Phủ",
  "Võ Văn Kiệt", "Nguyễn Trãi", "Phan Đình Phùng", "Cách Mạng Tháng Tám", "Hoàng Văn Thụ",
];

const orderCount = 40;
const orderStatuses = ["completed", "completed", "pending", "cancelled"];

function money(value) {
  return Number(value.toFixed(2));
}

async function clearBusinessData() {
  // Login accounts (users) are kept so existing sign-ins keep working.
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.deliveryCompany.deleteMany(),
    prisma.employee.deleteMany(),
  ]);
}

async function getCreator() {
  // Default sign-in is admin / admin. Override with ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env.
  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || "admin@thaostore.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin";
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, roles: ["admin"] },
    create: { username, email, passwordHash, roles: ["admin"] },
  });
}

async function seedCategories() {
  const created = {};
  for (const category of categories) {
    created[category.name] = await prisma.category.create({ data: category });
  }
  return created;
}

async function seedSuppliers() {
  const created = {};
  for (const supplier of suppliers) {
    created[supplier.companyName] = await prisma.supplier.create({
      data: { ...supplier, country: "Việt Nam" },
    });
  }
  return created;
}

async function seedDeliveryCompanies() {
  const created = [];
  for (const company of deliveryCompanies) {
    created.push(await prisma.deliveryCompany.create({ data: company }));
  }
  return created;
}

async function seedEmployees() {
  const created = [];
  for (const [index, employee] of employees.entries()) {
    const isManager = index < 2;
    created.push(
      await prisma.employee.create({
        data: {
          ...employee,
          country: "Việt Nam",
          hireDate: new Date(Date.UTC(2022 + (index % 4), index, 1)),
          birthDate: new Date(Date.UTC(1990 + index, index, 10)),
          address: `${10 + index * 7} ${streets[index % streets.length]}`,
          region: employee.city,
          reportsToId: isManager ? null : created[0].id,
        },
      })
    );
  }
  return created;
}

async function seedCustomers() {
  const created = [];
  for (const [index, name] of customerNames.entries()) {
    const city = customerCities[index % customerCities.length];
    created.push(
      await prisma.customer.create({
        data: {
          name,
          // Sample numbers only, not real subscribers.
          phone: `0900000${String(index + 1).padStart(3, "0")}`,
          email: `khach${index + 1}@example.vn`,
          address: `${(index + 1) * 12} ${streets[index % streets.length]}, ${city}`,
        },
      })
    );
  }
  return created;
}

async function seedProducts(categoryMap, supplierMap) {
  const created = [];
  for (const item of products) {
    created.push(
      await prisma.product.create({
        data: {
          sku: item.sku,
          name: `${item.brand} ${item.model}`,
          brand: item.brand,
          model: item.model,
          category: item.category,
          categoryId: categoryMap[item.category].id,
          supplierId: supplierMap[item.supplier].id,
          quantityPerUnit: "1 sản phẩm / hộp",
          price: item.price,
          unitsInStock: item.stock,
          unitsOnOrder: 0,
          reorderLevel: item.reorder,
          discontinued: false,
          isActive: true,
        },
      })
    );
  }
  return created;
}

async function seedOrders({ creator, customers, employees, deliveries, productRows }) {
  // Track how much each product sells so stock on hand matches the orders.
  const sold = new Map(productRows.map((product) => [product.id, 0]));
  const salesStaff = employees.filter((employee) => employee.title === "Nhân viên bán hàng");
  const orderRecords = [];

  for (let index = 0; index < orderCount; index += 1) {
    const status = orderStatuses[index % orderStatuses.length];
    const customer = customers[index % customers.length];
    const employee = salesStaff[index % salesStaff.length];
    const delivery = deliveries[index % deliveries.length];
    const itemCount = 1 + (index % 3);
    const orderDate = new Date(Date.UTC(2026, index % 9, 1 + (index % 27)));
    const shipped = status === "completed";
    const freight = money(25000 + (index % 4) * 5000);

    const usedProducts = new Set();
    const lines = [];

    for (let k = 0; lines.length < itemCount && k < 50; k += 1) {
      const product = productRows[(index * 7 + k * 5) % productRows.length];
      if (usedProducts.has(product.id)) continue;
      usedProducts.add(product.id);

      const quantity = 1 + ((index + k) % 2);
      const discount = index % 6 === 0 ? 0.05 : 0;
      const unitPrice = Number(product.price);
      const lineTotal = money(unitPrice * quantity * (1 - discount));
      lines.push({ product, quantity, discount, unitPrice, lineTotal });
    }

    const totalAmount = money(lines.reduce((sum, line) => sum + line.lineTotal, 0) + freight);
    const city = customer.address.split(", ").pop();

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        employeeId: employee.id,
        createdById: creator.id,
        deliveryCompanyId: delivery.id,
        status,
        orderDate,
        requiredDate: new Date(orderDate.getTime() + 5 * 86400000),
        shippedDate: shipped ? new Date(orderDate.getTime() + 2 * 86400000) : null,
        freight,
        shipName: customer.name,
        shipAddress: customer.address.split(", ")[0],
        shipCity: city,
        shipRegion: city,
        shipCountry: "Việt Nam",
        totalAmount,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            lineTotal: line.lineTotal,
          })),
        },
      },
    });

    if (status !== "cancelled") {
      for (const line of lines) {
        sold.set(line.product.id, sold.get(line.product.id) + line.quantity);
      }
    }

    orderRecords.push({ order, lines, status });
  }

  return { sold, orderRecords };
}

async function seedInventory({ creator, productRows, sold }) {
  for (const product of productRows) {
    const onHand = product.unitsInStock;
    const received = onHand + sold.get(product.id);

    await prisma.inventoryItem.create({
      data: { productId: product.id, quantity: onHand },
    });

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        userId: creator.id,
        type: "in",
        quantity: received,
        note: "Nhập kho đầu kỳ",
      },
    });
  }
}

async function seedStockMovementsForSales({ creator, orderRecords }) {
  for (const { lines, status } of orderRecords) {
    if (status === "cancelled") continue;
    for (const line of lines) {
      await prisma.stockMovement.create({
        data: {
          productId: line.product.id,
          userId: creator.id,
          type: "out",
          quantity: line.quantity,
          note: "Xuất bán theo đơn hàng",
        },
      });
    }
  }
}

async function main() {
  await clearBusinessData();

  const creator = await getCreator();
  const categoryMap = await seedCategories();
  const supplierMap = await seedSuppliers();
  const deliveries = await seedDeliveryCompanies();
  const employees = await seedEmployees();
  const customers = await seedCustomers();
  const productRows = await seedProducts(categoryMap, supplierMap);

  const { sold, orderRecords } = await seedOrders({
    creator,
    customers,
    employees,
    deliveries,
    productRows,
  });

  await seedInventory({ creator, productRows, sold });
  await seedStockMovementsForSales({ creator, orderRecords });

  console.log("Cleared old business data and seeded real-world sample data:");
  console.log(`- ${categories.length} categories`);
  console.log(`- ${suppliers.length} suppliers`);
  console.log(`- ${deliveryCompanies.length} delivery companies`);
  console.log(`- ${employees.length} employees`);
  console.log(`- ${customers.length} customers`);
  console.log(`- ${products.length} products (with inventory)`);
  console.log(`- ${orderCount} orders`);
  console.log(`Admin sign-in: ${creator.username} (password from ADMIN_PASSWORD, default "admin")`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
