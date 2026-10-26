import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Ingredient, Product, RecipeItem, InventoryMovement, Supplier, Purchase } from '../../types/index.ts';
import {
  Boxes,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Truck,
  History,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const [subTab, setSubTab] = useState<'ingredients' | 'recipes' | 'movements' | 'purchases'>('ingredients');

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingSku, setIngSku] = useState('');
  const [ingUnit, setIngUnit] = useState('kg');
  const [ingStock, setIngStock] = useState<number>(10);
  const [ingMinStock, setIngMinStock] = useState<number>(3);
  const [ingAvgCost, setIngAvgCost] = useState<number>(25000);

  // Manual Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjItemId, setAdjItemId] = useState('');
  const [adjType, setAdjType] = useState<'in' | 'out' | 'spoilage' | 'adjustment'>('in');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjNotes, setAdjNotes] = useState('');

  // BOM Recipe Editor Modal
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<Product | null>(null);
  const [productRecipeItems, setProductRecipeItems] = useState<Array<{ ingredientId: string; quantityRequired: number }>>([]);

  // Purchase Order Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<Array<{ itemType: 'product' | 'ingredient'; itemId: string; quantity: number; unitCost: number }>>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ingRes, prodRes, rcpRes, movRes, supRes, purRes] = await Promise.all([
        api.get<Ingredient[]>('/inventory/ingredients'),
        api.get<Product[]>('/products'),
        api.get<RecipeItem[]>('/inventory/recipes'),
        api.get<InventoryMovement[]>('/inventory/movements'),
        api.get<Supplier[]>('/inventory/suppliers'),
        api.get<Purchase[]>('/inventory/purchases'),
      ]);
      setIngredients(ingRes);
      setProducts(prodRes);
      setRecipes(rcpRes);
      setMovements(movRes);
      setSuppliers(supRes);
      setPurchases(purRes);
      if (supRes.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supRes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/ingredients', {
        name: ingName,
        sku: ingSku,
        unit: ingUnit,
        currentStock: ingStock,
        minStock: ingMinStock,
        avgCost: ingAvgCost,
      });
      setIsIngModalOpen(false);
      setIngName('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemId) return;
    try {
      await api.post('/inventory/adjustments', {
        itemType: 'ingredient',
        itemId: adjItemId,
        movementType: adjType,
        quantity: adjQty,
        notes: adjNotes,
      });
      setIsAdjModalOpen(false);
      setAdjNotes('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openRecipeEditor = (product: Product) => {
    setSelectedProductForRecipe(product);
    const existing = recipes.filter((r) => r.productId === product.id);
    setProductRecipeItems(
      existing.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: r.quantityRequired }))
    );
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductForRecipe) return;
    try {
      await api.post('/inventory/recipes', {
        productId: selectedProductForRecipe.id,
        recipeItems: productRecipeItems,
      });
      setSelectedProductForRecipe(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addRecipeRow = () => {
    if (ingredients.length === 0) return;
    setProductRecipeItems((prev) => [...prev, { ingredientId: ingredients[0].id, quantityRequired: 0.1 }]);
  };

  const removeRecipeRow = (idx: number) => {
    setProductRecipeItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) return;
    try {
      await api.post('/inventory/purchases', {
        supplierId: selectedSupplierId,
        invoiceNumber: purchaseInvoice || `PO-${Date.now().toString().slice(-6)}`,
        items: purchaseItems,
      });
      setIsPurchaseModalOpen(false);
      setPurchaseItems([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addPurchaseItemRow = () => {
    if (ingredients.length === 0) return;
    const ing = ingredients[0];
    setPurchaseItems((prev) => [
      ...prev,
      { itemType: 'ingredient', itemId: ing.id, quantity: 5, unitCost: ing.avgCost },
    ]);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Stok &amp; Bahan Baku Kuliner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola inventaris bahan mentah, resep porsi (BOM), mutasi persediaan, dan pembelian supplier.
          </p>
        </div>

        {/* Sub-tab segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg text-xs overflow-x-auto">
          <button
            onClick={() => setSubTab('ingredients')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              subTab === 'ingredients' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Bahan Baku ({ingredients.length})
          </button>
          <button
            onClick={() => setSubTab('recipes')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              subTab === 'recipes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Resep BOM Dapur
          </button>
          <button
            onClick={() => setSubTab('movements')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              subTab === 'movements' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Buku Mutasi Stok ({movements.length})
          </button>
          <button
            onClick={() => setSubTab('purchases')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              subTab === 'purchases' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Pembelian Supplier ({purchases.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: INGREDIENTS TABLE */}
      {subTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Daftar bahan mentah untuk masakan dan racikan minuman
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdjModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Penyesuaian Manual
              </button>
              <button
                onClick={() => setIsIngModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bahan Baku</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">Kode SKU</th>
                    <th className="px-4 py-3">Satuan</th>
                    <th className="px-4 py-3 text-right">Stok Fisik Saat Ini</th>
                    <th className="px-4 py-3 text-right">Batas Min. Peringatan</th>
                    <th className="px-4 py-3 text-right">Biaya Rata-Rata Satuan</th>
                    <th className="px-4 py-3 text-right">Estimasi Nilai Stok</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.minStock;
                    const stockValue = ing.currentStock * ing.avgCost;
                    return (
                      <tr key={ing.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{ing.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{ing.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{ing.unit}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {ing.currentStock} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500 tabular-nums">
                          {ing.minStock} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                          Rp {ing.avgCost.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                          Rp {Math.round(stockValue).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Menipis
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-700">Aman</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RECIPE BOM (BILL OF MATERIALS) */}
      {subTab === 'recipes' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
            <div className="font-semibold text-xs text-emerald-950">Formula Bill of Materials (BOM)</div>
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              Atur takaran bahan baku yang otomatis terpotong dari inventaris setiap kali 1 porsi menu terjual di kasir.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => p.inventoryMode === 'recipe')
              .map((product) => {
                const productRecipes = recipes.filter((r) => r.productId === product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="font-bold text-xs text-slate-900">{product.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
                      </div>

                      <div className="pt-2 space-y-1.5 text-xs">
                        <div className="text-[11px] font-medium text-slate-500">
                          Takaran Bahan per 1 {product.unit}:
                        </div>
                        {productRecipes.length === 0 ? (
                          <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded">
                            Belum ada formula bahan yang diatur
                          </div>
                        ) : (
                          productRecipes.map((r) => {
                            const ing = ingredients.find((i) => i.id === r.ingredientId);
                            return (
                              <div key={r.id} className="flex justify-between text-slate-700 text-[11px]">
                                <span>{ing?.name || 'Bahan'}</span>
                                <span className="font-mono tabular-nums text-slate-900 font-medium">
                                  {r.quantityRequired} {ing?.unit}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => openRecipeEditor(product)}
                      className="w-full mt-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Konfigurasi Resep BOM
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STOCK MOVEMENTS LEDGER */}
      {subTab === 'movements' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Jejak audit setiap perubahan stok (penjualan kasir, pemakaian resep, pembelian, dan penyesuaian).
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Item / Bahan</th>
                    <th className="px-4 py-3">Tipe Mutasi</th>
                    <th className="px-4 py-3 text-right">Perubahan Qty</th>
                    <th className="px-4 py-3 text-right">Stok Awal &rarr; Akhir</th>
                    <th className="px-4 py-3">Referensi / Catatan</th>
                    <th className="px-4 py-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                        Belum ada riwayat mutasi persediaan tercatat.
                      </td>
                    </tr>
                  ) : (
                    movements.slice(0, 100).map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                            {new Date(m.createdAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">
                            {m.itemName}
                          </td>
                          <td className="px-4 py-2.5 font-sans">
                            <span className="capitalize text-slate-700">
                              {m.movementType.replace('_', ' ')}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                            {m.previousStock} → {m.newStock}
                          </td>
                          <td className="px-4 py-2.5 font-sans text-slate-500 truncate max-w-xs">
                            {m.notes || m.referenceId || '-'}
                          </td>
                          <td className="px-4 py-2.5 font-sans text-slate-600">{m.createdBy}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SUPPLIERS & PURCHASES */}
      {subTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Penerimaan pesanan bahan baku dari supplier &amp; pembaruan stok otomatis
            </span>
            <button
              onClick={() => {
                addPurchaseItemRow();
                setIsPurchaseModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pembelian Baru</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">No. Faktur PO</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Item Pembelian</th>
                    <th className="px-4 py-3 text-right">Total Pembelian</th>
                    <th className="px-4 py-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Belum ada faktur pembelian supplier.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          {p.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">
                          {new Date(p.purchaseDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.supplierName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.items.map((it) => `${it.quantity}x ${it.itemName}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          Rp {p.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {isIngModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Tambah Bahan Baku Mentah</h3>
              <button onClick={() => setIsIngModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  placeholder="Contoh: Daging Sapi Giling, Cabai Rawit"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    value={ingSku}
                    onChange={(e) => setIngSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="kg, liter, gram, pcs"
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ingStock}
                    onChange={(e) => setIngStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Batas Min.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Biaya / Satuan</label>
                  <input
                    type="number"
                    value={ingAvgCost}
                    onChange={(e) => setIngAvgCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIngModalOpen(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Penyesuaian Manual Stok Bahan</h3>
              <button onClick={() => setIsAdjModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Pilih Bahan Baku</label>
                <select
                  value={adjItemId}
                  onChange={(e) => setAdjItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  required
                >
                  <option value="">-- Pilih Bahan Baku --</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Sisa: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenis Penyesuaian</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="in">Stok Masuk (+)</option>
                    <option value="out">Stok Keluar (-)</option>
                    <option value="spoilage">Bahan Rusak / Kedaluwarsa (-)</option>
                    <option value="adjustment">Koreksi Opname</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jumlah Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Stok opname akhir bulan / sayur layu"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOM Recipe Editor Modal */}
      {selectedProductForRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Formula Resep (BOM): {selectedProductForRecipe.name}</h3>
                <p className="text-[11px] text-slate-500">
                  Tentukan bahan dan takaran yang berkurang setiap kali 1 {selectedProductForRecipe.unit} terjual.
                </p>
              </div>
              <button onClick={() => setSelectedProductForRecipe(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {productRecipeItems.map((item, idx) => {
                const selectedIng = ingredients.find((i) => i.id === item.ingredientId);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={item.ingredientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductRecipeItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], ingredientId: val };
                          return next;
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 w-32">
                      <input
                        type="number"
                        step="0.001"
                        value={item.quantityRequired}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setProductRecipeItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], quantityRequired: val };
                            return next;
                          });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center"
                      />
                      <span className="text-[11px] text-slate-500 font-mono">{selectedIng?.unit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRecipeRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addRecipeRow}
                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                + Tambah Bahan Baku ke Formula Resep
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProductForRecipe(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                Simpan Resep BOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Catat Pembelian Bahan dari Supplier</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor Faktur / Surat Jalan</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-SUP-091"
                    value={purchaseInvoice}
                    onChange={(e) => setPurchaseInvoice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-800">Daftar Bahan yang Diterima:</label>
                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.itemId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const ing = ingredients.find((i) => i.id === val);
                        setPurchaseItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], itemId: val, unitCost: ing?.avgCost || 0 };
                          return next;
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setPurchaseItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], quantity: val };
                          return next;
                        });
                      }}
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center"
                    />

                    <input
                      type="number"
                      placeholder="Harga Beli"
                      value={item.unitCost}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setPurchaseItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], unitCost: val };
                          return next;
                        });
                      }}
                      className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-right"
                    />

                    <button
                      type="button"
                      onClick={() => setPurchaseItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPurchaseItemRow}
                  className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  + Tambah Baris Bahan
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan &amp; Masukkan ke Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
