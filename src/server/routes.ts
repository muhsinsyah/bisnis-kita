import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.ts';
import {
  generateToken,
  requireAuth,
  requireRole,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  AuthenticatedRequest,
} from './auth.ts';
import { ExpenseCategory, InventoryMode, OrderType, PaymentMethod, UserRole } from '../types/index.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILES
// ==========================================

// Owner Registration (Multi-Tenant Setup)
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { businessName, fullName, username, email, phone, password, confirmPassword } = req.body;

    if (!businessName || !fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'Semua kolom bertanda bintang wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password tidak cocok.' });
    }

    // Check if username is already taken
    const existingUser = db.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh pengguna lain. Silakan pilih username lain.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const { business, user } = db.createTenant({
      businessName: businessName.trim(),
      fullName: fullName.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      passwordHash,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Pendaftaran usaha dan akun owner berhasil!',
      token,
      user: {
        id: user.id,
        businessId: user.businessId,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        temporaryPasswordChanged: user.temporaryPasswordChanged,
      },
      business,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server saat pendaftaran.' });
  }
});

// Login (Multi-Role: Owner & Staff)
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || 'ip';
    const rateLimitKey = `${clientIp}_${username}`;

    const limit = checkLoginRateLimit(rateLimitKey);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Terlalu banyak percobaan login gagal. Silakan tunggu ${limit.remainingSeconds} detik sebelum mencoba lagi.`,
      });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const user = db.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
      recordFailedLogin(rateLimitKey);
      return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh pemilik usaha.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(rateLimitKey);
      return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
    }

    resetLoginAttempts(rateLimitKey);

    const business = db.getBusinesses().find((b) => b.id === user.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Profil usaha tidak ditemukan.' });
    }

    db.logAudit(user.businessId, user.id, user.fullName, 'LOGIN', `Pengguna login sebagai ${user.role.toUpperCase()}`);

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        businessId: user.businessId,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        temporaryPasswordChanged: user.temporaryPasswordChanged,
      },
      business,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal melakukan login.' });
  }
});

// Current User Profile & Business Information
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const business = db.getBusinesses().find((b) => b.id === user.businessId);
  return res.json({
    user: {
      id: user.id,
      businessId: user.businessId,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      temporaryPasswordChanged: user.temporaryPasswordChanged,
    },
    business,
  });
});

// Change Password (Mandatory on first employee login or voluntary)
apiRouter.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok.' });
  }

  // If user has not changed temporary password, allow without currentPassword check or verify current
  if (user.temporaryPasswordChanged && currentPassword) {
    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama Anda tidak tepat.' });
    }
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.temporaryPasswordChanged = true;
  user.updatedAt = new Date().toISOString();

  db.logAudit(user.businessId, user.id, user.fullName, 'CHANGE_PASSWORD', 'Pengguna berhasil mengubah password.');
  db.save();

  return res.json({ message: 'Password berhasil diperbarui.' });
});

// Forgot Password Recovery Simulation
apiRouter.post('/auth/forgot-password-request', (req, res) => {
  const { usernameOrEmail } = req.body;
  if (!usernameOrEmail) {
    return res.status(400).json({ error: 'Harap masukkan username atau email terdaftar.' });
  }

  const user = db.getUsers().find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail.toLowerCase().trim() ||
      u.email.toLowerCase() === usernameOrEmail.toLowerCase().trim()
  );

  if (!user) {
    // Prevent email enumeration
    return res.json({
      message: 'Instruksi reset password telah dikirim jika akun tersebut terdaftar.',
    });
  }

  // For demonstration and recovery
  return res.json({
    message: `Instruksi pemulihan telah disiapkan untuk akun ${user.username} (${user.email}).`,
    hint: user.role === 'owner'
      ? 'Silakan hubungi dukungan sistem atau gunakan akun cadangan pemilik.'
      : 'Akun karyawan dapat di-reset langsung oleh Pemilik Usaha melalui menu Pengaturan Staff.',
  });
});

// ==========================================
// 2. BUSINESS PROFILE & SETTINGS
// ==========================================

apiRouter.get('/business', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const business = db.getBusinesses().find((b) => b.id === req.user!.businessId);
  return res.json(business);
});

apiRouter.put('/business', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const business = db.getBusinesses().find((b) => b.id === req.user!.businessId);
  if (!business) return res.status(404).json({ error: 'Usaha tidak ditemukan.' });

  const {
    name,
    tagline,
    logoUrl,
    address,
    phone,
    currency,
    timezone,
    taxRate,
    serviceFeeRate,
    receiptHeader,
    receiptFooter,
    minStockAlertDefault,
  } = req.body;

  if (name) business.name = name.trim();
  if (tagline !== undefined) business.tagline = tagline.trim();
  if (logoUrl !== undefined) business.logoUrl = logoUrl;
  if (address !== undefined) business.address = address.trim();
  if (phone !== undefined) business.phone = phone.trim();
  if (currency !== undefined) business.currency = currency.trim();
  if (timezone !== undefined) business.timezone = timezone.trim();
  if (taxRate !== undefined) business.taxRate = Number(taxRate) || 0;
  if (serviceFeeRate !== undefined) business.serviceFeeRate = Number(serviceFeeRate) || 0;
  if (receiptHeader !== undefined) business.receiptHeader = receiptHeader;
  if (receiptFooter !== undefined) business.receiptFooter = receiptFooter;
  if (minStockAlertDefault !== undefined) business.minStockAlertDefault = Number(minStockAlertDefault) || 5;
  business.updatedAt = new Date().toISOString();

  db.logAudit(business.id, req.user!.id, req.user!.fullName, 'UPDATE_SETTINGS', 'Memperbarui profil dan pengaturan usaha');
  db.save();

  return res.json({ message: 'Pengaturan usaha berhasil disimpan.', business });
});

// ==========================================
// 3. CATEGORIES & PRODUCTS
// ==========================================

apiRouter.get('/categories', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const categories = db.getAllCategories(req.user!.businessId);
  return res.json(categories);
});

apiRouter.post('/categories', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const { name, icon, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });

  const newCat = {
    id: `cat-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    name: name.trim(),
    icon: icon || 'Utensils',
    sortOrder: Number(sortOrder) || 1,
    isActive: true,
  };

  db.getRawData().categories.push(newCat);
  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'CREATE_CATEGORY', `Menambahkan kategori: ${name}`);
  db.save();
  return res.status(201).json(newCat);
});

