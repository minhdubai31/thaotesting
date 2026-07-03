const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  console.error("Create a .env file in the project root and add your Supabase Postgres URL.");
  console.error("Example:");
  console.error(
    'DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_DATABASE_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"'
  );
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function id(group, index) {
	return `00000000-0000-4000-8000-${String(group).padStart(2, '0')}${String(index).padStart(10, '0')}`;
}

function pick(items, index) {
	return items[index % items.length];
}

function money(value) {
	return Number(value.toFixed(2));
}

const cities = [
	'Hà Nội',
	'TP. Hồ Chí Minh',
	'Đà Nẵng',
	'Hải Phòng',
	'Cần Thơ',
	'Huế',
	'Nha Trang',
	'Đà Lạt',
	'Vũng Tàu',
	'Biên Hòa',
	'Bình Dương',
	'Long An',
	'Quy Nhơn',
	'Buôn Ma Thuột',
	'Phan Thiết',
	'Thái Nguyên',
	'Nam Định',
	'Vinh',
	'Rạch Giá',
	'Mỹ Tho',
];

const streets = [
	'Nguyễn Huệ',
	'Lê Lợi',
	'Trần Hưng Đạo',
	'Hai Bà Trưng',
	'Điện Biên Phủ',
	'Võ Văn Kiệt',
	'Nguyễn Trãi',
	'Phan Đình Phùng',
	'Cách Mạng Tháng Tám',
	'Hoàng Văn Thụ',
];

const firstNames = [
	'An',
	'Bình',
	'Châu',
	'Dũng',
	'Giang',
	'Hà',
	'Hải',
	'Hạnh',
	'Khoa',
	'Lan',
	'Linh',
	'Minh',
	'Nam',
	'Ngân',
	'Phúc',
	'Quân',
	'Thao',
	'Trang',
	'Tuấn',
	'Vy',
];

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];

const categories = [
	['Điện thoại phổ thông', 'Điện thoại cơ bản, pin lâu, dễ sử dụng'],
	['Điện thoại thông minh', 'Smartphone Android và iOS bán chạy'],
	['Điện thoại cao cấp', 'Thiết bị flagship chính hãng'],
	['Điện thoại tầm trung', 'Máy cấu hình tốt, giá hợp lý'],
	['Điện thoại gaming', 'Máy tối ưu hiệu năng chơi game'],
	['Máy tính bảng', 'Tablet phục vụ học tập và giải trí'],
	['Tai nghe Bluetooth', 'Tai nghe không dây cho điện thoại'],
	['Sạc nhanh', 'Củ sạc và bộ sạc nhanh'],
	['Cáp sạc', 'Cáp USB-C, Lightning và phụ kiện kết nối'],
	['Ốp lưng', 'Ốp bảo vệ điện thoại nhiều dòng máy'],
	['Kính cường lực', 'Kính bảo vệ màn hình'],
	['Pin dự phòng', 'Sạc dự phòng dung lượng cao'],
	['Đồng hồ thông minh', 'Smartwatch và vòng đeo sức khỏe'],
	['Thiết bị định vị', 'Thiết bị GPS và phụ kiện theo dõi'],
	['Loa di động', 'Loa Bluetooth nhỏ gọn'],
	['Phụ kiện camera', 'Gimbal, tripod và lens điện thoại'],
	['SIM và gói cước', 'SIM 4G/5G và gói dữ liệu'],
	['Máy đã qua sử dụng', 'Thiết bị kiểm định, bảo hành cửa hàng'],
	['Máy doanh nghiệp', 'Thiết bị bán theo lô cho công ty'],
	['Phụ kiện văn phòng', 'Phụ kiện di động cho dân văn phòng'],
];

const brands = [
	'Apple',
	'Samsung',
	'Xiaomi',
	'OPPO',
	'vivo',
	'realme',
	'Nokia',
	'ASUS',
	'Sony',
	'Huawei',
];

const productLines = [
	'Pro Max',
	'Ultra',
	'Note',
	'Lite',
	'Plus',
	'Neo',
	'Mini',
	'Prime',
	'Air',
	'SE',
];

const deliveryNames = [
	'Giao Hàng Nhanh',
	'Giao Hàng Tiết Kiệm',
	'Viettel Post',
	'VNPost',
	'J&T Express',
	'Ninja Van',
	'Ahamove',
	'GrabExpress',
	'Shopee Express',
	'Lalamove',
];

