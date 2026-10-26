import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product, ProductCategory, ProductVariant, CartItem, Sale, OrderType, PaymentMethod } from '../../types/index.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Coffee,
  CheckCircle2,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  AlertCircle,
} from 'lucide-react';

export const PosModule: React.FC = () => {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout inputs
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Variant selector modal
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);

  // Completed transaction for receipt
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Mobile cart drawer state
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<ProductCategory[]>('/categories'),
      ]);
      setProducts(prodRes.filter((p) => p.isActive));
      setCategories(catRes.filter((c) => c.isActive));
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle adding product to cart
  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantModalProduct(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variant?.id === variant?.id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }

      return [...prev, { product, variant, quantity: 1 }];
    });
    setVariantModalProduct(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const target = prev[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const next = [...prev];
      next[index] = { ...target, quantity: newQty };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemNotes = (index: number, notes: string) => {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes };
      return next;
    });
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = item.product.price;
      const adj = item.variant?.priceAdjustment || 0;
      return sum + (base + adj) * item.quantity;
    }, 0);
  }, [cart]);

  const taxRate = business?.taxRate || 0;
  const serviceFeeRate = business?.serviceFeeRate || 0;

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((discountedSubtotal * taxRate) / 100);
  const serviceFeeAmount = Math.round((discountedSubtotal * serviceFeeRate) / 100);
  const finalTotal = discountedSubtotal + taxAmount + serviceFeeAmount;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, amountPaid - finalTotal) : 0;

  // Auto-set exact cash when total updates if amountPaid was exact
  useEffect(() => {
    if (paymentMethod === 'cash' && amountPaid < finalTotal) {
      setAmountPaid(finalTotal);
    }
  }, [finalTotal, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && amountPaid < finalTotal) {
      setErrorMessage('Nominal uang tunai yang diterima kurang dari total transaksi.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Generate unique idempotency key for this checkout attempt
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const checkoutPayload = {
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
        discountAmount,
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? amountPaid : finalTotal,
        notes: orderNotes,
        idempotencyKey,
      };

      const res = await api.post<{ sale: Sale; invoiceNumber: string }>('/pos/checkout', checkoutPayload);

      // Reset cart
      setCart([]);
      setDiscountAmount(0);
      setTableNumber('');
      setCustomerName('');
      setOrderNotes('');
      setShowMobileCart(false);

      // Trigger receipt modal
      setCompletedSale(res.sale);
      fetchData(); // refresh products / stocks
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
      {/* LEFT COLUMN: Product Catalog & Search (lg: flex-1) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari menu makanan atau minuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Functional category segmented buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Menu ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-slate-200/70 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Utensils className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-sm font-medium text-slate-600">Tidak ada menu yang sesuai</div>
              <div className="text-xs text-slate-400">Coba ubah kata kunci atau pilih kategori lain</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.inventoryMode === 'product' && product.currentStock <= 0;
                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => handleProductClick(product)}
                    className={`flex flex-col text-left bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-emerald-600/60 hover:shadow-md transition-all group ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
                    }`}
                  >
                    {/* Image with Styled Fallback */}
                    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2">
                          <Utensils className="w-6 h-6 text-slate-300 mb-1" />
                          <span className="text-[10px] text-slate-400 text-center font-medium line-clamp-1">
                            {product.name}
                          </span>
                        </div>
                      )}

                      {/* Stock status indicator */}
                      {product.inventoryMode === 'product' && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs rounded text-[10px] font-mono text-white tabular-nums">
                          Stok: {product.currentStock}
                        </div>
                      )}
                      {product.inventoryMode === 'recipe' && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-emerald-900/70 backdrop-blur-xs rounded text-[9px] font-sans text-white">
                          Resep Dapur
                        </div>
                      )}
                    </div>

                    {/* Product Meta */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900 leading-snug line-clamp-2">
                          {product.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          SKU: {product.sku}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-emerald-800 tabular-nums">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                            +{product.variants.length} Varian
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile floating view cart trigger */}
        <div className="lg:hidden p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-500">Total Keranjang:</span>{' '}
            <span className="font-bold text-slate-900 tabular-nums">
              Rp {finalTotal.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Lihat Pesanan ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Cart & Checkout Panel (lg: w-96 / w-104) */}
      <div
        className={`fixed lg:static inset-0 z-40 lg:z-auto bg-white flex flex-col w-full lg:w-96 xl:w-104 shrink-0 border-l border-slate-200 transition-transform duration-200 ${
          showMobileCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
        }`}
      >
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Pesanan ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[11px] text-rose-600 hover:underline font-medium"
            >
              Kosongkan
            </button>
          )}
          {/* Close mobile cart button */}
          <button
            onClick={() => setShowMobileCart(false)}
            className="lg:hidden p-1 text-slate-500 hover:bg-slate-200 rounded"
          >
            Tutup
          </button>
        </div>

        {/* Order Meta Inputs: Dine-in, Table, Customer */}
        <div className="p-3 bg-white border-b border-slate-100 space-y-2">
          {/* Order type segmented buttons */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-[11px]">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`py-1 rounded font-medium transition-colors ${
                orderType === 'dine_in' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500'
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`py-1 rounded font-medium transition-colors ${
                orderType === 'takeaway' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500'
              }`}
            >
              Takeaway
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`py-1 rounded font-medium transition-colors ${
                orderType === 'delivery' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500'
              }`}
            >
              Delivery
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {orderType === 'dine_in' ? (
              <input
                type="text"
                placeholder="No. Meja (contoh: Meja 03)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            ) : (
              <div className="text-[11px] text-slate-400 py-1.5">Pesanan Dibungkus</div>
            )}
            <input
              type="text"
              placeholder="Nama Pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-1">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-xs font-medium text-slate-500">Keranjang masih kosong</div>
              <div className="text-[11px] text-slate-400">Pilih menu di sebelah kiri untuk menambahkan</div>
            </div>
          ) : (
            cart.map((item, index) => {
              const unitPrice = item.product.price + (item.variant?.priceAdjustment || 0);
              return (
                <div key={index} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      {item.variant && (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {item.variant.name}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Rp {unitPrice.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 tabular-nums">
                      Rp {(unitPrice * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Quantity and Line Note */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <input
                      type="text"
                      placeholder="Catatan pesanan..."
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(index, e.target.value)}
                      className="px-2 py-1 text-[11px] border border-slate-200 rounded bg-white w-36 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 ml-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout & Payment Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {errorMessage && (
            <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>

            {/* Discount line with quick input */}
            <div className="flex items-center justify-between text-slate-600">
              <span>Diskon (Rp)</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 text-right px-2 py-0.5 border border-slate-200 rounded text-xs font-mono bg-white"
              />
            </div>

            {taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Pajak Resto ({taxRate}%)</span>
                <span className="font-mono tabular-nums">Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}

            {serviceFeeRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Biaya Layanan ({serviceFeeRate}%)</span>
                <span className="font-mono tabular-nums">Rp {serviceFeeAmount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
              <span>TOTAL BAYAR</span>
              <span className="font-mono tabular-nums text-emerald-800 text-base">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1 text-xs">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-1 py-1.5 border rounded-lg transition-colors ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Tunai</span>
            </button>
            <button
              onClick={() => setPaymentMethod('qris')}
              className={`flex items-center justify-center gap-1 py-1.5 border rounded-lg transition-colors ${
                paymentMethod === 'qris'
                  ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS</span>
            </button>
            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`flex items-center justify-center gap-1 py-1.5 border rounded-lg transition-colors ${
                paymentMethod === 'transfer'
                  ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Cash Payment Quick Tender & Kembalian */}
          {paymentMethod === 'cash' && (
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Uang Diterima:</span>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="w-28 text-right px-2 py-1 border border-slate-200 rounded font-mono text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Quick money buttons */}
              <div className="flex gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setAmountPaid(finalTotal)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaid(50000)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono tabular-nums"
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaid(100000)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono tabular-nums"
                >
                  100.000
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">Kembalian:</span>
                <span className="font-bold font-mono text-emerald-700 tabular-nums">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Checkout Process Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>Memproses Transaksi...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Bayar Sekarang (Rp {finalTotal.toLocaleString('id-ID')})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Variant Selection Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{variantModalProduct.name}</h3>
              <p className="text-xs text-slate-500">Pilih varian atau tingkat kepedasan/ukuran:</p>
            </div>

            <div className="space-y-2">
              {variantModalProduct.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addToCart(variantModalProduct, v)}
                  className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-900">{v.name}</span>
                  <span className="text-xs font-mono tabular-nums text-emerald-800">
                    {v.priceAdjustment > 0
                      ? `+Rp ${v.priceAdjustment.toLocaleString('id-ID')}`
                      : 'Harga Dasar'}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setVariantModalProduct(null)}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedSale && business && (
        <ReceiptModal
          sale={completedSale}
          business={business}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