apiRouter.put('/categories/:id', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const cat = db.getRawData().categories.find((c) => c.id === req.params.id && c.businessId === req.user!.businessId);
  if (!cat) return res.status(404).json({ error: 'Kategori tidak ditemukan.' });

  const { name, icon, sortOrder, isActive } = req.body;
  if (name) cat.name = name.trim();
  if (icon !== undefined) cat.icon = icon;
  if (sortOrder !== undefined) cat.sortOrder = Number(sortOrder);
  if (isActive !== undefined) cat.isActive = Boolean(isActive);

  db.save();
  return res.json(cat);
});

apiRouter.delete('/categories/:id', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const index = db.getRawData().categories.findIndex((c) => c.id === req.params.id && c.businessId === req.user!.businessId);
  if (index === -1) return res.status(404).json({ error: 'Kategori tidak ditemukan.' });

  const removed = db.getRawData().categories.splice(index, 1);
  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'DELETE_CATEGORY', `Menghapus kategori: ${removed[0].name}`);
  db.save();
  return res.json({ message: 'Kategori berhasil dihapus.' });
});

apiRouter.get('/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts(req.user!.businessId);
  const variants = db.getProductVariants();

  const productsWithVariants = products.map((p) => {
    return {
      ...p,
      variants: variants.filter((v) => v.productId === p.id),
    };
  });

  return res.json(productsWithVariants);
});

apiRouter.post('/products', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    categoryId,
    sku,
    description,
    imageUrl,
    price,
    cost,
    unit,
    inventoryMode,
    currentStock,
    minStock,
    variants,
  } = req.body;

  if (!name || price === undefined || cost === undefined) {
    return res.status(400).json({ error: 'Nama produk, harga jual, dan modal wajib diisi.' });
  }

  const now = new Date().toISOString();
  const productId = `prd-${uuidv4().substring(0, 8)}`;

  const newProduct = {
    id: productId,
    businessId: req.user!.businessId,
    categoryId: categoryId || '',
    sku: sku ? sku.trim() : `PRD-${Date.now().toString().slice(-6)}`,
    name: name.trim(),
    description: description ? description.trim() : '',
    imageUrl: imageUrl || '',
    price: Number(price) || 0,
    cost: Number(cost) || 0,
    unit: unit ? unit.trim() : 'porsi',
    inventoryMode: (inventoryMode as InventoryMode) || 'product',
    currentStock: Number(currentStock) || 0,
    minStock: Number(minStock) || 5,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  db.getRawData().products.push(newProduct);

  // If variants provided
  if (Array.isArray(variants)) {
    for (const v of variants) {
      if (v.name) {
        db.getRawData().productVariants.push({
          id: `var-${uuidv4().substring(0, 8)}`,
          productId,
          name: v.name.trim(),
          priceAdjustment: Number(v.priceAdjustment) || 0,
          sku: v.sku,
        });
      }
    }
  }

  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'CREATE_PRODUCT', `Menambahkan menu: ${newProduct.name}`);
  db.save();

  return res.status(201).json({
    ...newProduct,
    variants: db.getProductVariants(productId),
  });
});