async function seedUsers(passwordHash) {
	const rolesByIndex = [['admin'], ['manager'], ['staff'], ['user']];

	for (let index = 1; index <= 20; index += 1) {
		const roles = pick(rolesByIndex, index - 1);
		await prisma.user.upsert({
			where: { email: `nguoidung${index}@thaostore.vn` },
			update: { roles },
			create: {
				id: id(10, index),
				email: `nguoidung${index}@thaostore.vn`,
				passwordHash,
				roles,
			},
		});
	}
}

async function seedCategories() {
	for (let index = 1; index <= categories.length; index += 1) {
		const [name, description] = categories[index - 1];
		await prisma.category.upsert({
			where: { name },
			update: {
				description,
				picture: `https://example.com/vn/categories/${index}.jpg`,
			},
			create: {
				id: id(20, index),
				name,
				description,
				picture: `https://example.com/vn/categories/${index}.jpg`,
			},
		});
	}
}

async function seedSuppliers() {
	for (let index = 1; index <= 20; index += 1) {
		const city = pick(cities, index - 1);
		await prisma.supplier.upsert({
			where: { id: id(30, index) },
			update: {
				companyName: `Công ty Thiết bị Di động ${city}`,
				contactName: `${pick(lastNames, index)} ${pick(firstNames, index + 2)}`,
				contactTitle: 'Quản lý kinh doanh',
				address: `${index * 7} ${pick(streets, index)}`,
				city,
				region: city,
				postalCode: `70${String(index).padStart(4, '0')}`,
				country: 'Việt Nam',
				phone: `090${String(index).padStart(7, '0')}`,
				fax: `028${String(index).padStart(7, '0')}`,
				homepage: `https://nhacungcap${index}.example.vn`,
			},
			create: {
				id: id(30, index),
				companyName: `Công ty Thiết bị Di động ${city}`,
				contactName: `${pick(lastNames, index)} ${pick(firstNames, index + 2)}`,
				contactTitle: 'Quản lý kinh doanh',
				address: `${index * 7} ${pick(streets, index)}`,
				city,
				region: city,
				postalCode: `70${String(index).padStart(4, '0')}`,
				country: 'Việt Nam',
				phone: `090${String(index).padStart(7, '0')}`,
				fax: `028${String(index).padStart(7, '0')}`,
				homepage: `https://nhacungcap${index}.example.vn`,
			},
		});
	}
}

async function seedDeliveryCompanies() {
	for (let index = 1; index <= 20; index += 1) {
		const baseName = pick(deliveryNames, index - 1);
		await prisma.deliveryCompany.upsert({
			where: { id: id(40, index) },
			update: {
				companyName: `${baseName} ${pick(cities, index)}`,
				phone: `1900${String(index).padStart(4, '0')}`,
				trackingUrl: `https://tracking${index}.example.vn`,
			},
			create: {
				id: id(40, index),
				companyName: `${baseName} ${pick(cities, index)}`,
				phone: `1900${String(index).padStart(4, '0')}`,
				trackingUrl: `https://tracking${index}.example.vn`,
			},
		});
	}
}

