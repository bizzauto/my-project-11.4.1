import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package, ShoppingCart, TrendingUp, Eye, Edit, Trash2, Share2, X, MessageSquare, Upload, AlertTriangle, Tag, Percent, Trash, Minus, Plus as PlusIcon, Check, Clock, Truck, CreditCard } from 'lucide-react';
import apiClient from '../lib/api';

interface ProductVariant {
  size?: string;
  color?: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  category: string;
  stock: number;
  lowStockThreshold?: number;
  image?: string;
  status: 'active' | 'draft' | 'archived';
  sku: string;
  description?: string;
  variants?: ProductVariant[];
  rating?: number;
  numReviews?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  active: boolean;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: ProductVariant;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  paymentMethod: string;
  address?: string;
  couponCode?: string;
}

const orderStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <Clock size={14} /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: <Check size={14} /> },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Truck size={14} /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: <Check size={14} /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: <X size={14} /> },
};

const productStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

const productEmojis = ['🧴', '🧼', '✨', '☀️', '💊', '🌿', '🧴', '💄'];

const demoCoupons: Coupon[] = [
  { code: 'FIRST10', type: 'percentage', value: 10, minOrder: 500, active: true },
  { code: 'FLAT100', type: 'fixed', value: 100, minOrder: 999, active: true },
  { code: 'SUMMER20', type: 'percentage', value: 20, minOrder: 1500, active: true },
];

const ecommerceAPI = {
  listProducts: () => apiClient.get('/ecommerce/products'),
  createProduct: (data: any) => apiClient.post('/ecommerce/products', data),
  listOrders: () => apiClient.get('/ecommerce/orders'),
  updateOrderStatus: (id: string, status: string) => apiClient.patch(`/ecommerce/orders/${id}/status`, { status }),
};