apiRouter.put('/products/:id', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const product = db.getRawData().products.find((p) => p.id === req.params.id && p.businessId === req.user!.businessId);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const {
    name,
    categoryId,
    sku,
    description,
    imageUrl,
    price,
    cost,
    unit,
    inventoryMode,
    currentStock,
    minStock,
    isActive,
    variants,
  } = req.body;

  if (name) product.name = name.trim();
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (sku !== undefined) product.sku = sku.trim();
  if (description !== undefined) product.description = description;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (price !== undefined) product.price = Number(price);
  if (cost !== undefined) product.cost = Number(cost);
  if (unit !== undefined) product.unit = unit.trim();
  if (inventoryMode !== undefined) product.inventoryMode = inventoryMode;
  if (currentStock !== undefined) product.currentStock = Number(currentStock);
  if (minStock !== undefined) product.minStock = Number(minStock);
  if (isActive !== undefined) product.isActive = Boolean(isActive);
  product.updatedAt = new Date().toISOString();

  // Replace variants if provided
  if (Array.isArray(variants)) {
    db.getRawData().productVariants = db.getRawData().productVariants.filter((v) => v.productId !== product.id);
    for (const v of variants) {
      if (v.name) {
        db.getRawData().productVariants.push({
          id: v.id || `var-${uuidv4().substring(0, 8)}`,
          productId: product.id,
          name: v.name.trim(),
          priceAdjustment: Number(v.priceAdjustment) || 0,
          sku: v.sku,
        });
      }
    }
  }

  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'UPDATE_PRODUCT', `Memperbarui menu: ${product.name}`);
  db.save();

  return res.json({
    ...product,
    variants: db.getProductVariants(product.id),
  });
});

apiRouter.delete('/products/:id', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const index = db.getRawData().products.findIndex((p) => p.id === req.params.id && p.businessId === req.user!.businessId);
  if (index === -1) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const removed = db.getRawData().products.splice(index, 1);
  db.getRawData().productVariants = db.getRawData().productVariants.filter((v) => v.productId !== req.params.id);
  db.getRawData().recipes = db.getRawData().recipes.filter((r) => r.productId !== req.params.id);

  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'DELETE_PRODUCT', `Menghapus menu: ${removed[0].name}`);
  db.save();
  return res.json({ message: 'Produk berhasil dihapus.' });
});

// ==========================================
// 4. INVENTORY, INGREDIENTS & RECIPES (BOM)
// ==========================================

apiRouter.get('/inventory/ingredients', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const ingredients = db.getIngredients(req.user!.businessId);
  return res.json(ingredients);
});

apiRouter.post('/inventory/ingredients', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, unit, currentStock, minStock, avgCost } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'Nama bahan baku dan satuan wajib diisi.' });

  const now = new Date().toISOString();
  const ingId = `ing-${uuidv4().substring(0, 8)}`;
  const newIng = {
    id: ingId,
    businessId: req.user!.businessId,
    sku: sku ? sku.trim() : `ING-${Date.now().toString().slice(-6)}`,
    name: name.trim(),
    unit: unit.trim(),
    currentStock: Number(currentStock) || 0,
    minStock: Number(minStock) || 5,
    avgCost: Number(avgCost) || 0,
    createdAt: now,
    updatedAt: now,
  };

  db.getRawData().ingredients.push(newIng);
  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'CREATE_INGREDIENT', `Menambah bahan baku: ${newIng.name}`);
  db.save();
  return res.status(201).json(newIng);
});