async function seedEmployees() {
	for (let index = 1; index <= 20; index += 1) {
		const city = pick(cities, index + 3);
		await prisma.employee.upsert({
			where: { id: id(50, index) },
			update: {
				lastName: pick(lastNames, index - 1),
				firstName: pick(firstNames, index - 1),
				title: index <= 4 ? 'Quản lý cửa hàng' : 'Nhân viên bán hàng',
				titleOfCourtesy: index % 2 === 0 ? 'Anh' : 'Chị',
				birthDate: new Date(1988 + (index % 12), index % 12, 5 + index),
				hireDate: new Date(2021 + (index % 5), index % 12, 1 + index),
				address: `${index * 11} ${pick(streets, index + 4)}`,
				city,
				region: city,
				postalCode: `71${String(index).padStart(4, '0')}`,
				country: 'Việt Nam',
				homePhone: `091${String(index).padStart(7, '0')}`,
				extension: String(100 + index),
				photo: `https://example.com/vn/employees/${index}.jpg`,
				notes: `Nhân sự phụ trách khu vực ${city}`,
				reportsToId: index <= 4 ? null : id(50, ((index - 1) % 4) + 1),
				photoPath: `/employees/vn-${index}.jpg`,
			},
			create: {
				id: id(50, index),
				lastName: pick(lastNames, index - 1),
				firstName: pick(firstNames, index - 1),
				title: index <= 4 ? 'Quản lý cửa hàng' : 'Nhân viên bán hàng',
				titleOfCourtesy: index % 2 === 0 ? 'Anh' : 'Chị',
				birthDate: new Date(1988 + (index % 12), index % 12, 5 + index),
				hireDate: new Date(2021 + (index % 5), index % 12, 1 + index),
				address: `${index * 11} ${pick(streets, index + 4)}`,
				city,
				region: city,
				postalCode: `71${String(index).padStart(4, '0')}`,
				country: 'Việt Nam',
				homePhone: `091${String(index).padStart(7, '0')}`,
				extension: String(100 + index),
				photo: `https://example.com/vn/employees/${index}.jpg`,
				notes: `Nhân sự phụ trách khu vực ${city}`,
				reportsToId: index <= 4 ? null : id(50, ((index - 1) % 4) + 1),
				photoPath: `/employees/vn-${index}.jpg`,
			},
		});
	}
}

async function seedCustomers() {
	for (let index = 1; index <= 50; index += 1) {
		const city = pick(cities, index - 1);
		const name = `${pick(lastNames, index)} ${pick(firstNames, index + 5)}`;
		await prisma.customer.upsert({
			where: { id: id(60, index) },
			update: {
				name,
				phone: `093${String(index).padStart(7, '0')}`,
				email: `khachhang${index}@example.vn`,
				address: `${index * 13} ${pick(streets, index + 2)}, ${city}`,
			},
			create: {
				id: id(60, index),
				name,
				phone: `093${String(index).padStart(7, '0')}`,
				email: `khachhang${index}@example.vn`,
				address: `${index * 13} ${pick(streets, index + 2)}, ${city}`,
			},
		});
	}
}

async function seedProducts() {
	for (let index = 1; index <= 50; index += 1) {
		const brand = pick(brands, index - 1);
		const model = `${brand} ${pick(productLines, index)} ${2020 + (index % 7)}`;
		const categoryIndex = ((index - 1) % 20) + 1;
		const supplierIndex = ((index - 1) % 20) + 1;
		const unitsInStock = 25 + (index % 24);

		await prisma.product.upsert({
			where: { sku: `VN-${brand.toUpperCase()}-${String(index).padStart(3, '0')}` },
			update: {
				name: `${model} chính hãng`,
				brand,
				model,
				category: categories[categoryIndex - 1][0],
				categoryId: id(20, categoryIndex),
				supplierId: id(30, supplierIndex),
				quantityPerUnit: '1 máy / hộp',
				price: money(299 + index * 18.5),
				unitsInStock,
				unitsOnOrder: index % 9,
				reorderLevel: 5 + (index % 6),
				discontinued: false,
				isActive: true,
			},
			create: {
				id: id(70, index),
				sku: `VN-${brand.toUpperCase()}-${String(index).padStart(3, '0')}`,
				name: `${model} chính hãng`,
				brand,
				model,
				category: categories[categoryIndex - 1][0],
				categoryId: id(20, categoryIndex),
				supplierId: id(30, supplierIndex),
				quantityPerUnit: '1 máy / hộp',
				price: money(299 + index * 18.5),
				unitsInStock,
				unitsOnOrder: index % 9,
				reorderLevel: 5 + (index % 6),
				discontinued: false,
				isActive: true,
			},
		});

		await prisma.inventoryItem.upsert({
			where: { productId: id(70, index) },
			update: { quantity: unitsInStock },
			create: {
				id: id(80, index),
				productId: id(70, index),
				quantity: unitsInStock,
			},
		});
	}
}

