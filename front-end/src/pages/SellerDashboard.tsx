import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Wallet, 
  Plus, 
  Minus,
  Search, 
  Filter, 
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Lock,
  Star,
  ThumbsUp,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SALES_DATA = [
  { month: 'Jan', sales: 400000 },
  { month: 'Feb', sales: 550000 },
  { month: 'Mar', sales: 500000 },
  { month: 'Apr', sales: 650000 },
  { month: 'May', sales: 600000 },
  { month: 'Jun', sales: 700000 },
];

export default function SellerDashboard() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="bg-bg-main min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col sticky top-16 h-[calc(100vh-64px)] shadow-2xl z-20">
        <div className="p-10 space-y-12">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] pl-4">Seller Control</p>
              <nav className="space-y-2">
                  <Link to="/seller" className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                    path === '/seller' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                  )}>
                    <div className="flex items-center space-x-4">
                      <BarChart3 size={18} />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  <Link to="/seller/products" className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                    path === '/seller/products' || path.startsWith('/seller/products') ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                  )}>
                    <div className="flex items-center space-x-4">
                      <Package size={18} />
                      <span>Products</span>
                    </div>
                  </Link>
                  <Link to="/seller/orders" className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                    path === '/seller/orders' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                  )}>
                    <div className="flex items-center space-x-4">
                      <ShoppingBag size={18} />
                      <span>Orders</span>
                    </div>
                  </Link>
                  <Link to="/seller/finance" className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                    path === '/seller/finance' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                  )}>
                    <div className="flex items-center space-x-4">
                      <Wallet size={18} />
                      <span>Finance</span>
                    </div>
                  </Link>
              </nav>
            </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-16 max-w-[95%] mx-auto overflow-y-auto">
        <Routes>
           <Route path="/" element={<Overview />} />
           <Route path="/products" element={<ProductsList />} />
           <Route path="/orders" element={<OrdersManagement />} />
           <Route path="/finance" element={<FinanceSection />} />
        </Routes>
      </main>
    </div>
  );
}