apiRouter.put('/inventory/ingredients/:id', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const ing = db.getRawData().ingredients.find((i) => i.id === req.params.id && i.businessId === req.user!.businessId);
  if (!ing) return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });

  const { name, sku, unit, currentStock, minStock, avgCost } = req.body;
  if (name) ing.name = name.trim();
  if (sku !== undefined) ing.sku = sku.trim();
  if (unit) ing.unit = unit.trim();
  if (currentStock !== undefined) ing.currentStock = Number(currentStock);
  if (minStock !== undefined) ing.minStock = Number(minStock);
  if (avgCost !== undefined) ing.avgCost = Number(avgCost);
  ing.updatedAt = new Date().toISOString();

  db.save();
  return res.json(ing);
});

apiRouter.delete('/inventory/ingredients/:id', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const index = db.getRawData().ingredients.findIndex((i) => i.id === req.params.id && i.businessId === req.user!.businessId);
  if (index === -1) return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });

  const removed = db.getRawData().ingredients.splice(index, 1);
  db.getRawData().recipes = db.getRawData().recipes.filter((r) => r.ingredientId !== req.params.id);

  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'DELETE_INGREDIENT', `Menghapus bahan: ${removed[0].name}`);
  db.save();
  return res.json({ message: 'Bahan baku berhasil dihapus.' });
});

// Recipe BOM
apiRouter.get('/inventory/recipes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const productId = req.query.productId as string | undefined;
  const recipes = db.getRecipes(productId);
  return res.json(recipes);
});

apiRouter.post('/inventory/recipes', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const { productId, recipeItems } = req.body;
  if (!productId || !Array.isArray(recipeItems)) {
    return res.status(400).json({ error: 'Data resep tidak valid.' });
  }

  // Clear existing recipe for this product
  db.getRawData().recipes = db.getRawData().recipes.filter((r) => r.productId !== productId);

  for (const item of recipeItems) {
    if (item.ingredientId && Number(item.quantityRequired) > 0) {
      db.getRawData().recipes.push({
        id: `rcp-${uuidv4().substring(0, 8)}`,
        productId,
        ingredientId: item.ingredientId,
        quantityRequired: Number(item.quantityRequired),
      });
    }
  }

  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'UPDATE_RECIPE_BOM', `Memperbarui formula resep untuk produk ${productId}`);
  db.save();
  return res.json({ message: 'Resep BOM berhasil disimpan.' });
});

// Stock Movements Ledger
apiRouter.get('/inventory/movements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const movements = db.getInventoryMovements(req.user!.businessId);
  return res.json(movements);
});

// Manual Stock Adjustment
apiRouter.post('/inventory/adjustments', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemType, itemId, movementType, quantity, unitCost, notes } = req.body;
    if (!itemType || !itemId || !movementType || !quantity) {
      return res.status(400).json({ error: 'Parameter mutasi stok tidak lengkap.' });
    }

    const movement = db.addStockMovement({
      businessId: req.user!.businessId,
      itemType,
      itemId,
      movementType,
      quantity: Number(quantity),
      unitCost: Number(unitCost) || 0,
      notes,
      userName: req.user!.fullName,
      userId: req.user!.id,
    });

    return res.status(201).json(movement);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Suppliers
apiRouter.get('/inventory/suppliers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSuppliers(req.user!.businessId));
});

