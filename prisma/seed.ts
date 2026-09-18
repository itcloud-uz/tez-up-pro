import { PrismaClient, Role, SupplierType, MaterialType, FabricRollStatus, ProductionStage, LeadSource, LeadStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ──────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const defaultPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      name: 'Admin',
      phone: '+998901234567',
      email: 'admin@tezuppro.uz',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isWholesale: false,
    },
  })
  console.log('✅ Admin created:', admin.name)

  const employee = await prisma.user.upsert({
    where: { phone: '+998901234568' },
    update: {},
    create: {
      name: 'Usta Alisher',
      phone: '+998901234568',
      passwordHash: defaultPassword,
      role: Role.EMPLOYEE,
    },
  })
  console.log('✅ Employee created:', employee.name)

  const courier = await prisma.user.upsert({
    where: { phone: '+998901234569' },
    update: {},
    create: {
      name: 'Bekzod Courier',
      phone: '+998901234569',
      passwordHash: defaultPassword,
      role: Role.COURIER,
    },
  })
  console.log('✅ Courier created:', courier.name)

  const customer = await prisma.user.upsert({
    where: { phone: '+998901234570' },
    update: {},
    create: {
      name: 'Aziz Shop',
      phone: '+998901234570',
      passwordHash: defaultPassword,
      role: Role.CUSTOMER,
      isWholesale: true,
    },
  })
  console.log('✅ Customer created:', customer.name)

  // ──────────────────────────────────────────
  // SUPPLIERS
  // ──────────────────────────────────────────
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supplier-local-001' },
    update: {},
    create: {
      id: 'supplier-local-001',
      name: 'Toshkent Mato Zavodi',
      type: SupplierType.LOCAL,
      contactName: 'Mansur Karimov',
      phone: '+998712345678',
      address: 'Toshkent, Yunusobod tumani, 12-uy',
      notes: 'Asosiy mahalliy mato yetkazib beruvchi',
    },
  })

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 'supplier-local-002' },
    update: {},
    create: {
      id: 'supplier-local-002',
      name: 'Fergana Ipak Fabrikasi',
      type: SupplierType.LOCAL,
      contactName: 'Nodira Yusupova',
      phone: '+998732345678',
      address: 'Fargona viloyati, Asaka shahri',
      notes: 'Ipak matolar va to\'qimachilik mahsulotlari',
    },
  })

  const supplier3 = await prisma.supplier.upsert({
    where: { id: 'supplier-intl-001' },
    update: {},
    create: {
      id: 'supplier-intl-001',
      name: 'China Textile Co.',
      type: SupplierType.INTERNATIONAL,
      contactName: 'Wei Zhang',
      phone: '+8613812345678',
      address: 'Guangzhou, China',
      notes: 'Xitoydan import qilinadigan sintetik matolar va to\'ldiruvchilar',
    },
  })
  console.log('✅ 3 Suppliers created')

  // ──────────────────────────────────────────
  // RAW MATERIALS
  // ──────────────────────────────────────────
  const mat1 = await prisma.rawMaterial.upsert({
    where: { id: 'mat-001' },
    update: {},
    create: {
      id: 'mat-001',
      name: 'Paxta-Kapron Mato',
      type: MaterialType.FABRIC,
      unit: 'meters',
      currentStock: 450.5,
      minStock: 100,
      supplierId: supplier1.id,
    },
  })

  const mat2 = await prisma.rawMaterial.upsert({
    where: { id: 'mat-002' },
    update: {},
    create: {
      id: 'mat-002',
      name: 'Ipak Mato',
      type: MaterialType.FABRIC,
      unit: 'meters',
      currentStock: 200,
      minStock: 50,
      supplierId: supplier2.id,
    },
  })

  const mat3 = await prisma.rawMaterial.upsert({
    where: { id: 'mat-003' },
    update: {},
    create: {
      id: 'mat-003',
      name: 'Sintetik To\'ldiruvchi (Holofayber)',
      type: MaterialType.PADDING,
      unit: 'kg',
      currentStock: 120,
      minStock: 30,
      supplierId: supplier3.id,
    },
  })

  const mat4 = await prisma.rawMaterial.upsert({
    where: { id: 'mat-004' },
    update: {},
    create: {
      id: 'mat-004',
      name: 'Plastik Qadoqlash Paketlari',
      type: MaterialType.PACKAGING,
      unit: 'pieces',
      currentStock: 5000,
      minStock: 1000,
      supplierId: supplier3.id,
    },
  })

  const mat5 = await prisma.rawMaterial.upsert({
    where: { id: 'mat-005' },
    update: {},
    create: {
      id: 'mat-005',
      name: 'Elastik Lenta',
      type: MaterialType.OTHER,
      unit: 'meters',
      currentStock: 800,
      minStock: 200,
      supplierId: supplier1.id,
    },
  })
  console.log('✅ 5 Raw materials created')

  // ──────────────────────────────────────────
  // FABRIC ROLLS
  // ──────────────────────────────────────────
  await prisma.fabricRoll.upsert({
    where: { rollNumber: 'ROLL-2024-001' },
    update: {},
    create: {
      rollNumber: 'ROLL-2024-001',
      materialId: mat1.id,
      totalMeters: 150,
      usedMeters: 23.5,
      status: FabricRollStatus.IN_USE,
      notes: 'Birinchi partiya — asosiy ishlab chiqarish uchun',
    },
  })

  await prisma.fabricRoll.upsert({
    where: { rollNumber: 'ROLL-2024-002' },
    update: {},
    create: {
      rollNumber: 'ROLL-2024-002',
      materialId: mat1.id,
      totalMeters: 150,
      usedMeters: 0,
      status: FabricRollStatus.AVAILABLE,
      notes: 'Zaxira rulon',
    },
  })

  await prisma.fabricRoll.upsert({
    where: { rollNumber: 'ROLL-2024-003' },
    update: {},
    create: {
      rollNumber: 'ROLL-2024-003',
      materialId: mat2.id,
      totalMeters: 80,
      usedMeters: 80,
      status: FabricRollStatus.DEPLETED,
      notes: 'To\'liq ishlatilgan',
    },
  })
  console.log('✅ 3 Fabric rolls created')

  // ──────────────────────────────────────────
  // PRODUCTS
  // ──────────────────────────────────────────
  const products = [
    {
      id: 'prod-001',
      name: 'Standart Yostiq',
      slug: 'standart-yostiq',
      description: 'Yuqori sifatli paxta-kapron matolardan tayyorlangan standart o\'lchamli yostiq. 50x70 sm.',
      category: 'Yostiqlar',
      images: ['/uploads/products/standart-yostiq-1.jpg'],
      price: 85000,
      b2bPrice: 65000,
      stock: 120,
    },
    {
      id: 'prod-002',
      name: 'Premium Yostiq (Ortopedik)',
      slug: 'premium-yostiq-ortopedik',
      description: 'Ortopedik holofayber to\'ldiruvchili premium yostiq. Umurtqa pog\'onasini qo\'llab-quvvatlaydi. 60x80 sm.',
      category: 'Yostiqlar',
      images: ['/uploads/products/premium-yostiq-1.jpg', '/uploads/products/premium-yostiq-2.jpg'],
      price: 145000,
      b2bPrice: 115000,
      stock: 45,
    },
    {
      id: 'prod-003',
      name: 'Bolalar Yostig\'i',
      slug: 'bolalar-yostigi',
      description: 'Bolalar uchun maxsus yumshoq va gipoallergen yostiq. 40x60 sm.',
      category: 'Bolalar',
      images: ['/uploads/products/bolalar-yostigi-1.jpg'],
      price: 65000,
      b2bPrice: 50000,
      stock: 80,
    },
    {
      id: 'prod-004',
      name: 'Ko\'rpa (Standart)',
      slug: 'korpa-standart',
      description: 'Har fasl uchun qulay paxta ko\'rpa. 150x200 sm. Mashinada yuviladi.',
      category: 'Ko\'rpalar',
      images: ['/uploads/products/korpa-standart-1.jpg'],
      price: 320000,
      b2bPrice: 260000,
      stock: 30,
    },
    {
      id: 'prod-005',
      name: 'Ipak Ko\'rpa (Premium)',
      slug: 'ipak-korpa-premium',
      description: 'Tabiiy ipak matoli, holofayber to\'ldiruvchili premium ko\'rpa. 200x220 sm.',
      category: 'Ko\'rpalar',
      images: ['/uploads/products/ipak-korpa-1.jpg', '/uploads/products/ipak-korpa-2.jpg'],
      price: 580000,
      b2bPrice: 470000,
      stock: 15,
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }
  console.log('✅ 5 Products created')

  // ──────────────────────────────────────────
  // LEADS
  // ──────────────────────────────────────────
  await prisma.lead.upsert({
    where: { id: 'lead-001' },
    update: {},
    create: {
      id: 'lead-001',
      name: 'Sherzod Toshmatov',
      phone: '+998901112233',
      email: 'sherzod@gmail.com',
      source: LeadSource.INSTAGRAM,
      status: LeadStatus.NEW,
      notes: 'Instagram reklamadan kelgan. Bolalar yostig\'iga qiziqgan.',
    },
  })

  await prisma.lead.upsert({
    where: { id: 'lead-002' },
    update: {},
    create: {
      id: 'lead-002',
      name: 'Malika Xolmatova',
      phone: '+998904445566',
      source: LeadSource.FACEBOOK,
      status: LeadStatus.CONTACTED,
      assignedToId: admin.id,
      notes: 'Facebook orqali murojaat qildi. Premium ko\'rpaga buyurtma berishni xohlaydi. Narx haqida gaplashildi.',
    },
  })
  console.log('✅ 2 Leads created')

  // ──────────────────────────────────────────
  // PRODUCTION BATCH
  // ──────────────────────────────────────────
  const firstProduct = await prisma.product.findUnique({ where: { id: 'prod-001' } })
  if (firstProduct) {
    await prisma.productionBatch.upsert({
      where: { id: 'batch-001' },
      update: {},
      create: {
        id: 'batch-001',
        productId: firstProduct.id,
        quantity: 50,
        currentStage: ProductionStage.CUTTING,
        assignedEmployeeId: employee.id,
        notes: 'Birinchi partiya — 50 dona standart yostiq. Kesish bosqichida.',
        startedAt: new Date(),
      },
    })

    // Log the initial stage transition
    await prisma.stageLog.upsert({
      where: { id: 'stagelog-001' },
      update: {},
      create: {
        id: 'stagelog-001',
        batchId: 'batch-001',
        fromStage: ProductionStage.RECEIVING,
        toStage: ProductionStage.CUTTING,
        employeeId: employee.id,
        notes: 'Xom ashyo qabul qilindi, kesish bosqichiga o\'tildi.',
      },
    })
    console.log('✅ 1 Production batch created (CUTTING stage)')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