function Overview() {
  const [range, setRange] = useState('1M');
  const [stats, setStats] = useState({ revenue: 0, activeProducts: 0, totalSales: 0, monthlySales: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 5;

  React.useEffect(() => {
    // Fetch stats
    fetch('/api/seller/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    // Fetch recent orders for the bottom list
    const offset = currentPage * itemsPerPage;
    fetch(`/api/orders?limit=${itemsPerPage}&offset=${offset}`)
      .then(res => res.json())
      .then(data => {
        setRecentOrders(data.orders || []);
        setTotalOrders(data.total || 0);
      })
      .catch(console.error);
  }, [currentPage]);

  const getFilteredData = () => {
    if (stats.monthlySales.length > 0) {
      if (range === 'ALL' || range === '3M' || range === '1M') {
        return stats.monthlySales;
      }
    }
    switch(range) {
      case '7D':
        return [
          { month: 'Mon', sales: 450000 },
          { month: 'Tue', sales: 620000 },
          { month: 'Wed', sales: 580000 },
          { month: 'Thu', sales: 890000 },
          { month: 'Fri', sales: 1200000 },
          { month: 'Sat', sales: 1550000 },
          { month: 'Sun', sales: 1100000 },
        ];
      default:
        return stats.monthlySales.length > 0 ? stats.monthlySales : SALES_DATA;
    }
  };

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-end">
         <div className="space-y-2">
            <h1 className="text-5xl font-display font-black tracking-tighter uppercase leading-tight">Overview</h1>
            <p className="sleek-label opacity-40">Analytics and performance metrics</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Total Revenue</span>
               <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                 <TrendingUp size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">
                 {isLoading ? '...' : `IDR ${(stats.revenue / 1000).toFixed(0)}K`}
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-green-600">+12.5% Month-over-Month</p>
            </div>
         </div>
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Active Products</span>
               <div className="p-3 bg-zinc-50 text-black rounded-xl">
                 <Package size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">
                 {isLoading ? '...' : stats.activeProducts}
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-black">+8.2% new products</p>
            </div>
         </div>
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Total Sales</span>
               <div className="p-3 bg-zinc-50 text-black rounded-xl">
                 <ShoppingBag size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">
                 {isLoading ? '...' : stats.totalSales}
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-black">+15.5% Velocity</p>
            </div>
         </div>
      </div>

      <div className="sleek-card p-12 border-none space-y-10 bg-white">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-black tracking-tight uppercase">Sales Projection</h2>
            <div className="flex space-x-2">
               {['7D', '1M', '3M', 'ALL'].map(t => (
                 <button 
                  key={t} 
                  onClick={() => setRange(t)}
                  className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", range === t ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black")}
                 >
                  {t}
                 </button>
               ))}
            </div>
         </div>
         <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={getFilteredData()}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#cccccc', fontWeight: 900 }} 
                    dy={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#cccccc', fontWeight: 900 }} 
                  />
                  <Tooltip 
                     contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px' }}
                     itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                  />
          <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#000000" 
                    strokeWidth={6} 
                    dot={{ r: 0 }} 
                    activeDot={{ r: 8, fill: '#000000', strokeWidth: 4, stroke: '#ffffff' }} 
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-8 pb-32">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-black tracking-tight uppercase">Recent Sales Activity</h2>
            <Link to="/seller/orders" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">View All Orders</Link>
         </div>
         <div className="sleek-card border-none overflow-hidden bg-white shadow-xl">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-gray-100">
                     <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                     <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                     <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                     <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {recentOrders.length > 0 ? recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-all cursor-pointer">
                       <td className="px-10 py-8 font-mono text-[10px] font-black tracking-widest text-black">ORD-{order.id}</td>
                       <td className="px-10 py-8 text-xs font-black uppercase tracking-tight">{order.product_name}</td>
                       <td className="px-10 py-8 text-xs font-black">IDR {Number(order.total_amount).toLocaleString()}</td>
                       <td className="px-10 py-8">
                          <span className="px-4 py-1.5 bg-black text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                            {order.status === 'PAID' ? 'Processing' : order.status}
                          </span>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                        No recent sales found
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {totalOrders > itemsPerPage && (
           <div className="flex justify-center items-center space-x-4 pt-8">
              <button 
                 disabled={currentPage === 0}
                 onClick={() => setCurrentPage(prev => prev - 1)}
                 className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
              >
                 Prev
              </button>
              <span className="text-[10px] font-black uppercase text-gray-400">Page {currentPage + 1} of {Math.ceil(totalOrders / itemsPerPage) || 1}</span>
              <button 
                 disabled={currentPage >= Math.ceil(totalOrders / itemsPerPage) - 1}
                 onClick={() => setCurrentPage(prev => prev + 1)}
                 className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
              >
                 Next
              </button>
           </div>
         )}
      </div>
    </div>
  );
}

function ProductsList() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('0');
  const [newProductOriginalPrice, setNewProductOriginalPrice] = useState('');
  const [newProductDiscount, setNewProductDiscount] = useState('0');
  const [editProductDiscount, setEditProductDiscount] = useState('0');
  const [newProductType, setNewProductType] = useState('New');
  const [newProductGender, setNewProductGender] = useState('Unisex');
  const [newProductSizes, setNewProductSizes] = useState<Record<string, number>>({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });
  
  const [newProductAnalyzed, setNewProductAnalyzed] = useState(false);
  const [predictedCategories, setPredictedCategories] = useState<string[]>([]);
  const [editProductAnalyzed, setEditProductAnalyzed] = useState(false);
  const [editPredictedCategories, setEditPredictedCategories] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [newProductImage, setNewProductImage] = useState<string | null>(null);

  const editFileInputRef = React.useRef<HTMLInputElement>(null);
  const [editProductImage, setEditProductImage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sync edits discount percentages
  React.useEffect(() => {
    if (editingProduct) {
      const orig = Number(editingProduct.originalPrice) || 0;
      const sale = Number(editingProduct.price) || 0;
      if (orig > 0 && sale > 0 && orig > sale) {
        const pct = Math.round(((orig - sale) / orig) * 100);
        setEditProductDiscount(String(pct));
      } else {
        setEditProductDiscount('0');
      }
    }
  }, [editingProduct?.id]);

  // Pricing synchronization helper methods
  const handleNewOriginalPriceChange = (valStr: string) => {
    setNewProductOriginalPrice(valStr);
    const original = Number(valStr) || 0;
    const discount = Number(newProductDiscount) || 0;
    if (discount > 0 && original > 0) {
      const sale = Math.round(original * (1 - discount / 100));
      setNewProductPrice(String(sale));
    } else {
      setNewProductPrice(valStr);
    }
  };

  const handleNewDiscountChange = (valStr: string) => {
    let discount = Number(valStr) || 0;
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setNewProductDiscount(String(discount));
    
    const original = Number(newProductOriginalPrice) || 0;
    if (original > 0) {
      const sale = Math.round(original * (1 - discount / 100));
      setNewProductPrice(String(sale));
    }
  };

  const handleNewSalePriceChange = (valStr: string) => {
    setNewProductPrice(valStr);
    const sale = Number(valStr) || 0;
    const original = Number(newProductOriginalPrice) || 0;
    if (original > 0 && sale > 0 && original > sale) {
      const pct = Math.round(((original - sale) / original) * 100);
      setNewProductDiscount(String(pct));
    } else {
      setNewProductDiscount('0');
    }
  };

  const handleEditOriginalPriceChange = (valStr: string) => {
    const original = Number(valStr) || 0;
    const discount = Number(editProductDiscount) || 0;
    let sale = editingProduct.price;
    if (discount > 0 && original > 0) {
      sale = Math.round(original * (1 - discount / 100));
    } else {
      sale = original;
    }
    setEditingProduct({
      ...editingProduct,
      originalPrice: original > 0 ? original : null,
      price: sale
    });
  };

  const handleEditDiscountChange = (valStr: string) => {
    let discount = Number(valStr) || 0;
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setEditProductDiscount(String(discount));

    const original = Number(editingProduct.originalPrice) || 0;
    if (original > 0) {
      const sale = Math.round(original * (1 - discount / 100));
      setEditingProduct({
        ...editingProduct,
        price: sale
      });
    }
  };

  const handleEditSalePriceChange = (valStr: string) => {
    const sale = Number(valStr) || 0;
    const original = Number(editingProduct.originalPrice) || 0;
    if (original > 0 && sale > 0 && original > sale) {
      const pct = Math.round(((original - sale) / original) * 100);
      setEditProductDiscount(String(pct));
    } else {
      setEditProductDiscount('0');
    }
    setEditingProduct({
      ...editingProduct,
      price: sale
    });
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Edit File selected:', file);
    if (file) {
      const url = URL.createObjectURL(file);
      setEditProductImage(url);
    }
  };

  const handleAnalyze = async (name: string, description: string, isEdit = false) => {
    if (!name || !description) {
      alert('Please provide both product title and description for AI analysis.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to analyze');
      }
      
      const data = await response.json();
      if (data.categories && data.categories.length > 0) {
        if (isEdit) {
          setEditPredictedCategories(data.categories);
          setEditProductAnalyzed(true);
        } else {
          setPredictedCategories(data.categories);
          setNewProductAnalyzed(true);
        }
      } else {
        alert('AI could not suggest categories for this product. Please check your title/description.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(`AI Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      const url = URL.createObjectURL(file);
      setNewProductImage(url);
    }
  };
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const offset = currentPage * itemsPerPage;
      const response = await fetch(`/api/products?limit=${itemsPerPage}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalSupply = (sizes: any) => {
    if (!sizes) return 0;
    let s = sizes;
    if (typeof s === 'string') {
      try {
        s = JSON.parse(s);
      } catch (e) { return 0; }
    }
    return Object.values(s).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
  };

  const handleUpdate = async (updatedData: any) => {
    try {
      const response = await fetch(`/api/products/${updatedData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          description: updatedData.description,
          category: editPredictedCategories[0] || updatedData.category,
          price: updatedData.price,
          originalPrice: updatedData.originalPrice,
          image: updatedData.image,
          condition: updatedData.condition || updatedData.type,
          gender: updatedData.gender || 'Unisex',
          sizes: updatedData.sizes
        })
      });

      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        setEditProductAnalyzed(false);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          description: newProductDesc,
          category: predictedCategories[0] || 'Uncategorized',
          price: Number(newProductPrice),
          originalPrice: newProductOriginalPrice ? Number(newProductOriginalPrice) : null,
          image: newProductImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=90',
          condition: newProductType,
          gender: newProductGender,
          sizes: newProductSizes
        })
      });

      if (response.ok) {
        await fetchProducts();
        setNewProductName('');
        setNewProductDesc('');
        setNewProductPrice('0');
        setNewProductOriginalPrice('');
        setNewProductDiscount('0');
        setNewProductType('New');
        setNewProductGender('Unisex');
        setNewProductSizes({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });
        setNewProductImage(null);
        setNewProductAnalyzed(false);
        setShowAdd(false);
      }
    } catch (error) {
      console.error('Publish failed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-center">
         <div className="space-y-2">
            <h1 className="text-5xl font-display font-black tracking-tighter uppercase leading-tight">Inventory</h1>
            <p className="sleek-label opacity-40">Manage and catalog your exclusive products</p>
         </div>
         <button 
           onClick={() => setShowAdd(true)}
           className="sleek-button-primary px-10 py-5 text-sm flex items-center space-x-4 shadow-2xl"
         >
            <Plus size={20} />
            <span>Create New Product</span>
         </button>
      </div>

      {showAdd ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="sleek-card p-12 border-none space-y-12 bg-white shadow-2xl">
           <div className="flex justify-between items-center border-b border-gray-100 pb-8">
              <h2 className="text-3xl font-display font-black tracking-tight uppercase">Create New Product</h2>
              <button onClick={() => { setShowAdd(false); setNewProductAnalyzed(false); }} className="p-4 bg-gray-50 text-gray-400 hover:text-black rounded-2xl transition-all"><Plus size={32} className="rotate-45" /></button>
           </div>
           
           <div className="space-y-16 max-w-5xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                 <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Visualization</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,.raw,.psd,.ai,.tiff" 
                      onChange={handleImageUpload} 
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/5] border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-400 space-y-6 hover:border-black/20 hover:bg-gray-50/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                       {newProductImage ? (
                         <img src={newProductImage} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <>
                           <div className="p-8 bg-gray-50 rounded-[2rem] group-hover:scale-110 transition-transform">
                              <Download size={48} className="text-black" />
                           </div>
                           <div className="text-center space-y-2">
                              <p className="font-black text-lg uppercase tracking-tight text-black">Upload master files</p>
                              <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">PNG, RAW, JPG up to 100MB</p>
                           </div>
                         </>
                       )}
                    </div>
                 </div>

                 <div className="space-y-10">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Title</p>
                       <input 
                         type="text"
                         value={newProductName}
                         onChange={(e) => setNewProductName(e.target.value)}
                         placeholder="e.g. Green Essentials T-Shirt"
                         className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight placeholder:text-gray-200"
                       />
                       <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Max 50 characters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Original Price (IDR)</p>
                          <input 
                            type="number"
                            value={newProductOriginalPrice}
                            onChange={(e) => handleNewOriginalPriceChange(e.target.value)}
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight"
                          />
                          <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Base price before discount</p>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Discount (%)</p>
                          <div className="flex gap-4">
                             <input 
                               type="number"
                               min="0"
                               max="100"
                               value={newProductDiscount}
                               onChange={(e) => handleNewDiscountChange(e.target.value)}
                               placeholder="0"
                               className="w-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] px-4 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight text-center"
                             />
                             <div className="flex-1 flex gap-2">
                                {[10, 20, 30, 50].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleNewDiscountChange(String(pct))}
                                    className={cn(
                                      "flex-1 rounded-[1rem] text-[10px] font-bold transition-all border border-gray-100",
                                      Number(newProductDiscount) === pct ? "bg-black text-white" : "bg-white text-gray-500 hover:border-black"
                                    )}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                             </div>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Discount</p>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Sale Price (IDR)</p>
                          <input 
                            type="number"
                            value={newProductPrice}
                            onChange={(e) => handleNewSalePriceChange(e.target.value)}
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight"
                          />
                          <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Final sale price</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</p>
                       <textarea 
                         value={newProductDesc}
                         onChange={(e) => setNewProductDesc(e.target.value)}
                         placeholder="Describe your product... Our system will verify brand authenticity." 
                         className="w-full h-56 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight placeholder:text-gray-200 resize-none leading-relaxed"
                       />
                       <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Max 500 characters</p>
                       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          <button 
                            onClick={() => handleAnalyze(newProductName, newProductDesc)}
                            disabled={isAnalyzing}
                            className={cn(
                              "flex items-center space-x-4 px-8 py-4 bg-authentic text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0",
                              isAnalyzing && "opacity-50 cursor-not-allowed"
                            )}
                          >
                             <BrainCircuit size={20} className={cn(isAnalyzing && "animate-pulse")} />
                             <span>{isAnalyzing ? 'AI is Processing...' : 'Analyze with AI'}</span>
                          </button>
                          <div className="flex-1 flex flex-wrap gap-2 items-center">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Predicted Category:</span>
                             {newProductAnalyzed ? (
                               predictedCategories.map(cat => (
                                 <button key={cat} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:border-black transition-all">
                                    {cat}
                                 </button>
                               ))
                             ) : (
                               <div className="w-32 h-8 bg-white border border-gray-100 border-dashed rounded-xl flex items-center justify-center text-[9px] font-black text-gray-200 uppercase tracking-widest italic shadow-sm">
                                  No Prediction
                               </div>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Supply by Size</p>
                       <div className="grid grid-cols-5 gap-4">
                          {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                            <div key={size} className="p-4 bg-gray-50 rounded-[1.5rem] space-y-3 border border-gray-100 flex flex-col items-center">
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{size}</span>
                               <div className="flex flex-col items-center space-y-1">
                                  <button 
                                    onClick={() => setNewProductSizes({ ...newProductSizes, [size]: (newProductSizes[size] || 0) + 1 })}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <span className="font-display font-black text-lg">{newProductSizes[size] || 0}</span>
                                      <button 
                                        onClick={() => setNewProductSizes({ ...newProductSizes, [size]: Math.max(0, (newProductSizes[size] || 0) - 1) })}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                      >
                                        <Minus size={14} />
                                      </button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Condition</label>
                        <div className="flex gap-4">
                           {['New', 'Pre-owned'].map(type => (
                             <button 
                               key={type}
                               onClick={() => setNewProductType(type)}
                               className={cn(
                                 "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                 newProductType === type 
                                   ? "bg-black text-white border-black shadow-xl" 
                                   : "bg-gray-50 text-gray-300 border-gray-100 hover:border-black/20"
                               )}
                             >
                               {type}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Gender</label>
                        <div className="flex gap-4">
                           {['Men', 'Women', 'Unisex'].map(gender => (
                             <button 
                               key={gender}
                               onClick={() => setNewProductGender(gender)}
                               className={cn(
                                 "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                 newProductGender === gender 
                                   ? "bg-black text-white border-black shadow-xl" 
                                   : "bg-gray-50 text-gray-300 border-gray-100 hover:border-black/20"
                               )}
                             >
                               {gender}
                             </button>
                           ))}
                        </div>
                     </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-12 border-t border-gray-100">
                 <button onClick={handlePublish} className="flex-1 sleek-button-primary py-6 text-sm uppercase tracking-widest shadow-xl">Publish Product</button>
                 <button onClick={() => { setShowAdd(false); setNewProductAnalyzed(false); }} className="flex-1 sleek-button-secondary py-6 text-sm uppercase tracking-widest border-2">Discard Draft</button>
              </div>
           </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <div className="sleek-card border-none overflow-hidden bg-white shadow-2xl">
            <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gender</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Condition</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Valuation</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supply</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                        <td className="px-10 py-8">
                          <div className="flex items-center space-x-6">
                              <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                                <img src={product.image} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-display font-black text-lg tracking-tight uppercase">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-xs font-black uppercase tracking-widest text-gray-400">{product.category}</td>
                        <td className="px-10 py-8 text-xs font-black uppercase tracking-widest text-gray-400">{product.gender || 'Unisex'}</td>
                        <td className="px-10 py-8">
                          <span className={cn(
                            "px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest border",
                            product.condition === 'New' 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {product.condition}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="font-display font-black text-lg">IDR {Number(product.price).toLocaleString()}</div>
                          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                            <div className="text-[10px] font-bold text-gray-300 line-through decoration-gray-300">
                              IDR {Number(product.originalPrice).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-8 font-black text-xs text-gray-400">
                          {getTotalSupply(product.sizes)} PCS
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center justify-between">
                              <div className={cn(
                                "inline-flex px-6 py-2 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm border",
                                product.status === 'VERIFIED' ? "bg-black text-white border-black" : 
                                product.status === 'PENDING' ? "bg-zinc-100 text-zinc-400 border-zinc-200" :
                                product.status === 'SOLD' ? "bg-emerald-600 text-white border-emerald-700" :
                                "bg-red-50 text-red-600 border-red-100"
                              )}>
                                {product.status}
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                                className="px-6 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black hover:text-white transition-all ml-4"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all ml-2"
                              >
                                <Trash2 size={16} />
                              </button>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
               <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
               >
                  Prev
               </button>
               <div className="flex space-x-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        currentPage === i ? "bg-black text-white" : "bg-white border border-gray-100 hover:border-black"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
               </div>
               <button 
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
               >
                  Next
               </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Product Modal */}



      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setEditingProduct(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-5xl sleek-card border-none p-16 shadow-2xl space-y-12 bg-white max-h-[90vh] overflow-y-auto"
            >
               <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                  <h2 className="text-3xl font-display font-black tracking-tight uppercase">Update Product</h2>
                  <button onClick={() => { setEditingProduct(null); setEditProductAnalyzed(false); }} className="p-4 bg-gray-50 text-gray-400 hover:text-black rounded-2xl transition-all"><Plus size={32} className="rotate-45" /></button>
               </div>
               
               <div className="space-y-16">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <div className="space-y-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Visualization</p>
                        <div className="aspect-[4/5] border border-gray-100 rounded-[3rem] overflow-hidden group relative">
                           <img src={editProductImage || editingProduct.image} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <input 
                                type="file" 
                                ref={editFileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleEditImageUpload} 
                              />
                              <button 
                                onClick={() => editFileInputRef.current?.click()}
                                className="px-8 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                              >
                                Replace Master File
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-10">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Title</p>
                           <input 
                             type="text"
                             defaultValue={editingProduct.name}
                             onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                             className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight"
                           />
                           <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Max 50 characters</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Original Price (IDR)</p>
                              <input 
                                type="number"
                                value={editingProduct.originalPrice || ''}
                                onChange={(e) => handleEditOriginalPriceChange(e.target.value)}
                                placeholder="0"
                                className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight"
                              />
                              <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Original price</p>
                           </div>

                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Discount (%)</p>
                              <div className="flex gap-4">
                                 <input 
                                   type="number"
                                   min="0"
                                   max="100"
                                   value={editProductDiscount}
                                   onChange={(e) => handleEditDiscountChange(e.target.value)}
                                   placeholder="0"
                                   className="w-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] px-4 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight text-center"
                                 />
                                 <div className="flex-1 flex gap-2">
                                    {[10, 20, 30, 50].map((pct) => (
                                      <button
                                        key={pct}
                                        type="button"
                                        onClick={() => handleEditDiscountChange(String(pct))}
                                        className={cn(
                                          "flex-1 rounded-[1rem] text-[10px] font-bold transition-all border border-gray-100",
                                          Number(editProductDiscount) === pct ? "bg-black text-white" : "bg-white text-gray-500 hover:border-black"
                                        )}
                                      >
                                        {pct}%
                                      </button>
                                    ))}
                                 </div>
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Discount</p>
                           </div>

                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Sale Price (IDR)</p>
                              <input 
                                type="number"
                                value={editingProduct.price || ''}
                                onChange={(e) => handleEditSalePriceChange(e.target.value)}
                                placeholder="0"
                                className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-4 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight"
                              />
                              <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Final sale price</p>
                           </div>
                        </div>

                         <div className="space-y-6">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</p>
                               <textarea 
                                 defaultValue={editingProduct.description}
                                 onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                 className="w-full h-56 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 outline-none focus:ring-2 focus:ring-black font-black text-sm tracking-tight resize-none leading-relaxed"
                               />
                               <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Max 500 characters</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                               <button 
                                 onClick={() => handleAnalyze(editingProduct.name, editingProduct.description, true)}
                                 disabled={isAnalyzing}
                                 className={cn(
                                   "flex items-center space-x-4 px-8 py-4 bg-authentic text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0",
                                   isAnalyzing && "opacity-50 cursor-not-allowed"
                                 )}
                               >
                                  <BrainCircuit size={20} className={cn(isAnalyzing && "animate-pulse")} />
                                  <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                               </button>
                               <div className="flex-1 flex flex-wrap gap-2 items-center">
                                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Predicted Category:</span>
                                  {editProductAnalyzed ? (
                                    editPredictedCategories.map(cat => (
                                      <button key={cat} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:border-black transition-all">
                                         {cat}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                       {editingProduct.category}
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>

                        <div className="space-y-6">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Supply by Size</p>
                           <div className="grid grid-cols-5 gap-4">
                              {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                <div key={size} className="p-4 bg-gray-50 rounded-[1.5rem] space-y-3 border border-gray-100 flex flex-col items-center">
                                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{size}</span>
                                   <div className="flex flex-col items-center space-y-1">
                                      <button 
                                        onClick={() => setEditingProduct({ 
                                          ...editingProduct, 
                                          sizes: { ...editingProduct.sizes, [size]: (editingProduct.sizes[size] || 0) + 1 } 
                                        })}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                      >
                                        <Plus size={14} />
                                      </button>
                                      <span className="font-display font-black text-lg">{editingProduct.sizes[size] || 0}</span>
                                      <button 
                                        onClick={() => setEditingProduct({ 
                                          ...editingProduct, 
                                          sizes: { ...editingProduct.sizes, [size]: Math.max(0, (editingProduct.sizes[size] || 0) - 1) } 
                                        })}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                      >
                                        <Minus size={14} />
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Condition</label>
                           <div className="flex gap-4">
                              {['New', 'Pre-owned'].map(cond => (
                                <button 
                                  key={cond}
                                  onClick={() => setEditingProduct({ ...editingProduct, condition: cond })}
                                  className={cn(
                                    "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                    (editingProduct.condition || editingProduct.type) === cond 
                                      ? "bg-black text-white border-black shadow-xl" 
                                      : "bg-gray-50 text-gray-300 border-gray-100 hover:border-black/20"
                                  )}
                                >
                                  {cond}
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Gender</label>
                           <div className="flex gap-4">
                              {['Men', 'Women', 'Unisex'].map(g => (
                                <button 
                                  key={g}
                                  onClick={() => setEditingProduct({ ...editingProduct, gender: g })}
                                  className={cn(
                                    "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                    (editingProduct.gender || 'Unisex') === g 
                                      ? "bg-black text-white border-black shadow-xl" 
                                      : "bg-gray-50 text-gray-300 border-gray-100 hover:border-black/20"
                                  )}
                                >
                                  {g}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-6 pt-12 border-t border-gray-100">
                     <button 
                        onClick={() => handleUpdate({ ...editingProduct, image: editProductImage || editingProduct.image })}
                        className="flex-1 sleek-button-primary py-6 text-sm uppercase tracking-widest shadow-xl"
                     >
                        Apply Changes
                     </button>
                     <button 
                        onClick={() => { setEditingProduct(null); setEditProductAnalyzed(false); }}
                        className="flex-1 sleek-button-secondary py-6 text-sm uppercase tracking-widest border-2"
                     >
                        Discard Edits
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersManagement() {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 10;

  React.useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const offset = currentPage * itemsPerPage;
      const response = await fetch(`/api/orders?limit=${itemsPerPage}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        const ordersList = data.orders || [];
        setTotalOrders(data.total || 0);
        const mapped = ordersList.map((o: any) => ({
          id: `ORD-${o.id}`,
          prod: o.product_name,
          cust: 'Authentic Buyer',
          date: new Date(o.created_at).toLocaleDateString(),
          status: o.status === 'PAID' ? 'Processing' : o.status,
          price: `IDR ${Number(o.total_amount).toLocaleString()}`,
          qty: 1,
          total: `IDR ${Number(o.total_amount).toLocaleString()}`,
          review: null,
          image: o.product_image
        }));
        setOrders(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const displayOrders = orders.length > 0 ? orders : [];

  const filteredOrders = activeStatus 
    ? displayOrders.filter(order => order.status === activeStatus) 
    : displayOrders;

  const statuses = ['Processing', 'Shipped', 'Completed'];

  return (
    <div className="space-y-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
         <div className="space-y-2">
            <h1 className="text-5xl font-display font-black tracking-tighter uppercase leading-tight">Sales Records</h1>
            <p className="sleek-label opacity-40">Transaction ledger and fulfillment logistics</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
               <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
               <input type="text" placeholder="TX-HASH or ID" className="bg-white border border-gray-100 rounded-2xl py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-widest outline-none shadow-xl focus:ring-2 focus:ring-black placeholder:text-gray-200 w-full" />
            </div>
            <div className="flex items-center space-x-4 bg-white border border-gray-100 rounded-2xl px-6 py-2 shadow-xl">
               <Filter size={18} className="text-gray-400" />
               <select 
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer min-w-[100px]"
                 onChange={(e) => setActiveStatus(e.target.value === 'ALL' ? null : e.target.value)}
                 value={activeStatus || 'ALL'}
               >
                  <option value="ALL">All</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
         </div>
      </div>

      <div className="sleek-card border-none overflow-hidden bg-white shadow-2xl">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Entity</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Logistics Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredOrders.length > 0 ? filteredOrders.map(order => (
                 <tr 
                   key={order.id} 
                   onClick={() => setSelectedOrder(order)}
                   className="hover:bg-gray-50/50 transition-all cursor-pointer"
                 >
                    <td className="px-10 py-8 font-black font-mono text-[10px] tracking-widest text-black">{order.id}</td>
                    <td className="px-10 py-8 text-sm font-black uppercase tracking-tight">{order.prod}</td>
                    <td className="px-10 py-8 text-xs font-bold text-gray-400 uppercase tracking-widest">{order.cust}</td>
                    <td className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-300">{order.date}</td>
                    <td className="px-10 py-8">
                       <span className={cn(
                         "px-6 py-2 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm",
                         order.status === 'Completed' ? "bg-green-50 text-green-600" : "bg-black text-white"
                       )}>{order.status}</span>
                    </td>
                 </tr>
               )) : (
                 <tr>
                    <td colSpan={5} className="px-10 py-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                      No records found for this status
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>

      {/* Pagination */}
      {totalOrders > itemsPerPage && (
        <div className="flex justify-center items-center space-x-4 pt-8">
           <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
           >
              Prev
           </button>
           <div className="flex space-x-2">
              {[...Array(Math.ceil(totalOrders / itemsPerPage))].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    currentPage === i ? "bg-black text-white" : "bg-white border border-gray-100 hover:border-black"
                  )}
                >
                  {i + 1}
                </button>
              ))}
           </div>
           <button 
              disabled={currentPage >= Math.ceil(totalOrders / itemsPerPage) - 1}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 hover:border-black disabled:opacity-20 transition-all"
           >
              Next
           </button>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setSelectedOrder(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-2xl sleek-card border-none p-16 shadow-2xl space-y-12 bg-white max-h-[90vh] overflow-y-auto"
            >
               <div className="flex justify-between items-start pb-8 border-b border-gray-100">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Transaction Detail</p>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase">{selectedOrder.id}</h2>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-4 bg-gray-50 text-gray-400 hover:text-black rounded-2xl transition-all"><Plus size={32} className="rotate-45" /></button>
               </div>

               <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Product Name</p>
                     <p className="text-xl font-display font-black uppercase">{selectedOrder.prod}</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Customer Entity</p>
                     <p className="text-xl font-display font-black uppercase">{selectedOrder.cust}</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Order Timestamp</p>
                     <p className="text-xl font-display font-black uppercase">{selectedOrder.date}</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Logistics Status</p>
                     <p className="text-xl font-display font-black uppercase">{selectedOrder.status}</p>
                  </div>
               </div>

               <div className="p-8 bg-zinc-50 rounded-[2rem] space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span>Fulfillment Items</span>
                     <span>Qty 0{selectedOrder.qty}</span>
                  </div>
                  <div className="flex justify-between items-center font-display font-black text-2xl tracking-tighter uppercase border-t border-gray-200 pt-6">
                     <span>Total Valuation</span>
                     <span className="text-black">{selectedOrder.total}</span>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="flex items-center space-x-4">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Buyer Feedback</p>
                  </div>
                  {selectedOrder.review ? (
                    <div className="p-10 border border-gray-100 rounded-[2.5rem] bg-white space-y-8 shadow-sm">
                       <div className="flex justify-between items-start">
                          <div className="space-y-4">
                             <div className="flex items-center space-x-4">
                                <span className="text-lg font-display font-black uppercase tracking-tight">{selectedOrder.cust}</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md">Verified Purchase</span>
                             </div>
                             <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} className={cn(i < selectedOrder.review.rating ? "fill-black text-black" : "text-gray-100")} />
                                ))}
                             </div>
                          </div>
                          <span className="text-[10px] font-black text-gray-300 uppercase">{selectedOrder.review.date}</span>
                       </div>
                       <p className="text-sm font-bold leading-relaxed italic text-zinc-600">"{selectedOrder.review.comment}"</p>
                       <div className="flex items-center space-x-8 pt-8 border-t border-gray-50 text-gray-300">
                          <button className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">
                             <ThumbsUp size={16} />
                             <span>24</span>
                          </button>
                          <button className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">
                             <MessageSquare size={16} />
                             <span>Reply</span>
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="p-10 border-4 border-dashed border-gray-50 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest">Pending Review From Buyer</p>
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinanceSection() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [data, setData] = useState<any>({ liquidBalance: 0, pendingValuation: 0, ledger: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Extraction form state
  const [extractionForm, setExtractionForm] = useState({
    amount: '',
    bank: 'BCA CENTRAL ASIA',
    accountNumber: ''
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchFinanceData = () => {
    setIsLoading(true);
    fetch('/api/seller/finance')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleExtract = async () => {
    if (!extractionForm.amount || !extractionForm.accountNumber) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (Number(extractionForm.amount) > data.liquidBalance) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    setIsExtracting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/seller/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractionForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Funds successfully extracted' });
        setTimeout(() => {
          setShowWithdraw(false);
          setExtractionForm({ amount: '', bank: 'BCA CENTRAL ASIA', accountNumber: '' });
          setMessage(null);
          fetchFinanceData();
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to extract funds' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-center">
         <div className="space-y-2">
            <h1 className="text-5xl font-display font-black tracking-tighter uppercase leading-tight">Financial Hub</h1>
            <p className="sleek-label opacity-40">Wallet management and revenue extraction</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-zinc-900 rounded-[3rem] p-12 text-white space-y-10 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-10 transition-all group-hover:scale-110" />
            <div className="relative z-10 space-y-3">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Liquid Balance</p>
               <h2 className="text-6xl font-display font-black tracking-tighter">
                  IDR {Number(data.liquidBalance).toLocaleString('en-US')}
               </h2>
            </div>
            <div className="relative z-10 flex gap-6">
               <button 
                 onClick={() => setShowWithdraw(true)}
                 className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
               >
                 Extract Funds
               </button>
            </div>
         </div>

         <div className="sleek-card rounded-[3rem] p-12 border-none space-y-8 shadow-2xl bg-white">
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Pending Valuation</p>
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-300"><Lock size={20} /></div>
             </div>
             <div className="space-y-4">
                <h2 className="text-5xl font-display font-black tracking-tighter text-black">
                   IDR {Number(data.pendingValuation).toLocaleString('en-US')}
                </h2>
                <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-tight">Escrow holding active. Funds will unlock post-verification completion.</p>
             </div>
         </div>
      </div>

      <div className="sleek-card border-none p-12 space-y-10 bg-white shadow-2xl">
         <h2 className="text-2xl font-display font-black tracking-tight uppercase">Ledger History</h2>
         <div className="space-y-6">
            {data.ledger.length > 0 ? data.ledger.map((item: any) => (
               <div key={item.id} className="flex items-center justify-between p-8 border border-gray-50 rounded-[2rem] hover:bg-gray-50/50 transition-all group">
                  <div className="flex items-center space-x-6">
                     <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                        <Download size={24} className="rotate-180" />
                     </div>
                     <div className="space-y-1">
                        <p className="font-display font-black text-lg tracking-tight">IDR {Number(item.amount).toLocaleString()}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.type} • {item.entity} • {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-3 text-black">
                     <CheckCircle2 size={18} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                  </div>
               </div>
            )) : (
               <div className="text-center py-20 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  No transaction history recorded
               </div>
            )}
         </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setShowWithdraw(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-xl sleek-card border-none p-16 shadow-2xl space-y-12 bg-white"
            >
               <div className="flex justify-between items-center pb-8 border-b border-gray-100">
                  <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Valuation Extraction</h2>
                  <button onClick={() => setShowWithdraw(false)} className="p-4 bg-gray-50 text-gray-400 hover:text-black rounded-2xl transition-all"><Plus size={32} className="rotate-45" /></button>
               </div>
               
               <div className="p-10 bg-zinc-900 rounded-[2.5rem] text-white shadow-2xl">
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 mb-2">Liquid Balance</p>
                  <p className="text-5xl font-display font-black tracking-tighter">IDR {Number(data.liquidBalance).toLocaleString('en-US')}</p>
               </div>

               <div className="space-y-8">
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Extraction Amount</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">IDR</span>
                        <input 
                           type="number" 
                           placeholder="0" 
                           className="sleek-input pl-14" 
                           value={extractionForm.amount}
                           onChange={(e) => setExtractionForm(prev => ({ ...prev, amount: e.target.value }))}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Destination Entity (Bank)</label>
                     <select 
                        className="sleek-input bg-gray-50 appearance-none cursor-pointer"
                        value={extractionForm.bank}
                        onChange={(e) => setExtractionForm(prev => ({ ...prev, bank: e.target.value }))}
                     >
                        <option>BCA CENTRAL ASIA</option>
                        <option>MANDIRI FINANCIAL</option>
                        <option>BNI GLOBAL</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Account Number</label>
                     <input 
                        type="text" 
                        placeholder="1231 2321 3213" 
                        className="sleek-input" 
                        value={extractionForm.accountNumber}
                        onChange={(e) => setExtractionForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                     />
                  </div>

                  {message && (
                    <div className={cn(
                      "p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-center",
                      message.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {message.text}
                    </div>
                  )}
                  
                  <div className="p-6 bg-gray-50 rounded-[2rem] flex items-start space-x-4 border border-gray-100 border-dashed">
                     <AlertCircle className="text-black mt-0.5" size={20} />
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none">Processing Time: 1-3 Business Days</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Identity verification required for all large-scale extractions. Transaction validation in progress.</p>
                     </div>
                  </div>

                  <button 
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="sleek-button-primary w-full py-6 text-sm uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50"
                  >
                    {isExtracting ? 'Processing Extraction...' : 'Confirm secure extraction'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