apiRouter.post('/inventory/suppliers', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const { name, contactPerson, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama supplier wajib diisi.' });

  const newSupplier = {
    id: `sup-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    name: name.trim(),
    contactPerson: contactPerson ? contactPerson.trim() : '',
    phone: phone ? phone.trim() : '',
    address: address ? address.trim() : '',
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString(),
  };

  db.getRawData().suppliers.push(newSupplier);
  db.logAudit(req.user!.businessId, req.user!.id, req.user!.fullName, 'CREATE_SUPPLIER', `Menambah supplier: ${newSupplier.name}`);
  db.save();
  return res.status(201).json(newSupplier);
});

// Purchases
apiRouter.get('/inventory/purchases', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getPurchases(req.user!.businessId));
});

apiRouter.post('/inventory/purchases', requireAuth, requireRole('owner', 'inventory', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplierId, invoiceNumber, purchaseDate, notes, items } = req.body;
    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data pembelian supplier belum lengkap.' });
    }

    const purchase = db.createPurchase({
      businessId: req.user!.businessId,
      supplierId,
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : `PO-${Date.now().toString().slice(-6)}`,
      purchaseDate: purchaseDate || new Date().toISOString(),
      notes,
      userName: req.user!.fullName,
      userId: req.user!.id,
      items,
    });

    return res.status(201).json(purchase);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. POINT OF SALE (POS) & TRANSACTIONS
// ==========================================

apiRouter.post('/pos/checkout', requireAuth, requireRole('owner', 'cashier', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      orderType,
      tableNumber,
      customerName,
      items,
      discountAmount,
      paymentMethod,
      amountPaid,
      notes,
      idempotencyKey,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keranjang belanja masih kosong.' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Metode pembayaran wajib dipilih.' });
    }

    const result = db.processCheckout({
      businessId: req.user!.businessId,
      orderType: (orderType as OrderType) || 'dine_in',
      tableNumber,
      customerName,
      items,
      discountAmount: Number(discountAmount) || 0,
      paymentMethod: (paymentMethod as PaymentMethod) || 'cash',
      amountPaid: Number(amountPaid) || 0,
      cashierId: req.user!.id,
      cashierName: req.user!.fullName,
      notes,
      idempotencyKey,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/pos/sales', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  let sales = db.getSales(req.user!.businessId);

  const { search, startDate, endDate, status } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    sales = sales.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.tableNumber && s.tableNumber.toLowerCase().includes(q))
    );
  }

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => s.createdAt >= startDate);
  }

  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => s.createdAt <= endDate);
  }

  if (status && typeof status === 'string') {
    sales = sales.filter((s) => s.status === status);
  }

  return res.json(sales);
});

apiRouter.get('/pos/sales/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sale = db.getSales(req.user!.businessId).find((s) => s.id === req.params.id);
  if (!sale) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  return res.json(sale);
});

apiRouter.post('/pos/sales/:id/refund', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, restoreStock } = req.body;
    if (!reason) return res.status(400).json({ error: 'Alasan pembatalan/refund wajib dicatat.' });

    const refunded = db.refundSale(
      req.params.id,
      req.user!.businessId,
      req.user!.id,
      req.user!.fullName,
      reason,
      restoreStock !== false
    );

    return res.json({ message: 'Transaksi berhasil dibatalkan/direfund.', sale: refunded });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. CASH REGISTER SESSIONS
// ==========================================

apiRouter.get('/cash-sessions/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const current = db.getCashSessions(req.user!.businessId).find((s) => s.status === 'open');
  return res.json(current || null);
});

apiRouter.post('/cash-sessions/open', requireAuth, requireRole('owner', 'cashier', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getCashSessions(req.user!.businessId).find((s) => s.status === 'open');
  if (existing) {
    return res.status(400).json({ error: 'Sudah ada sesi kasir yang sedang aktif. Tutup sesi sebelumnya terlebih dahulu.' });
  }

  const { initialCash, notes } = req.body;
  const startCash = Number(initialCash) || 0;
  const now = new Date().toISOString();

  const newSession = {
    id: `csh-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    cashierId: req.user!.id,
    cashierName: req.user!.fullName,
    openedAt: now,
    initialCash: startCash,
    expectedCash: startCash,
    status: 'open' as const,
    notes: notes || 'Sesi kasir dibuka.',
  };

  db.getRawData().cashSessions.unshift(newSession);
  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'OPEN_CASH_DRAWER',
    `Membuka sesi kasir dengan modal awal Rp ${startCash.toLocaleString('id-ID')}`
  );
  db.save();

  return res.status(201).json(newSession);
});

apiRouter.post('/cash-sessions/close', requireAuth, requireRole('owner', 'cashier', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const session = db.getCashSessions(req.user!.businessId).find((s) => s.status === 'open');
  if (!session) {
    return res.status(400).json({ error: 'Tidak ada sesi kasir aktif yang dapat ditutup.' });
  }

  const { actualCash, notes } = req.body;
  const counted = Number(actualCash) || 0;
  const difference = counted - session.expectedCash;

  session.actualCash = counted;
  session.difference = difference;
  session.closedAt = new Date().toISOString();
  session.status = 'closed';
  if (notes) session.notes = `${session.notes || ''} | Catatan Penutupan: ${notes}`;

  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'CLOSE_CASH_DRAWER',
    `Menutup sesi kasir. Diharapkan: Rp ${session.expectedCash.toLocaleString('id-ID')}, Fisik: Rp ${counted.toLocaleString('id-ID')}, Selisih: Rp ${difference.toLocaleString('id-ID')}`
  );
  db.save();

  return res.json({ message: 'Sesi kasir berhasil ditutup.', session });
});

