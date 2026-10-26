export type UserRole = 'owner' | 'supervisor' | 'cashier' | 'inventory';

export type InventoryMode = 'product' | 'recipe'; // product = finished goods; recipe = bill of materials (BOM)

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'other';

export type MovementType = 'in' | 'out' | 'sale' | 'recipe_consumption' | 'spoilage' | 'adjustment' | 'purchase';

export type ExpenseCategory = 'operational' | 'salary' | 'rent' | 'utilities' | 'delivery' | 'maintenance' | 'other';

export interface Business {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  currency: string; // e.g. IDR
  timezone: string; // e.g. Asia/Jakarta
  taxRate: number; // in percentage, e.g. 10 for 10%
  serviceFeeRate: number; // in percentage, e.g. 5 for 5%
  receiptHeader?: string;
  receiptFooter?: string;
  minStockAlertDefault: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  businessId: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  temporaryPasswordChanged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  businessId: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "Pedas Level 1", "Ukuran Large"
  priceAdjustment: number; // +/- from base price
  sku?: string;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number; // Selling price in IDR
  cost: number; // HPP / Capital cost in IDR
  unit: string; // e.g. "porsi", "cup", "kotak"
  inventoryMode: InventoryMode;
  currentStock: number; // Used when inventoryMode === 'product'
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export interface Ingredient {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  unit: string; // e.g. "kg", "gram", "liter", "ml", "pcs"
  currentStock: number;
  minStock: number;
  avgCost: number; // Cost per unit in IDR
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItem {
  id: string;
  productId: string;
  variantId?: string | null;
  ingredientId: string;
  quantityRequired: number; // Amount of ingredient consumed per 1 product sale
}

export interface InventoryMovement {
  id: string;
  businessId: string;
  itemType: 'product' | 'ingredient';
  itemId: string;
  itemName: string;
  movementType: MovementType;
  quantity: number; // positive = added, negative = reduced
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceId?: string; // invoice number or purchase id
  notes?: string;
  createdBy: string; // user full name or username
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  itemType: 'product' | 'ingredient';
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  purchaseDate: string;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid';
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number; // Snapshot of HPP at time of sale
  subtotal: number;
  costSubtotal: number;
  notes?: string;
}

export interface Sale {
  id: string;
  businessId: string;
  invoiceNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceFeeAmount: number;
  finalAmount: number;
  totalCostHPP: number; // Total cost snapshot
  grossProfit: number; // finalAmount - totalCostHPP - tax/service adjustments
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: 'completed' | 'refunded' | 'cancelled';
  cashierId: string;
  cashierName: string;
  notes?: string;
  idempotencyKey?: string;
  createdAt: string;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  items: SaleItem[];
}

export interface Expense {
  id: string;
  businessId: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  businessId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  initialCash: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashMovement {
  id: string;
  businessId: string;
  sessionId: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  notes?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    businessId: string;
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    temporaryPasswordChanged: boolean;
  };
  business: Business;
}