async function seedOrdersAndRelatedRows() {
	const statuses = ['pending', 'completed', 'cancelled'];

	for (let index = 1; index <= 50; index += 1) {
		const productIndex = ((index - 1) % 50) + 1;
		const product = await prisma.product.findUnique({
			where: { id: id(70, productIndex) },
			select: { price: true },
		});
		const quantity = 1 + (index % 3);
		const discount = index % 5 === 0 ? 0.1 : 0;
		const unitPrice = Number(product.price);
		const freight = money(1.5 + (index % 8));
		const lineTotal = money(unitPrice * quantity * (1 - discount));
		const totalAmount = money(lineTotal + freight);
		const city = pick(cities, index + 1);

		await prisma.order.upsert({
			where: { id: id(90, index) },
			update: {
				customerId: id(60, ((index - 1) % 50) + 1),
				employeeId: id(50, ((index - 1) % 20) + 1),
				createdById: id(10, ((index - 1) % 20) + 1),
				deliveryCompanyId: id(40, ((index - 1) % 20) + 1),
				status: pick(statuses, index),
				orderDate: new Date(2026, index % 12, 1 + (index % 25)),
				requiredDate: new Date(2026, index % 12, 6 + (index % 20)),
				shippedDate: index % 4 === 0 ? null : new Date(2026, index % 12, 3 + (index % 22)),
				freight,
				shipName: `${pick(lastNames, index)} ${pick(firstNames, index + 4)}`,
				shipAddress: `${index * 9} ${pick(streets, index)}`,
				shipCity: city,
				shipRegion: city,
				shipPostalCode: `72${String(index).padStart(4, '0')}`,
				shipCountry: 'Việt Nam',
				totalAmount,
			},
			create: {
				id: id(90, index),
				customerId: id(60, ((index - 1) % 50) + 1),
				employeeId: id(50, ((index - 1) % 20) + 1),
				createdById: id(10, ((index - 1) % 20) + 1),
				deliveryCompanyId: id(40, ((index - 1) % 20) + 1),
				status: pick(statuses, index),
				orderDate: new Date(2026, index % 12, 1 + (index % 25)),
				requiredDate: new Date(2026, index % 12, 6 + (index % 20)),
				shippedDate: index % 4 === 0 ? null : new Date(2026, index % 12, 3 + (index % 22)),
				freight,
				shipName: `${pick(lastNames, index)} ${pick(firstNames, index + 4)}`,
				shipAddress: `${index * 9} ${pick(streets, index)}`,
				shipCity: city,
				shipRegion: city,
				shipPostalCode: `72${String(index).padStart(4, '0')}`,
				shipCountry: 'Việt Nam',
				totalAmount,
			},
		});

		await prisma.orderItem.upsert({
			where: { id: id(91, index) },
			update: {
				orderId: id(90, index),
				productId: id(70, productIndex),
				quantity,
				unitPrice,
				discount,
				lineTotal,
			},
			create: {
				id: id(91, index),
				orderId: id(90, index),
				productId: id(70, productIndex),
				quantity,
				unitPrice,
				discount,
				lineTotal,
			},
		});

		await prisma.stockMovement.upsert({
			where: { id: id(92, index) },
			update: {
				productId: id(70, productIndex),
				userId: id(10, ((index - 1) % 20) + 1),
				type: index % 2 === 0 ? 'in' : 'audit',
				quantity: index % 2 === 0 ? 10 + (index % 5) : 25 + (index % 24),
				note: `Dữ liệu mẫu Việt Nam ${index}`,
			},
			create: {
				id: id(92, index),
				productId: id(70, productIndex),
				userId: id(10, ((index - 1) % 20) + 1),
				type: index % 2 === 0 ? 'in' : 'audit',
				quantity: index % 2 === 0 ? 10 + (index % 5) : 25 + (index % 24),
				note: `Dữ liệu mẫu Việt Nam ${index}`,
			},
		});
	}
}

async function main() {
	const passwordHash = await bcrypt.hash('secret123', 12);

	await seedUsers(passwordHash);
	await seedCategories();
	await seedSuppliers();
	await seedDeliveryCompanies();
	await seedEmployees();
	await seedCustomers();
	await seedProducts();
	await seedOrdersAndRelatedRows();

	console.log('Seeded Vietnamese sample data:');
	console.log('- 20 users');
	console.log('- 20 categories');
	console.log('- 20 suppliers');
	console.log('- 20 delivery companies');
	console.log('- 20 employees');
	console.log('- 50 customers');
	console.log('- 50 products');
	console.log('- 50 inventory items');
	console.log('- 50 orders');
	console.log('- 50 order items');
	console.log('- 50 stock movements');
	console.log('Default password for seeded users: secret123');
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