apiRouter.post('/cash-sessions/movement', requireAuth, requireRole('owner', 'cashier', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const session = db.getCashSessions(req.user!.businessId).find((s) => s.status === 'open');
  if (!session) {
    return res.status(400).json({ error: 'Tidak ada sesi kasir aktif untuk mutasi kas laci.' });
  }

  const { type, amount, reason } = req.body;
  const parsedAmount = Number(amount) || 0;
  if (!reason || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Alasan dan jumlah uang wajib diisi.' });
  }

  if (type === 'cash_out' && parsedAmount > session.expectedCash) {
    return res.status(400).json({ error: 'Jumlah penarikan kas melebihi saldo laci kasir saat ini.' });
  }

  const movement = {
    id: `cshmov-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    sessionId: session.id,
    type: type as 'cash_in' | 'cash_out',
    amount: parsedAmount,
    reason: reason.trim(),
    createdBy: req.user!.fullName,
    createdAt: new Date().toISOString(),
  };

  if (type === 'cash_in') {
    session.expectedCash += parsedAmount;
  } else {
    session.expectedCash -= parsedAmount;
  }

  db.getRawData().cashMovements.unshift(movement);
  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'CASH_DRAWER_MUTATION',
    `Kas ${type === 'cash_in' ? 'Masuk' : 'Keluar'} Rp ${parsedAmount.toLocaleString('id-ID')}: ${reason}`
  );
  db.save();

  return res.status(201).json({ movement, expectedCash: session.expectedCash });
});

// ==========================================
// 7. EXPENSES & FINANCIAL REPORTS
// ==========================================

apiRouter.get('/finances/expenses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const expenses = db.getExpenses(req.user!.businessId);
  return res.json(expenses);
});

apiRouter.post('/finances/expenses', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const { category, title, amount, expenseDate, notes } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'Judul dan nominal biaya pengeluaran wajib diisi.' });
  }

  const newExpense = {
    id: `exp-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    category: (category as ExpenseCategory) || 'operational',
    title: title.trim(),
    amount: Number(amount) || 0,
    expenseDate: expenseDate || new Date().toISOString(),
    notes: notes ? notes.trim() : '',
    createdBy: req.user!.fullName,
    createdAt: new Date().toISOString(),
  };

  db.getRawData().expenses.unshift(newExpense);
  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'RECORD_EXPENSE',
    `Mencatat biaya ${newExpense.category}: ${newExpense.title} - Rp ${newExpense.amount.toLocaleString('id-ID')}`
  );
  db.save();

  return res.status(201).json(newExpense);
});

apiRouter.delete('/finances/expenses/:id', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const index = db.getRawData().expenses.findIndex((e) => e.id === req.params.id && e.businessId === req.user!.businessId);
  if (index === -1) return res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });

  const removed = db.getRawData().expenses.splice(index, 1);
  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'DELETE_EXPENSE',
    `Menghapus biaya: ${removed[0].title} (Rp ${removed[0].amount.toLocaleString('id-ID')})`
  );
  db.save();

  return res.json({ message: 'Pengeluaran berhasil dihapus.' });
});

