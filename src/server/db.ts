import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Business,
  User,
  ProductCategory,
  Product,
  ProductVariant,
  Ingredient,
  RecipeItem,
  InventoryMovement,
  Supplier,
  Purchase,
  Sale,
  Expense,
  CashSession,
  CashMovement,
  AuditLog,
} from '../types/index.ts';

export interface DatabaseSchema {
  businesses: Business[];
  users: User[];
  categories: ProductCategory[];
  products: Product[];
  productVariants: ProductVariant[];
  ingredients: Ingredient[];
  recipes: RecipeItem[];
  inventoryMovements: InventoryMovement[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bisnis_kita.json');

class DatabaseService {
  private data: DatabaseSchema = {
    businesses: [],
    users: [],
    categories: [],
    products: [],
    productVariants: [],
    ingredients: [],
    recipes: [],
    inventoryMovements: [],
    suppliers: [],
    purchases: [],
    sales: [],
    expenses: [],
    cashSessions: [],
    cashMovements: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('Failed to parse database file, resetting with seed data:', err);
      }
    }

    this.seedDefaultData();
    this.save();
  }

  public save() {
    try {
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Database save error:', err);
    }
  }

  private seedDefaultData() {
    const bizId = 'biz-demo-001';
    const ownerId = 'usr-owner-001';
    const cashierId = 'usr-cashier-001';
    const invStaffId = 'usr-inv-001';
    const now = new Date().toISOString();

    const business: Business = {
      id: bizId,
      name: 'Warung Rasa Nusantara',
      tagline: 'Citarasa Kuliner Tradisional & Kopi Pilihan',
      logoUrl: '/src/assets/images/logo_bisnis_kita_1792863234751.jpg',
      address: 'Jl. Malioboro No. 45, Yogyakarta',
      phone: '0812-3456-7890',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      taxRate: 10, // 10% PB1
      serviceFeeRate: 0,
      receiptHeader: 'WARUNG RASA NUSANTARA\nJl. Malioboro No. 45 Yogyakarta\nTelp: 0812-3456-7890',
      receiptFooter: 'Terima Kasih atas Kunjungan Anda!\nSemoga Hari Anda Menyenangkan.',
      minStockAlertDefault: 5,
      createdAt: now,
      updatedAt: now,
    };

    const salt = bcrypt.genSaltSync(10);
    const ownerPasswordHash = bcrypt.hashSync('BisnisKita2026!', salt);
    const cashierPasswordHash = bcrypt.hashSync('Kasir123!', salt);
    const invPasswordHash = bcrypt.hashSync('Gudang123!', salt);

    const users: User[] = [
      {
        id: ownerId,
        businessId: bizId,
        username: 'owner_demokuliner',
        passwordHash: ownerPasswordHash,
        fullName: 'Budi Santoso',
        email: 'owner@rasanusantara.id',
        phone: '081234567890',
        role: 'owner',
        isActive: true,
        temporaryPasswordChanged: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: cashierId,
        businessId: bizId,
        username: 'kasir_siti',
        passwordHash: cashierPasswordHash,
        fullName: 'Siti Rahmawati',
        email: 'siti@rasanusantara.id',
        phone: '081298765432',
        role: 'cashier',
        isActive: true,
        temporaryPasswordChanged: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: invStaffId,
        businessId: bizId,
        username: 'gudang_agus',
        passwordHash: invPasswordHash,
        fullName: 'Agus Purnomo',
        email: 'agus@rasanusantara.id',
        phone: '081377889900',
        role: 'inventory',
        isActive: true,
        temporaryPasswordChanged: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const categories: ProductCategory[] = [
      { id: 'cat-01', businessId: bizId, name: 'Makanan Utama', icon: 'Utensils', sortOrder: 1, isActive: true },
      { id: 'cat-02', businessId: bizId, name: 'Kopi & Minuman', icon: 'Coffee', sortOrder: 2, isActive: true },
      { id: 'cat-03', businessId: bizId, name: 'Camilan & Tambahan', icon: 'Cookie', sortOrder: 3, isActive: true },
    ];

    const ingredients: Ingredient[] = [
      { id: 'ing-01', businessId: bizId, sku: 'BAHAN-AYAM', name: 'Daging Ayam Broiler', unit: 'kg', currentStock: 25.5, minStock: 5.0, avgCost: 35000, createdAt: now, updatedAt: now },
      { id: 'ing-02', businessId: bizId, sku: 'BAHAN-CABAI', name: 'Cabai Rawit Merah', unit: 'kg', currentStock: 8.0, minStock: 2.0, avgCost: 45000, createdAt: now, updatedAt: now },
      { id: 'ing-03', businessId: bizId, sku: 'BAHAN-BERAS', name: 'Beras Premium Ramos', unit: 'kg', currentStock: 60.0, minStock: 15.0, avgCost: 14000, createdAt: now, updatedAt: now },
      { id: 'ing-04', businessId: bizId, sku: 'BAHAN-MINYAK', name: 'Minyak Goreng Sawit', unit: 'liter', currentStock: 30.0, minStock: 10.0, avgCost: 16500, createdAt: now, updatedAt: now },
      { id: 'ing-05', businessId: bizId, sku: 'BAHAN-KOPI', name: 'Biji Kopi House Blend Arabica', unit: 'kg', currentStock: 12.0, minStock: 3.0, avgCost: 120000, createdAt: now, updatedAt: now },
      { id: 'ing-06', businessId: bizId, sku: 'BAHAN-SUSU', name: 'Susu Fresh Milk UHT', unit: 'liter', currentStock: 24.0, minStock: 6.0, avgCost: 19000, createdAt: now, updatedAt: now },
      { id: 'ing-07', businessId: bizId, sku: 'BAHAN-AREN', name: 'Gula Aren Organik Cair', unit: 'liter', currentStock: 10.0, minStock: 3.0, avgCost: 38000, createdAt: now, updatedAt: now },
      { id: 'ing-08', businessId: bizId, sku: 'BAHAN-KEMASAN', name: 'Kotak Kraft Food Grade & Cup', unit: 'pcs', currentStock: 350, minStock: 50, avgCost: 1200, createdAt: now, updatedAt: now },
    ];

    const products: Product[] = [
      {
        id: 'prd-01',
        businessId: bizId,
        categoryId: 'cat-01',
        sku: 'MENU-AGP',
        name: 'Ayam Geprek Sambal Korek',
        description: 'Ayam goreng krispi ditumbuk dengan ulekan cabai rawit merah pedas gurih, disajikan dengan lalapan segar.',
        imageUrl: '/src/assets/images/ayam_geprek_crispy_1792863232199.jpg',
        price: 24000,
        cost: 11500,
        unit: 'porsi',
        inventoryMode: 'recipe', // uses recipe bill of materials
        currentStock: 0,
        minStock: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd-02',
        businessId: bizId,
        categoryId: 'cat-02',
        sku: 'MENU-KSA',
        name: 'Kopi Susu Gula Aren Spesial',
        description: 'Espresso blend pilihan berpadu susu segar dingin dan saus gula aren kelapa legit wangi.',
        imageUrl: '/src/assets/images/kopi_susu_aren_1792863233464.jpg',
        price: 20000,
        cost: 7200,
        unit: 'cup',
        inventoryMode: 'recipe',
        currentStock: 0,
        minStock: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd-03',
        businessId: bizId,
        categoryId: 'cat-01',
        sku: 'MENU-NGS',
        name: 'Nasi Goreng Spesial Rempah',
        description: 'Nasi goreng racikan bumbu khas dengan suwiran ayam, telur mata sapi, sate ayam, dan kerupuk.',
        imageUrl: '/src/assets/images/nasi_goreng_spesial_1792863234486.jpg',
        price: 28000,
        cost: 13500,
        unit: 'porsi',
        inventoryMode: 'recipe',
        currentStock: 0,
        minStock: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd-04',
        businessId: bizId,
        categoryId: 'cat-01',
        sku: 'MENU-MPD',
        name: 'Mie Pedas Juara Level 3',
        description: 'Mie kenyal gurih dibalut minyak cabai harum dengan taburan ayam cincang dan pangsit krispi.',
        imageUrl: '/src/assets/images/mie_pedas_level_1792863234002.jpg',
        price: 22000,
        cost: 9800,
        unit: 'porsi',
        inventoryMode: 'recipe',
        currentStock: 0,
        minStock: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd-05',
        businessId: bizId,
        categoryId: 'cat-02',
        sku: 'MENU-ETM',
        name: 'Es Teh Manis Jasmine Segar',
        description: 'Teh melati seduh segar dengan es batu melimpah dan manis alami.',
        imageUrl: '',
        price: 7000,
        cost: 2000,
        unit: 'gelas',
        inventoryMode: 'product',
        currentStock: 120,
        minStock: 20,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd-06',
        businessId: bizId,
        categoryId: 'cat-03',
        sku: 'MENU-KTG',
        name: 'Kentang Goreng Keju Barbeque',
        description: 'Kentang krispi renyah dengan taburan bumbu barbeque dan dipping sauce keju.',
        imageUrl: '',
        price: 18000,
        cost: 7500,
        unit: 'porsi',
        inventoryMode: 'product',
        currentStock: 40,
        minStock: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const productVariants: ProductVariant[] = [
      { id: 'var-01', productId: 'prd-01', name: 'Level 1 (Sedang)', priceAdjustment: 0 },
      { id: 'var-02', productId: 'prd-01', name: 'Level 3 (Pedas Nampol)', priceAdjustment: 2000 },
      { id: 'var-03', productId: 'prd-01', name: 'Level 5 (Super Pedas)', priceAdjustment: 4000 },
      { id: 'var-04', productId: 'prd-02', name: 'Ukuran Regular (16oz)', priceAdjustment: 0 },
      { id: 'var-05', productId: 'prd-02', name: 'Ukuran Large (22oz)', priceAdjustment: 5000 },
    ];

    // Recipes (Bill of Materials)
    const recipes: RecipeItem[] = [
      // Ayam Geprek uses: 0.25 kg chicken, 0.04 kg rawit, 0.05 liter oil, 1 pcs packaging
      { id: 'rcp-01', productId: 'prd-01', ingredientId: 'ing-01', quantityRequired: 0.25 },
      { id: 'rcp-02', productId: 'prd-01', ingredientId: 'ing-02', quantityRequired: 0.04 },
      { id: 'rcp-03', productId: 'prd-01', ingredientId: 'ing-04', quantityRequired: 0.05 },
      { id: 'rcp-04', productId: 'prd-01', ingredientId: 'ing-08', quantityRequired: 1 },

      // Kopi Susu uses: 0.018 kg coffee (18g), 0.15 liter milk, 0.03 liter gula aren, 1 pcs cup
      { id: 'rcp-05', productId: 'prd-02', ingredientId: 'ing-05', quantityRequired: 0.018 },
      { id: 'rcp-06', productId: 'prd-02', ingredientId: 'ing-06', quantityRequired: 0.15 },
      { id: 'rcp-07', productId: 'prd-02', ingredientId: 'ing-07', quantityRequired: 0.03 },
      { id: 'rcp-08', productId: 'prd-02', ingredientId: 'ing-08', quantityRequired: 1 },

      // Nasi Goreng uses: 0.18 kg rice, 0.10 kg chicken, 0.04 liter oil, 1 pcs packaging
      { id: 'rcp-09', productId: 'prd-03', ingredientId: 'ing-03', quantityRequired: 0.18 },
      { id: 'rcp-10', productId: 'prd-03', ingredientId: 'ing-01', quantityRequired: 0.10 },
      { id: 'rcp-11', productId: 'prd-03', ingredientId: 'ing-04', quantityRequired: 0.04 },
      { id: 'rcp-12', productId: 'prd-03', ingredientId: 'ing-08', quantityRequired: 1 },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup-01',
        businessId: bizId,
        name: 'CV Unggas Sejahtera',
        contactPerson: 'Pak Hendro',
        phone: '081122334455',
        address: 'Pasar Giwangan Blok B-12',
        notes: 'Pemasok ayam broiler segar setiap pagi pukul 06.00',
        createdAt: now,
      },
      {
        id: 'sup-02',
        businessId: bizId,
        name: 'Kopi Sangrai Mataram',
        contactPerson: 'Mbak Dini',
        phone: '081233445566',
        address: 'Jl. Kaliurang KM 8.5',
        notes: 'Beans fresh roast blend arabika-robusta 70:30',
        createdAt: now,
      },
    ];

    const expenses: Expense[] = [
      { id: 'exp-01', businessId: bizId, category: 'utilities', title: 'Tagihan Listrik PLN & Air PDAM', amount: 850000, expenseDate: new Date(Date.now() - 86400000 * 2).toISOString(), notes: 'Bulan berjalan', createdBy: 'Budi Santoso', createdAt: now },
      { id: 'exp-02', businessId: bizId, category: 'operational', title: 'Gas LPG 3kg & Minyak Kebersihan', amount: 220000, expenseDate: new Date(Date.now() - 86400000).toISOString(), notes: 'Tabung gas cadangan dapur', createdBy: 'Budi Santoso', createdAt: now },
      { id: 'exp-03', businessId: bizId, category: 'salary', title: 'Uang Makan & Transport Karyawan Mingguan', amount: 600000, expenseDate: now, notes: 'Uang saku operasional', createdBy: 'Budi Santoso', createdAt: now },
    ];

    const cashSession: CashSession = {
      id: 'csh-sess-001',
      businessId: bizId,
      cashierId: cashierId,
      cashierName: 'Siti Rahmawati',
      openedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      initialCash: 200000,
      expectedCash: 200000,
      status: 'open',
      notes: 'Sesi Kasir Shift Pagi - Modal Awal Kembalian Rp 200.000',
    };

    // Initial audit logs
    const auditLogs: AuditLog[] = [
      {
        id: uuidv4(),
        businessId: bizId,
        userId: ownerId,
        userName: 'Budi Santoso',
        action: 'SETUP_BUSINESS',
        details: 'Membuat profil usaha Warung Rasa Nusantara dan konfigurasi awal',
        createdAt: now,
      },
      {
        id: uuidv4(),
        businessId: bizId,
        userId: cashierId,
        userName: 'Siti Rahmawati',
        action: 'OPEN_CASH_DRAWER',
        details: 'Membuka shift kasir dengan uang modal Rp 200.000',
        createdAt: cashSession.openedAt,
      },
    ];

    this.data = {
      businesses: [business],
      users,
      categories,
      products,
      productVariants,
      ingredients,
      recipes,
      inventoryMovements: [],
      suppliers,
      purchases: [],
      sales: [],
      expenses,
      cashSessions: [cashSession],
      cashMovements: [],
      auditLogs,
    };

    // Seed 4 realistic past transactions so reporting works out of the box
    this.seedRealisticTransactions(bizId, cashierId, 'Siti Rahmawati');
  }

  private seedRealisticTransactions(bizId: string, cashierId: string, cashierName: string) {
    const d1 = new Date(Date.now() - 7200000).toISOString();
    const d2 = new Date(Date.now() - 3600000).toISOString();
    const d3 = new Date(Date.now() - 1800000).toISOString();

    const sale1: Sale = {
      id: 'sl-001',
      businessId: bizId,
      invoiceNumber: 'INV-20261024-001',
      orderType: 'dine_in',
      tableNumber: 'Meja 04',
      customerName: 'Mas Danang',
      subtotal: 68000,
      discountAmount: 0,
      taxAmount: 6800,
      serviceFeeAmount: 0,
      finalAmount: 74800,
      totalCostHPP: 30200,
      grossProfit: 37800,
      paymentMethod: 'cash',
      amountPaid: 80000,
      changeAmount: 5200,
      status: 'completed',
      cashierId,
      cashierName,
      notes: 'Sambal tidak terlalu berminyak',
      idempotencyKey: 'idem-seed-1',
      createdAt: d1,
      items: [
        {
          id: uuidv4(),
          saleId: 'sl-001',
          productId: 'prd-01',
          productName: 'Ayam Geprek Sambal Korek',
          variantName: 'Level 3 (Pedas Nampol)',
          quantity: 2,
          unitPrice: 26000,
          unitCost: 11500,
          subtotal: 52000,
          costSubtotal: 23000,
        },
        {
          id: uuidv4(),
          saleId: 'sl-001',
          productId: 'prd-05',
          productName: 'Es Teh Manis Jasmine Segar',
          quantity: 2,
          unitPrice: 7000,
          unitCost: 2000,
          subtotal: 14000,
          costSubtotal: 4000,
        },
      ],
    };

    const sale2: Sale = {
      id: 'sl-002',
      businessId: bizId,
      invoiceNumber: 'INV-20261024-002',
      orderType: 'takeaway',
      customerName: 'Kak Melati',
      subtotal: 48000,
      discountAmount: 0,
      taxAmount: 4800,
      serviceFeeAmount: 0,
      finalAmount: 52800,
      totalCostHPP: 20700,
      grossProfit: 27300,
      paymentMethod: 'qris',
      amountPaid: 52800,
      changeAmount: 0,
      status: 'completed',
      cashierId,
      cashierName,
      notes: 'Bungkus terpisah',
      idempotencyKey: 'idem-seed-2',
      createdAt: d2,
      items: [
        {
          id: uuidv4(),
          saleId: 'sl-002',
          productId: 'prd-03',
          productName: 'Nasi Goreng Spesial Rempah',
          quantity: 1,
          unitPrice: 28000,
          unitCost: 13500,
          subtotal: 28000,
          costSubtotal: 13500,
        },
        {
          id: uuidv4(),
          saleId: 'sl-002',
          productId: 'prd-02',
          productName: 'Kopi Susu Gula Aren Spesial',
          variantName: 'Ukuran Regular (16oz)',
          quantity: 1,
          unitPrice: 20000,
          unitCost: 7200,
          subtotal: 20000,
          costSubtotal: 7200,
        },
      ],
    };

    const sale3: Sale = {
      id: 'sl-003',
      businessId: bizId,
      invoiceNumber: 'INV-20261024-003',
      orderType: 'delivery',
      customerName: 'Ibu Ratna',
      subtotal: 94000,
      discountAmount: 5000,
      taxAmount: 8900,
      serviceFeeAmount: 0,
      finalAmount: 97900,
      totalCostHPP: 38800,
      grossProfit: 50200,
      paymentMethod: 'transfer',
      amountPaid: 97900,
      changeAmount: 0,
      status: 'completed',
      cashierId,
      cashierName,
      notes: 'Kirim via kurir internal',
      idempotencyKey: 'idem-seed-3',
      createdAt: d3,
      items: [
        {
          id: uuidv4(),
          saleId: 'sl-003',
          productId: 'prd-04',
          productName: 'Mie Pedas Juara Level 3',
          quantity: 2,
          unitPrice: 22000,
          unitCost: 9800,
          subtotal: 44000,
          costSubtotal: 19600,
        },
        {
          id: uuidv4(),
          saleId: 'sl-003',
          productId: 'prd-02',
          productName: 'Kopi Susu Gula Aren Spesial',
          variantName: 'Ukuran Large (22oz)',
          quantity: 2,
          unitPrice: 25000,
          unitCost: 9600,
          subtotal: 50000,
          costSubtotal: 19200,
        },
      ],
    };

    this.data.sales = [sale1, sale2, sale3];

    // Update active cash session expected cash
    const openSession = this.data.cashSessions.find((s) => s.businessId === bizId && s.status === 'open');
    if (openSession) {
      openSession.expectedCash += sale1.finalAmount; // Only cash adds to register
    }
  }

  // --- ACCESSORS ---
  public getBusinesses() {
    return this.data.businesses;
  }
  public getUsers() {
    return this.data.users;
  }
  public getCategories(businessId: string) {
    return this.data.categories.filter((c) => c.businessId === businessId && c.isActive);
  }
  public getAllCategories(businessId: string) {
    return this.data.categories.filter((c) => c.businessId === businessId);
  }
  public getProducts(businessId: string) {
    return this.data.products.filter((p) => p.businessId === businessId);
  }
  public getProductVariants(productId?: string) {
    if (productId) {
      return this.data.productVariants.filter((v) => v.productId === productId);
    }
    return this.data.productVariants;
  }
  public getIngredients(businessId: string) {
    return this.data.ingredients.filter((i) => i.businessId === businessId);
  }
  public getRecipes(productId?: string) {
    if (productId) {
      return this.data.recipes.filter((r) => r.productId === productId);
    }
    return this.data.recipes;
  }
  public getInventoryMovements(businessId: string) {
    return this.data.inventoryMovements.filter((m) => m.businessId === businessId);
  }
  public getSuppliers(businessId: string) {
    return this.data.suppliers.filter((s) => s.businessId === businessId);
  }
  public getPurchases(businessId: string) {
    return this.data.purchases.filter((p) => p.businessId === businessId);
  }
  public getSales(businessId: string) {
    return this.data.sales.filter((s) => s.businessId === businessId);
  }
  public getExpenses(businessId: string) {
    return this.data.expenses.filter((e) => e.businessId === businessId);
  }
  public getCashSessions(businessId: string) {
    return this.data.cashSessions.filter((c) => c.businessId === businessId);
  }
  public getCashMovements(businessId: string) {
    return this.data.cashMovements.filter((c) => c.businessId === businessId);
  }
  public getAuditLogs(businessId: string) {
    return this.data.auditLogs.filter((a) => a.businessId === businessId);
  }

  // --- AUDIT LOGGING ---
  public logAudit(businessId: string, userId: string, userName: string, action: string, details: string) {
    const entry: AuditLog = {
      id: uuidv4(),
      businessId,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  // --- BUSINESS / TENANT CREATION ---
  public createTenant(ownerData: {
    businessName: string;
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }): { business: Business; user: User } {
    const bizId = `biz-${uuidv4().substring(0, 8)}`;
    const userId = `usr-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const business: Business = {
      id: bizId,
      name: ownerData.businessName,
      tagline: 'Usaha Kuliner Berkah & Maju',
      logoUrl: '',
      address: '',
      phone: ownerData.phone || '',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      taxRate: 0,
      serviceFeeRate: 0,
      receiptHeader: `${ownerData.businessName.toUpperCase()}\nSelamat Menikmati`,
      receiptFooter: 'Terima Kasih atas Kunjungan Anda!',
      minStockAlertDefault: 5,
      createdAt: now,
      updatedAt: now,
    };

    const user: User = {
      id: userId,
      businessId: bizId,
      username: ownerData.username.toLowerCase().trim(),
      passwordHash: ownerData.passwordHash,
      fullName: ownerData.fullName,
      email: ownerData.email.toLowerCase().trim(),
      phone: ownerData.phone || '',
      role: 'owner',
      isActive: true,
      temporaryPasswordChanged: true,
      createdAt: now,
      updatedAt: now,
    };

    // Default categories for new business
    const defaultCategories: ProductCategory[] = [
      { id: `cat-${uuidv4().substring(0, 6)}`, businessId: bizId, name: 'Makanan', icon: 'Utensils', sortOrder: 1, isActive: true },
      { id: `cat-${uuidv4().substring(0, 6)}`, businessId: bizId, name: 'Minuman', icon: 'Coffee', sortOrder: 2, isActive: true },
    ];

    this.data.businesses.push(business);
    this.data.users.push(user);
    this.data.categories.push(...defaultCategories);
    this.logAudit(bizId, userId, user.fullName, 'REGISTER_OWNER', `Pendaftaran usaha baru: ${business.name}`);
    this.save();

    return { business, user };
  }

  // --- CHECKOUT & TRANSACTION (IDEMPOTENT & INVENTORY AWARE) ---
  public processCheckout(params: {
    businessId: string;
    orderType: 'dine_in' | 'takeaway' | 'delivery';
    tableNumber?: string;
    customerName?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      notes?: string;
    }>;
    discountAmount: number;
    paymentMethod: 'cash' | 'transfer' | 'qris' | 'other';
    amountPaid: number;
    cashierId: string;
    cashierName: string;
    notes?: string;
    idempotencyKey?: string;
  }): { sale: Sale; invoiceNumber: string } {
    const { businessId, items, idempotencyKey, cashierId, cashierName } = params;

    // Check idempotency
    if (idempotencyKey) {
      const existing = this.data.sales.find(
        (s) => s.businessId === businessId && s.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return { sale: existing, invoiceNumber: existing.invoiceNumber };
      }
    }

    const business = this.data.businesses.find((b) => b.id === businessId);
    if (!business) {
      throw new Error('Usaha tidak ditemukan.');
    }

    // Generate invoice number: INV-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todaysSalesCount = this.data.sales.filter(
      (s) => s.businessId === businessId && s.createdAt.startsWith(new Date().toISOString().slice(0, 10))
    ).length;
    const invoiceNumber = `INV-${todayStr}-${String(todaysSalesCount + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let totalHPP = 0;
    const saleId = uuidv4();
    const now = new Date().toISOString();
    const processedSaleItems = [];

    // Process each item and apply inventory reduction
    for (const item of items) {
      const product = this.data.products.find((p) => p.id === item.productId && p.businessId === businessId);
      if (!product) {
        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      }

      let unitPrice = product.price;
      let variantName: string | undefined = undefined;

      if (item.variantId) {
        const variant = this.data.productVariants.find((v) => v.id === item.variantId && v.productId === product.id);
        if (variant) {
          unitPrice += variant.priceAdjustment;
          variantName = variant.name;
        }
      }

      const itemSubtotal = unitPrice * item.quantity;
      let itemHPP = product.cost * item.quantity;

      // Handle stock decrement
      if (product.inventoryMode === 'product') {
        const prevStock = product.currentStock;
        product.currentStock -= item.quantity;
        product.updatedAt = now;

        const movement: InventoryMovement = {
          id: uuidv4(),
          businessId,
          itemType: 'product',
          itemId: product.id,
          itemName: product.name,
          movementType: 'sale',
          quantity: -item.quantity,
          previousStock: prevStock,
          newStock: product.currentStock,
          unitCost: product.cost,
          totalCost: product.cost * item.quantity,
          referenceId: invoiceNumber,
          notes: `Penjualan POS #${invoiceNumber}`,
          createdBy: cashierName,
          createdAt: now,
        };
        this.data.inventoryMovements.unshift(movement);
      } else if (product.inventoryMode === 'recipe') {
        // Find BOM recipe ingredients
        const productRecipes = this.data.recipes.filter((r) => r.productId === product.id);
        let calculatedRecipeHPP = 0;

        for (const rcp of productRecipes) {
          const ingredient = this.data.ingredients.find((ing) => ing.id === rcp.ingredientId && ing.businessId === businessId);
          if (ingredient) {
            const consumedQty = rcp.quantityRequired * item.quantity;
            const prevStock = ingredient.currentStock;
            ingredient.currentStock = Math.round((ingredient.currentStock - consumedQty) * 1000) / 1000;
            ingredient.updatedAt = now;

            const costImpact = ingredient.avgCost * consumedQty;
            calculatedRecipeHPP += costImpact;

            const movement: InventoryMovement = {
              id: uuidv4(),
              businessId,
              itemType: 'ingredient',
              itemId: ingredient.id,
              itemName: `${ingredient.name} (Resep: ${product.name})`,
              movementType: 'recipe_consumption',
              quantity: -consumedQty,
              previousStock: prevStock,
              newStock: ingredient.currentStock,
              unitCost: ingredient.avgCost,
              totalCost: costImpact,
              referenceId: invoiceNumber,
              notes: `Pemakaian bahan resep #${invoiceNumber}`,
              createdBy: cashierName,
              createdAt: now,
            };
            this.data.inventoryMovements.unshift(movement);
          }
        }
        if (calculatedRecipeHPP > 0) {
          itemHPP = calculatedRecipeHPP;
        }
      }

      subtotal += itemSubtotal;
      totalHPP += itemHPP;

      processedSaleItems.push({
        id: uuidv4(),
        saleId,
        productId: product.id,
        productName: product.name,
        variantName,
        quantity: item.quantity,
        unitPrice,
        unitCost: product.cost,
        subtotal: itemSubtotal,
        costSubtotal: itemHPP,
        notes: item.notes,
      });
    }

    const discountAmount = Math.max(0, Math.min(params.discountAmount || 0, subtotal));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * (business.taxRate || 0)) / 100);
    const serviceFeeAmount = Math.round((taxableAmount * (business.serviceFeeRate || 0)) / 100);
    const finalAmount = taxableAmount + taxAmount + serviceFeeAmount;
    const changeAmount = params.paymentMethod === 'cash' ? Math.max(0, params.amountPaid - finalAmount) : 0;
    const grossProfit = taxableAmount - totalHPP;

    const sale: Sale = {
      id: saleId,
      businessId,
      invoiceNumber,
      orderType: params.orderType,
      tableNumber: params.tableNumber,
      customerName: params.customerName || 'Pelanggan',
      subtotal,
      discountAmount,
      taxAmount,
      serviceFeeAmount,
      finalAmount,
      totalCostHPP: totalHPP,
      grossProfit,
      paymentMethod: params.paymentMethod,
      amountPaid: params.paymentMethod === 'cash' ? params.amountPaid : finalAmount,
      changeAmount,
      status: 'completed',
      cashierId,
      cashierName,
      notes: params.notes,
      idempotencyKey,
      createdAt: now,
      items: processedSaleItems,
    };

    this.data.sales.unshift(sale);

    // If payment is cash, update expected cash in open cash session
    if (params.paymentMethod === 'cash') {
      const activeSession = this.data.cashSessions.find(
        (s) => s.businessId === businessId && s.status === 'open'
      );
      if (activeSession) {
        activeSession.expectedCash += finalAmount;
      }
    }

    this.logAudit(
      businessId,
      cashierId,
      cashierName,
      'CHECKOUT_POS',
      `Transaksi selesai: ${invoiceNumber} - Total: Rp ${finalAmount.toLocaleString('id-ID')} (${params.paymentMethod.toUpperCase()})`
    );

    this.save();
    return { sale, invoiceNumber };
  }

  // --- REFUND TRANSACTION ---
  public refundSale(saleId: string, businessId: string, userId: string, userName: string, reason: string, restoreStock: boolean = true) {
    const sale = this.data.sales.find((s) => s.id === saleId && s.businessId === businessId);
    if (!sale) throw new Error('Transaksi tidak ditemukan.');
    if (sale.status === 'refunded') throw new Error('Transaksi ini sudah pernah dibatalkan/direfund.');

    const now = new Date().toISOString();
    sale.status = 'refunded';
    sale.refundReason = reason;
    sale.refundedAt = now;
    sale.refundedBy = userName;

    if (restoreStock) {
      for (const item of sale.items) {
        const product = this.data.products.find((p) => p.id === item.productId && p.businessId === businessId);
        if (product && product.inventoryMode === 'product') {
          const prev = product.currentStock;
          product.currentStock += item.quantity;
          product.updatedAt = now;

          this.data.inventoryMovements.unshift({
            id: uuidv4(),
            businessId,
            itemType: 'product',
            itemId: product.id,
            itemName: product.name,
            movementType: 'in',
            quantity: item.quantity,
            previousStock: prev,
            newStock: product.currentStock,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.quantity,
            referenceId: sale.invoiceNumber,
            notes: `Pengembalian stok dari refund #${sale.invoiceNumber}`,
            createdBy: userName,
            createdAt: now,
          });
        }
      }
    }

    // Deduct cash drawer if was cash
    if (sale.paymentMethod === 'cash') {
      const activeSession = this.data.cashSessions.find((s) => s.businessId === businessId && s.status === 'open');
      if (activeSession) {
        activeSession.expectedCash = Math.max(0, activeSession.expectedCash - sale.finalAmount);
      }
    }

    this.logAudit(businessId, userId, userName, 'REFUND_TRANSACTION', `Refund invoice ${sale.invoiceNumber}: ${reason}`);
    this.save();
    return sale;
  }

  // --- INVENTORY ADJUSTMENT / PURCHASE ---
  public addStockMovement(params: {
    businessId: string;
    itemType: 'product' | 'ingredient';
    itemId: string;
    movementType: 'in' | 'out' | 'spoilage' | 'adjustment';
    quantity: number;
    unitCost?: number;
    notes?: string;
    userName: string;
    userId: string;
  }) {
    const { businessId, itemType, itemId, movementType, quantity, userName, userId, notes } = params;
    const now = new Date().toISOString();

    let itemName = '';
    let prevStock = 0;
    let newStock = 0;
    let unitCost = params.unitCost || 0;

    if (itemType === 'product') {
      const prd = this.data.products.find((p) => p.id === itemId && p.businessId === businessId);
      if (!prd) throw new Error('Produk tidak ditemukan');
      itemName = prd.name;
      prevStock = prd.currentStock;
      unitCost = unitCost || prd.cost;

      if (movementType === 'in') {
        newStock = prevStock + quantity;
      } else {
        newStock = Math.max(0, prevStock - quantity);
      }
      prd.currentStock = newStock;
      prd.updatedAt = now;
    } else {
      const ing = this.data.ingredients.find((i) => i.id === itemId && i.businessId === businessId);
      if (!ing) throw new Error('Bahan baku tidak ditemukan');
      itemName = ing.name;
      prevStock = ing.currentStock;
      unitCost = unitCost || ing.avgCost;

      if (movementType === 'in') {
        newStock = Math.round((prevStock + quantity) * 1000) / 1000;
      } else {
        newStock = Math.max(0, Math.round((prevStock - quantity) * 1000) / 1000);
      }
      ing.currentStock = newStock;
      ing.updatedAt = now;
    }

    const actualQtyChange = movementType === 'in' ? quantity : -quantity;
    const movement: InventoryMovement = {
      id: uuidv4(),
      businessId,
      itemType,
      itemId,
      itemName,
      movementType,
      quantity: actualQtyChange,
      previousStock: prevStock,
      newStock,
      unitCost,
      totalCost: unitCost * quantity,
      notes: notes || `Penyesuaian manual stok (${movementType})`,
      createdBy: userName,
      createdAt: now,
    };

    this.data.inventoryMovements.unshift(movement);
    this.logAudit(
      businessId,
      userId,
      userName,
      'STOCK_MUTATION',
      `Mutasi stok ${itemName}: ${prevStock} -> ${newStock} (${movementType})`
    );
    this.save();
    return movement;
  }

  // --- PURCHASE ORDER FROM SUPPLIER ---
  public createPurchase(params: {
    businessId: string;
    supplierId: string;
    invoiceNumber: string;
    purchaseDate: string;
    notes?: string;
    userName: string;
    userId: string;
    items: Array<{
      itemType: 'product' | 'ingredient';
      itemId: string;
      quantity: number;
      unitCost: number;
    }>;
  }) {
    const { businessId, supplierId, invoiceNumber, purchaseDate, notes, userName, userId, items } = params;
    const supplier = this.data.suppliers.find((s) => s.id === supplierId && s.businessId === businessId);
    if (!supplier) throw new Error('Pemasok / Supplier tidak ditemukan');

    const purchaseId = uuidv4();
    const now = new Date().toISOString();
    let totalAmount = 0;
    const purchaseItems = [];

    for (const itm of items) {
      let itemName = '';
      if (itm.itemType === 'product') {
        const p = this.data.products.find((prod) => prod.id === itm.itemId && prod.businessId === businessId);
        if (!p) continue;
        itemName = p.name;
        const prev = p.currentStock;
        p.currentStock += itm.quantity;
        p.cost = itm.unitCost; // update last cost
        p.updatedAt = now;

        this.data.inventoryMovements.unshift({
          id: uuidv4(),
          businessId,
          itemType: 'product',
          itemId: p.id,
          itemName: p.name,
          movementType: 'purchase',
          quantity: itm.quantity,
          previousStock: prev,
          newStock: p.currentStock,
          unitCost: itm.unitCost,
          totalCost: itm.unitCost * itm.quantity,
          referenceId: invoiceNumber,
          notes: `Pembelian supplier: ${supplier.name}`,
          createdBy: userName,
          createdAt: now,
        });
      } else {
        const ing = this.data.ingredients.find((i) => i.id === itm.itemId && i.businessId === businessId);
        if (!ing) continue;
        itemName = ing.name;
        const prev = ing.currentStock;
        ing.currentStock = Math.round((ing.currentStock + itm.quantity) * 1000) / 1000;
        ing.avgCost = itm.unitCost;
        ing.updatedAt = now;

        this.data.inventoryMovements.unshift({
          id: uuidv4(),
          businessId,
          itemType: 'ingredient',
          itemId: ing.id,
          itemName: ing.name,
          movementType: 'purchase',
          quantity: itm.quantity,
          previousStock: prev,
          newStock: ing.currentStock,
          unitCost: itm.unitCost,
          totalCost: itm.unitCost * itm.quantity,
          referenceId: invoiceNumber,
          notes: `Pembelian bahan: ${supplier.name}`,
          createdBy: userName,
          createdAt: now,
        });
      }

      const itemTotal = itm.unitCost * itm.quantity;
      totalAmount += itemTotal;
      purchaseItems.push({
        id: uuidv4(),
        purchaseId,
        itemType: itm.itemType,
        itemId: itm.itemId,
        itemName,
        quantity: itm.quantity,
        unitCost: itm.unitCost,
        totalCost: itemTotal,
      });
    }

    const purchase: Purchase = {
      id: purchaseId,
      businessId,
      supplierId,
      supplierName: supplier.name,
      invoiceNumber,
      purchaseDate: purchaseDate || now,
      totalAmount,
      paymentStatus: 'paid',
      notes,
      createdBy: userName,
      createdAt: now,
      items: purchaseItems,
    };

    this.data.purchases.unshift(purchase);
    this.logAudit(
      businessId,
      userId,
      userName,
      'CREATE_PURCHASE',
      `Pembelian dari ${supplier.name} (#${invoiceNumber}) Total: Rp ${totalAmount.toLocaleString('id-ID')}`
    );
    this.save();
    return purchase;
  }

  // --- BACKUP & RESTORE ---
  public exportBusinessBackup(businessId: string) {
    return {
      backupTimestamp: new Date().toISOString(),
      business: this.data.businesses.find((b) => b.id === businessId),
      users: this.data.users.filter((u) => u.businessId === businessId).map(({ passwordHash, ...u }) => u),
      categories: this.data.categories.filter((c) => c.businessId === businessId),
      products: this.data.products.filter((p) => p.businessId === businessId),
      productVariants: this.data.productVariants.filter((v) =>
        this.data.products.some((p) => p.id === v.productId && p.businessId === businessId)
      ),
      ingredients: this.data.ingredients.filter((i) => i.businessId === businessId),
      recipes: this.data.recipes.filter((r) =>
        this.data.products.some((p) => p.id === r.productId && p.businessId === businessId)
      ),
      suppliers: this.data.suppliers.filter((s) => s.businessId === businessId),
      purchases: this.data.purchases.filter((p) => p.businessId === businessId),
      sales: this.data.sales.filter((s) => s.businessId === businessId),
      expenses: this.data.expenses.filter((e) => e.businessId === businessId),
      cashSessions: this.data.cashSessions.filter((c) => c.businessId === businessId),
      auditLogs: this.data.auditLogs.filter((a) => a.businessId === businessId),
    };
  }

  public getRawData() {
    return this.data;
  }
}

export const db = new DatabaseService();