const ECommercePage: React.FC = () => {
  const [tab, setTab] = useState<'products' | 'orders' | 'coupons'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(demoCoupons);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        ecommerceAPI.listProducts(),
        ecommerceAPI.listOrders(),
      ]);
      setProducts(productsRes.data?.data || productsRes.data || []);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
    } catch {
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock > 0 && p.lowStockThreshold && p.stock <= p.lowStockThreshold);

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.variant?.price || item.product.price) * item.quantity, 0);
  const cartDiscount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? (cartSubtotal * appliedCoupon.value) / 100
      : appliedCoupon.value
    : 0;
  const cartTotal = cartSubtotal - cartDiscount;

  const addToCart = (product: Product, quantity: number = 1, variant?: ProductVariant) => {
    setCart(prev => {
      const existing = prev.find(item =>
        item.product.id === product.id &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, variant }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number, variant?: ProductVariant) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, variant?: ProductVariant) => {
    setCart(prev => prev.filter(item =>
      !(item.product.id === productId && JSON.stringify(item.variant) === JSON.stringify(variant))
    ));
  };

  const applyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCodeInput.toUpperCase() && c.active);
    if (coupon) {
      if (coupon.minOrder && cartSubtotal < coupon.minOrder) {
        alert(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
        return;
      }
      if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
        alert('This coupon has reached its usage limit');
        return;
      }
      setAppliedCoupon(coupon);
      setCouponCodeInput('');
    } else {
      alert('Invalid or expired coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await ecommerceAPI.createProduct({
        ...productData,
        image: productData.image || productEmojis[Math.floor(Math.random() * productEmojis.length)],
      });
      const created = res.data?.data || res.data;
      setProducts(prev => [created, ...prev]);
    } catch {
      const newProduct: Product = {
        ...productData,
        id: `local-${Date.now()}`,
        image: productData.image || productEmojis[Math.floor(Math.random() * productEmojis.length)],
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    setShowProductModal(false);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading e-commerce data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-Commerce</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage products, orders, and coupons</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCouponModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <Tag size={18} />
            <span>Coupons</span>
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
            <AlertTriangle size={18} />
            Low Stock Alert ({lowStockProducts.length} items)
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map(p => (
              <span key={p.id} className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {p.name}: {p.stock} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Package size={16} />
            <span className="text-sm">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <ShoppingCart size={16} />
            <span className="text-sm">Pending Orders</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Package size={16} />
            <span className="text-sm">Active Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeProducts}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'products' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'}`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'orders' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'}`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('coupons')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'coupons' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'}`}
          >
            Coupons ({coupons.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tab === 'products' ? 'Search products...' : 'Search orders...'}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'No products found' : 'No products yet'}
              </p>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{productEmojis[Math.floor(Math.random() * productEmojis.length)]}</span>
                    )}
                    {product.lowStockThreshold && product.stock <= product.lowStockThreshold && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Low Stock
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${productStatusColors[product.status]}`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${product.stock === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₹{product.price}</span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-400 line-through">₹{product.comparePrice}</span>
                      )}
                      {product.comparePrice && (
                        <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
                          {Math.round((1 - product.price / product.comparePrice) * 100)}% off
                        </span>
                      )}
                    </div>
                    {product.variants && product.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.variants.map((v, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {v.size && `${v.size}`}{v.color && ` ${v.color}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {product.rating && (
                      <div className="flex items-center gap-1 mb-3 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="text-gray-600 dark:text-gray-400">{product.rating}</span>
                        <span className="text-gray-400">({product.numReviews} reviews)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">#{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${orderStatusConfig[order.status].color}`}>
                          {orderStatusConfig[order.status].icon}
                          {orderStatusConfig[order.status].label}
                        </span>
                        {order.couponCode && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs">
                            {order.couponCode}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerName} • {order.phone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(order.date).toLocaleDateString()} • {order.paymentMethod}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">₹{order.total.toLocaleString()}</p>
                        {order.discount > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">-₹{order.discount} discount</p>
                        )}
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Coupons Tab */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          {coupons.map(coupon => (
            <div key={coupon.code} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Percent size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{coupon.code}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                      {coupon.minOrder && ` • Min order ₹${coupon.minOrder}`}
                    </p>
                    {coupon.maxUses && (
                      <p className="text-xs text-gray-400">{coupon.usedCount || 0}/{coupon.maxUses} used</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${coupon.active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                  {coupon.active ? 'Active' : 'Expired'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <AddProductModal
          onClose={() => setShowProductModal(false)}
          onAdd={handleAddProduct}
        />
      )}

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          subtotal={cartSubtotal}
          discount={cartDiscount}
          total={cartTotal}
          appliedCoupon={appliedCoupon}
          onUpdateQuantity={updateCartQuantity}
          onRemove={removeFromCart}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          couponCodeInput={couponCodeInput}
          setCouponCodeInput={setCouponCodeInput}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <CouponModal
          coupons={coupons}
          onClose={() => setShowCouponModal(false)}
        />
      )}
    </div>
  );
};

// Add Product Modal Component
const AddProductModal: React.FC<{
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [category, setCategory] = useState('Hair Care');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariant = () => {
    if (newVariant.size || newVariant.color) {
      setVariants([...variants, { ...newVariant, price: newVariant.price || parseFloat(price), stock: newVariant.stock || parseInt(stock) || 0 }]);
      setNewVariant({});
      setShowVariantForm(false);
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name || !price) return;
    onAdd({
      name,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      category,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      status: 'active',
      sku: sku || `SKU-${Date.now()}`,
      description,
      image: productImage || undefined,
      variants: variants.length > 0 ? variants : undefined,
      rating: 4.5,
      numReviews: Math.floor(Math.random() * 100),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Product Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Image</label>
            {productImage ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <img src={productImage} alt="Product" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Click to upload product image</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Premium Hair Oil"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="499"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compare Price (₹)</label>
              <input
                type="number"
                value={comparePrice}
                onChange={e => setComparePrice(e.target.value)}
                placeholder="699"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Alert</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Hair Care</option>
                <option>Skin Care</option>
                <option>Premium</option>
                <option>Wellness</option>
                <option>Accessories</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="SKU-001"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Variants Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Variants (Size/Color)</label>
              <button
                type="button"
                onClick={() => setShowVariantForm(!showVariantForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Variant
              </button>
            </div>
            {showVariantForm && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-2">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Size (S/M/L)"
                    value={newVariant.size || ''}
                    onChange={e => setNewVariant({ ...newVariant, size: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  />
                  <input
                    type="text"
                    placeholder="Color"
                    value={newVariant.color || ''}
                    onChange={e => setNewVariant({ ...newVariant, color: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newVariant.price || ''}
                    onChange={e => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newVariant.stock || ''}
                    onChange={e => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) })}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Add Variant
                </button>
              </div>
            )}
            {variants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm flex items-center gap-1">
                    {v.size && `${v.size}`}{v.color && ` ${v.color}`} - ₹{v.price} ({v.stock})
                    <button onClick={() => removeVariant(i)} className="text-red-500 hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

// Cart Modal Component
const CartModal: React.FC<{
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  onUpdateQuantity: (productId: string, quantity: number, variant?: ProductVariant) => void;
  onRemove: (productId: string, variant?: ProductVariant) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  couponCodeInput: string;
  setCouponCodeInput: (value: string) => void;
  onClose: () => void;
}> = ({ cart, subtotal, discount, total, appliedCoupon, onUpdateQuantity, onRemove, onApplyCoupon, onRemoveCoupon, couponCodeInput, setCouponCodeInput, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shopping Cart ({cart.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {cart.map(item => (
                  <div key={`${item.product.id}-${JSON.stringify(item.variant)}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">{item.product.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-500">
                          {item.variant.size && `Size: ${item.variant.size}`} {item.variant.color && `Color: ${item.variant.color}`}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-blue-600">₹{(item.variant?.price || item.product.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.variant)}
                        className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.variant)}
                        className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <PlusIcon size={14} />
                      </button>
                      <button
                        onClick={() => onRemove(item.product.id, item.variant)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-600">Applied</span>
                    </div>
                    <button onClick={onRemoveCoupon} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                    <button
                      onClick={onApplyCoupon}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                Checkout • ₹{total.toLocaleString()}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Coupon Modal Component
const CouponModal: React.FC<{
  coupons: Coupon[];
  onClose: () => void;
}> = ({ coupons, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Coupons</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {coupons.map(coupon => (
            <div key={coupon.code} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Percent size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{coupon.code}</p>
                    <p className="text-sm text-gray-500">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(coupon.code); }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
              {coupon.minOrder && (
                <p className="text-xs text-gray-500 mt-2">Min order: ₹{coupon.minOrder}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ECommercePage;