// Real Analytical Dashboard & P&L Calculation
apiRouter.get('/finances/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const bizId = req.user!.businessId;
  const sales = db.getSales(bizId).filter((s) => s.status === 'completed');
  const expenses = db.getExpenses(bizId);
  const products = db.getProducts(bizId);
  const ingredients = db.getIngredients(bizId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  // Sales Today
  const salesToday = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const omzetHariIni = salesToday.reduce((sum, s) => sum + s.finalAmount, 0);
  const hppHariIni = salesToday.reduce((sum, s) => sum + s.totalCostHPP, 0);
  const labaKotorHariIni = omzetHariIni - hppHariIni;
  const totalTransaksiHariIni = salesToday.length;

  // Sales Month
  const salesMonth = sales.filter((s) => s.createdAt.startsWith(currentMonthStr));
  const omzetBulanIni = salesMonth.reduce((sum, s) => sum + s.finalAmount, 0);
  const hppBulanIni = salesMonth.reduce((sum, s) => sum + s.totalCostHPP, 0);
  const labaKotorBulanIni = omzetBulanIni - hppBulanIni;

  // Expenses Month
  const expensesMonth = expenses.filter((e) => e.expenseDate.startsWith(currentMonthStr));
  const totalBiayaOperasionalBulanIni = expensesMonth.reduce((sum, e) => sum + e.amount, 0);

  // Net Profit
  const labaBersihBulanIni = labaKotorBulanIni - totalBiayaOperasionalBulanIni;
  const marginLabaBersihBulanIni = omzetBulanIni > 0 ? (labaBersihBulanIni / omzetBulanIni) * 100 : 0;
  const rataRataNilaiTransaksi = salesMonth.length > 0 ? Math.round(omzetBulanIni / salesMonth.length) : 0;

  // Best Selling Products calculation
  const productCountMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      if (!productCountMap[item.productId]) {
        productCountMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productCountMap[item.productId].quantity += item.quantity;
      productCountMap[item.productId].revenue += item.subtotal;
    }
  }

  const produkTerlaris = Object.values(productCountMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Low Stock Alerts (Products & Ingredients)
  const stokMenipis = [];
  for (const p of products) {
    if (p.inventoryMode === 'product' && p.currentStock <= p.minStock) {
      stokMenipis.push({
        id: p.id,
        name: p.name,
        type: 'product',
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: p.unit,
      });
    }
  }
  for (const ing of ingredients) {
    if (ing.currentStock <= ing.minStock) {
      stokMenipis.push({
        id: ing.id,
        name: ing.name,
        type: 'ingredient',
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        unit: ing.unit,
      });
    }
  }

  // Payment Method Breakdown
  const metodePembayaran: Record<string, number> = { cash: 0, transfer: 0, qris: 0, other: 0 };
  for (const s of salesMonth) {
    metodePembayaran[s.paymentMethod] = (metodePembayaran[s.paymentMethod] || 0) + s.finalAmount;
  }

  // 7-Day Trend Chart
  const trendHarian = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

    const daySales = sales.filter((s) => s.createdAt.startsWith(dateKey));
    const dayRevenue = daySales.reduce((acc, s) => acc + s.finalAmount, 0);
    const dayHPP = daySales.reduce((acc, s) => acc + s.totalCostHPP, 0);
    const dayExpenses = expenses.filter((e) => e.expenseDate.startsWith(dateKey)).reduce((acc, e) => acc + e.amount, 0);
    const dayGrossProfit = dayRevenue - dayHPP;
    const dayNetProfit = dayGrossProfit - dayExpenses;

    trendHarian.push({
      date: dateKey,
      label: dayLabel,
      omzet: dayRevenue,
      hpp: dayHPP,
      biaya: dayExpenses,
      labaKotor: dayGrossProfit,
      labaBersih: dayNetProfit,
      transaksi: daySales.length,
    });
  }

  return res.json({
    ringkasan: {
      omzetHariIni,
      hppHariIni,
      labaKotorHariIni,
      totalTransaksiHariIni,
      omzetBulanIni,
      hppBulanIni,
      labaKotorBulanIni,
      totalBiayaOperasionalBulanIni,
      labaBersihBulanIni,
      marginLabaBersihBulanIni: Number(marginLabaBersihBulanIni.toFixed(1)),
      rataRataNilaiTransaksi,
      totalTransaksiBulanIni: salesMonth.length,
    },
    produkTerlaris,
    stokMenipis,
    metodePembayaran,
    trendHarian,
  });
});

// ==========================================
// 8. STAFF & EMPLOYEE MANAGEMENT (OWNER ONLY)
// ==========================================

apiRouter.get('/staff', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const staff = db.getUsers().filter((u) => u.businessId === req.user!.businessId).map(({ passwordHash, ...u }) => u);
  return res.json(staff);
});

