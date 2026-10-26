import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Product, ProductCategory, ProductVariant, InventoryMode } from '../../types/index.ts';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Utensils,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Package,
  X,
  Check,
} from 'lucide-react';

export const MenuModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  // Modal create/edit product
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [unit, setUnit] = useState<string>('porsi');
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('recipe');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [variants, setVariants] = useState<Array<{ name: string; priceAdjustment: number }>>([]);
  const [newVariantName, setNewVariantName] = useState<string>('');
  const [newVariantAdj, setNewVariantAdj] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category Manager Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<ProductCategory[]>('/categories'),
      ]);
      setProducts(prodRes);
      setCategories(catRes);
      if (catRes.length > 0 && !categoryId) {
        setCategoryId(catRes[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setSku(`MENU-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setImageUrl('');
    setPrice(20000);
    setCost(10000);
    setUnit('porsi');
    setInventoryMode('recipe');
    setCurrentStock(0);
    setMinStock(5);
    setVariants([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(product.categoryId);
    setSku(product.sku);
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || '');
    setPrice(product.price);
    setCost(product.cost);
    setUnit(product.unit);
    setInventoryMode(product.inventoryMode);
    setCurrentStock(product.currentStock);
    setMinStock(product.minStock);
    setVariants(
      product.variants?.map((v) => ({ name: v.name, priceAdjustment: v.priceAdjustment })) || []
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    setVariants((prev) => [...prev, { name: newVariantName.trim(), priceAdjustment: newVariantAdj }]);
    setNewVariantName('');
    setNewVariantAdj(0);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama menu wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        name,
        categoryId,
        sku,
        description,
        imageUrl,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        unit,
        inventoryMode,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 5,
        variants,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${productName}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Hapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen Menu &amp; Produk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur harga jual, estimasi HPP modal, varian produk, dan mode persediaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Kelola Kategori ({categories.length})
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              selectedCat === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCat === c.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Modal (HPP)</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-right">Margin Kotor</th>
                <th className="px-4 py-3">Mode Inventaris</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Memuat daftar menu...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 space-y-1">
                    <Utensils className="w-8 h-8 mx-auto text-slate-300" />
                    <div className="font-medium text-slate-600">Belum ada menu yang terdaftar</div>
                    <div className="text-[11px] text-slate-400">Klik tombol Tambah Menu Baru di atas</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const marginRp = p.price - p.cost;
                  const marginPct = p.price > 0 ? ((marginRp / p.price) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Utensils className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            {p.variants && p.variants.length > 0 && (
                              <div className="text-[11px] text-emerald-700">
                                {p.variants.map((v) => v.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cat?.name || 'Tanpa Kategori'}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                        Rp {p.cost.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <span className="text-emerald-700 font-semibold">{marginPct}%</span>
                        <span className="text-slate-400 text-[10px] block">
                          (+Rp {marginRp.toLocaleString('id-ID')})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.inventoryMode === 'recipe' ? (
                          <span className="text-[11px] font-medium text-emerald-800">
                            Resep BOM Dapur
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-700 font-mono">
                            Stok Jadi: {p.currentStock} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] font-medium text-emerald-700">Aktif</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingProduct ? 'Edit Informasi Menu' : 'Tambah Menu Makanan/Minuman Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Nama Menu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ayam Geprek Sambal Korek"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Modal / HPP Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Satuan Produk</label>
                  <input
                    type="text"
                    placeholder="porsi, cup, piring, botol"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">URL Foto Produk</label>
                  <input
                    type="text"
                    placeholder="/src/assets/images/... atau path URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Inventory Mode Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-slate-900">Mode Persediaan Stok</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex flex-col p-2.5 border rounded-lg cursor-pointer ${
                      inventoryMode === 'recipe'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <input
                        type="radio"
                        name="invMode"
                        checked={inventoryMode === 'recipe'}
                        onChange={() => setInventoryMode('recipe')}
                        className="text-emerald-600"
                      />
                      <span>Resep Bahan Baku (BOM)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Mengurangi stok bahan mentah (ayam, beras, cabai) otomatis saat menu terjual.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-2.5 border rounded-lg cursor-pointer ${
                      inventoryMode === 'product'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <input
                        type="radio"
                        name="invMode"
                        checked={inventoryMode === 'product'}
                        onChange={() => setInventoryMode('product')}
                        className="text-emerald-600"
                      />
                      <span>Produk Jadi (Ready Stock)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Mengurangi langsung stok unit produk jadi ini (misal: kaleng minuman, snack pack).
                    </span>
                  </label>
                </div>

                {inventoryMode === 'product' && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block text-slate-600 mb-0.5">Stok Saat Ini</label>
                      <input
                        type="number"
                        value={currentStock}
                        onChange={(e) => setCurrentStock(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-0.5">Batas Minimum Peringatan</label>
                      <input
                        type="number"
                        value={minStock}
                        onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Variants (e.g. Pedas Level, Size) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-slate-900">Varian Produk (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama Varian (misal: Level 3 Pedas, Large)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="number"
                    placeholder="+/- Harga (Rp)"
                    value={newVariantAdj || ''}
                    onChange={(e) => setNewVariantAdj(Number(e.target.value) || 0)}
                    className="w-28 px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-medium"
                  >
                    Tambah
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {variants.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <span className="font-semibold text-slate-800">{v.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-emerald-800">
                            {v.priceAdjustment > 0
                              ? `+Rp ${v.priceAdjustment.toLocaleString('id-ID')}`
                              : 'Rp 0'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(i)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Kelola Kategori Menu</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Kategori Baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
              >
                Tambah
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