apiRouter.post('/staff', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const { username, fullName, email, phone, role, temporaryPassword } = req.body;

  if (!username || !fullName || !temporaryPassword || !role) {
    return res.status(400).json({ error: 'Username, nama lengkap, role, dan password sementara wajib diisi.' });
  }

  const existing = db.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Username sudah digunakan.' });
  }

  if (role === 'owner') {
    return res.status(400).json({ error: 'Tidak dapat membuat akun owner kedua melalui manajemen staf.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(temporaryPassword, salt);
  const now = new Date().toISOString();

  const newStaff = {
    id: `usr-${uuidv4().substring(0, 8)}`,
    businessId: req.user!.businessId,
    username: username.toLowerCase().trim(),
    passwordHash,
    fullName: fullName.trim(),
    email: email ? email.toLowerCase().trim() : `${username}@bisniskita.internal`,
    phone: phone ? phone.trim() : '',
    role: role as UserRole,
    isActive: true,
    temporaryPasswordChanged: false, // forces change password on first login
    createdAt: now,
    updatedAt: now,
  };

  db.getRawData().users.push(newStaff);
  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'CREATE_STAFF',
    `Membuat akun karyawan ${newStaff.fullName} (@${newStaff.username}) role: ${newStaff.role.toUpperCase()}`
  );
  db.save();

  const { passwordHash: _, ...safeUser } = newStaff;
  return res.status(201).json(safeUser);
});

apiRouter.put('/staff/:id', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const staff = db.getRawData().users.find((u) => u.id === req.params.id && u.businessId === req.user!.businessId);
  if (!staff) return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  if (staff.id === req.user!.id && req.body.isActive === false) {
    return res.status(400).json({ error: 'Pemilik tidak dapat menonaktifkan akun sendiri.' });
  }

  const { fullName, phone, role, isActive } = req.body;
  if (fullName) staff.fullName = fullName.trim();
  if (phone !== undefined) staff.phone = phone.trim();
  if (role && role !== 'owner') staff.role = role;
  if (isActive !== undefined) staff.isActive = Boolean(isActive);
  staff.updatedAt = new Date().toISOString();

  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'UPDATE_STAFF',
    `Memperbarui profil staf: ${staff.fullName} (Status: ${staff.isActive ? 'Aktif' : 'Non-aktif'})`
  );
  db.save();

  const { passwordHash: _, ...safeUser } = staff;
  return res.json(safeUser);
});

apiRouter.post('/staff/:id/reset-password', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const staff = db.getRawData().users.find((u) => u.id === req.params.id && u.businessId === req.user!.businessId);
  if (!staff) return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });

  const { newTemporaryPassword } = req.body;
  if (!newTemporaryPassword || newTemporaryPassword.length < 6) {
    return res.status(400).json({ error: 'Password sementara baru minimal 6 karakter.' });
  }

  const salt = bcrypt.genSaltSync(10);
  staff.passwordHash = bcrypt.hashSync(newTemporaryPassword, salt);
  staff.temporaryPasswordChanged = false; // user will be forced to change password
  staff.updatedAt = new Date().toISOString();

  db.logAudit(
    req.user!.businessId,
    req.user!.id,
    req.user!.fullName,
    'RESET_STAFF_PASSWORD',
    `Mereset password staf ${staff.fullName} (@${staff.username})`
  );
  db.save();

  return res.json({ message: 'Password sementara berhasil diatur ulang.' });
});

// ==========================================
// 9. AUDIT LOGS, BACKUP & RESTORE
// ==========================================

apiRouter.get('/audit-logs', requireAuth, requireRole('owner', 'supervisor'), (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs(req.user!.businessId);
  return res.json(logs);
});

apiRouter.get('/backup/export', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const backup = db.exportBusinessBackup(req.user!.businessId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup_${req.user!.businessId}_${Date.now()}.json"`);
  return res.json(backup);
});

apiRouter.post('/backup/restore', requireAuth, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = req.body;
    if (!backup || !backup.business || !Array.isArray(backup.products)) {
      return res.status(400).json({ error: 'Format berkas backup JSON tidak valid.' });
    }

    const bizId = req.user!.businessId;

    // Restore items matching this business ID
    const raw = db.getRawData();
    raw.categories = raw.categories.filter((c) => c.businessId !== bizId).concat(backup.categories || []);
    raw.products = raw.products.filter((p) => p.businessId !== bizId).concat(backup.products || []);
    raw.ingredients = raw.ingredients.filter((i) => i.businessId !== bizId).concat(backup.ingredients || []);
    raw.suppliers = raw.suppliers.filter((s) => s.businessId !== bizId).concat(backup.suppliers || []);
    raw.expenses = raw.expenses.filter((e) => e.businessId !== bizId).concat(backup.expenses || []);

    db.logAudit(bizId, req.user!.id, req.user!.fullName, 'RESTORE_BACKUP', 'Memulihkan data usaha dari berkas cadangan JSON');
    db.save();

    return res.json({ message: 'Data cadangan berhasil dipulihkan.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memulihkan backup.' });
  }
});
