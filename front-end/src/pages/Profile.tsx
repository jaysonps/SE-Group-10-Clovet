import React, { useState } from 'react';
import { User, Lock, ShoppingBag, LogOut, Camera, Star, ChevronRight, X, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ORDERS = [
  { 
    id: 'ORD-001', 
    date: '13 May 2026', 
    status: 'Verified & Shipping', 
    reviewed: false,
    items: [
      { 
        name: 'Green Essentials T-Shirt', 
        price: 150000, 
        size: 'L', 
        condition: 'Brand New', 
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=90' 
      }
    ]
  },
  {
    id: 'ORD-002',
    date: '14 May 2026',
    status: 'Delivered',
    reviewed: false,
    items: [
      { 
        name: 'Graphic Red T-Shirt', 
        price: 190000, 
        size: 'M', 
        condition: 'Brand New', 
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=90' 
      },
      { 
        name: 'Black Cropped Tee', 
        price: 120000, 
        size: 'S', 
        condition: 'Used', 
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=90' 
      }
    ]
  }
];

export default function Profile() {
  const { logout, user, login } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'orders'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [username, setUsername] = useState(user?.username || 'customer');
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || 'customer');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ')[1] || '');
  const [email, setEmail] = useState(user?.email || 'customer@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [notification, setNotification] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' }>({ message: '', visible: false });
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Sync with DB on mount and when tab changes to profile
  React.useEffect(() => {
    if (user?.id) {
       fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUsername(data.username || '');
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            // Update context if DB has newer data
            const updatedUser = { ...user, ...data, name: `${data.firstName} ${data.lastName}`.trim() };
            if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
               login(updatedUser);
            }
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (activeTab === 'orders') {
      fetch('/api/orders?limit=100')
        .then(res => res.json())
        .then(data => {
          const ordersList = data.orders || [];
          const mapped = ordersList.map((o: any) => ({
            id: `ORD-${o.id}`,
            date: new Date(o.created_at).toLocaleDateString(),
            status: o.status,
            reviewed: false,
            items: [{
              name: o.product_name,
              price: Number(o.total_amount),
              size: 'M', 
              condition: 'Verified',
              image: o.product_image
            }]
          }));
          setDbOrders(mapped);
          setIsLoadingOrders(false);
        })
        .catch(() => setIsLoadingOrders(false));
    }
  }, [activeTab]);

  const [avatar, setAvatar] = useState(user?.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=90");
  const profileFileInputRef = React.useRef<HTMLInputElement>(null);

  const displayOrders = dbOrders.length > 0 ? dbOrders : ORDERS;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Image validation based on SRS Page 25
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        triggerNotification('File format must be an image (JPEG, JPG, or PNG)');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        triggerNotification('Maximum file size is 5MB');
        return;
      }

      console.log('Avatar File selected:', file);
      const url = URL.createObjectURL(file);
      setAvatar(url);
    }
  };

  const userRole = user?.email.toLowerCase().includes('seller') ? 'seller' : 
                   user?.email.toLowerCase().includes('verifier') ? 'verifier' : 'customer';
  const isCustomer = userRole === 'customer';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePublishReview = () => {
    setShowReviewModal(false);
    setRating(0);
    setReview('');
    triggerNotification('Review published successfully!');
  };

  const openReviewModal = (order: any) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const triggerNotification = (message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => setNotification({ message, visible: false }), 3000);
  };

  const handlePasswordChange = () => {
    triggerNotification('Credentials Rotated Successfully');
  };

  const handleProfileUpdate = async () => {
    const newErrors: Record<string, string> = {};
    
    // Username validation based on SRS Page 10/25
    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!username || !usernameRegex.test(username)) {
      newErrors.username = 'Username should contain alphanumeric, 4-20 characters, without spaces';
    }

    const nameRegex = /^[A-Za-z\s]{1,50}$/;
    if (!firstName || !nameRegex.test(firstName)) {
      newErrors.firstName = 'First Name should contain only alphabet and spaces, max 50 characters';
    }
    if (lastName && !nameRegex.test(lastName)) {
      newErrors.lastName = 'Last Name should contain only alphabet and spaces, max 50 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Email should contain a valid email address (e.g. name@domain.com)';
    }

    // Phone validation based on SRS Page 8 (10-13 digits)
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phone || !phoneRegex.test(phone)) {
      newErrors.phone = 'Phone Number should contain numeric characters and be between 10-13 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          firstName,
          lastName,
          email,
          phone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      login({ ...user, ...updatedData, name: `${updatedData.firstName} ${updatedData.lastName}`.trim() });
      triggerNotification('Profile updated successfully');
    } catch (error) {
       console.error('Update profile error:', error);
       triggerNotification('Failed to update profile. Please check your connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-bg-main min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          <aside className="lg:col-span-1 space-y-8">
            <div className="sleek-card p-10 border-none space-y-10 shadow-xl bg-white">
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-32 h-32 rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 shadow-inner">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-black tracking-tighter uppercase">{user?.name || 'Cust001'}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{user?.email || 'cust001@gmail.com'}</p>
                  </div>
               </div>
               
                <nav className="space-y-2 pt-6">
                  {/* Back Button */}
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 transition-all border border-transparent mb-4"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                  </button>

                  {/* Common Items */}
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                      "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                      activeTab === 'profile' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <User size={18} />
                      <span>Personal Profile</span>
                    </div>
                  </button>

                  {isCustomer && (
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className={cn(
                        "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                        activeTab === 'orders' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <ShoppingBag size={18} />
                        <span>Order Status</span>
                      </div>
                    </button>
                  )}

                  <button 
                    onClick={() => setActiveTab('password')}
                    className={cn(
                      "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", 
                      activeTab === 'password' ? "bg-authentic text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <Lock size={18} />
                      <span>Reset Password</span>
                    </div>
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 mt-8"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
               </nav>
            </div>
          </aside>

          <main className="lg:col-span-3">
             <div className="sleek-card p-12 border-none shadow-2xl min-h-[700px] bg-white">
                {activeTab === 'profile' && (
                  <div className="space-y-12">
                      <div className="flex justify-between items-end">
                        <div className="space-y-2">
                          <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-tight">Personal Profile</h1>
                          <p className="sleek-label opacity-40">Manage your account details and information</p>
                        </div>
                      </div>
                    
                    <div className="flex flex-col items-center lg:flex-row lg:items-start gap-16 pt-8">
                       <div 
                         onClick={() => profileFileInputRef.current?.click()}
                         className="relative group cursor-pointer flex-shrink-0"
                       >
                          <input 
                            type="file" 
                            ref={profileFileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleAvatarUpload} 
                          />
                          <div className="w-56 h-56 rounded-[3rem] overflow-hidden bg-gray-50 border-8 border-white shadow-2xl transition-transform group-hover:scale-105">
                             <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute inset-x-2 inset-y-2 bg-black/60 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                             <Camera className="text-white" size={40} />
                          </div>
                          <button className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-6 flex items-center justify-center space-x-2 w-full hover:opacity-100 opacity-40 transition-opacity">
                             <span>Update Photo</span>
                          </button>
                       </div>

                       <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-2 md:col-span-2">
                             <label className="sleek-label text-black">Username</label>
                             <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="sleek-input" minLength={4} maxLength={20} pattern="[a-zA-Z0-9]+" />
                             <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                               {errors.username ? <span className="text-red-500">{errors.username}</span> : "Alphanumeric, min 4 - max 20 characters, no spaces"}
                             </p>
                          </div>
                          <div className="space-y-2">
                             <label className="sleek-label text-black">First Name</label>
                             <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="sleek-input" maxLength={50} pattern="[A-Za-z\s]+" />
                             <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                               {errors.firstName ? <span className="text-red-500">{errors.firstName}</span> : "Letters & spaces only, max 50 characters"}
                             </p>
                          </div>
                          <div className="space-y-2">
                             <label className="sleek-label text-black">Last Name</label>
                             <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your last name" className="sleek-input" maxLength={50} pattern="[A-Za-z\s]+" />
                             <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                               {errors.lastName ? <span className="text-red-500">{errors.lastName}</span> : "Letters & spaces only, max 50 characters; optional"}
                             </p>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="sleek-label text-black">Email</label>
                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="sleek-input" />
                             <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                               {errors.email ? <span className="text-red-500">{errors.email}</span> : "Valid format: name@domain.com"}
                             </p>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="sleek-label text-black">Phone Number</label>
                             <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812XXXXXXXX" className="sleek-input" minLength={10} maxLength={15} pattern="[0-9]+" />
                             <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                               {errors.phone ? <span className="text-red-500">{errors.phone}</span> : "Numeric only; 10-13 digits"}
                             </p>
                          </div>
                          <div className="md:col-span-2 pt-8">
                             <button 
                               onClick={handleProfileUpdate}
                               className="sleek-button-authentic px-12 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest"
                             >
                                {isUpdating ? 'Updating...' : 'Submit'}
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'password' && (
                  <div className="space-y-12">
                    <div className="space-y-2">
                      <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-tight">Reset Password</h1>
                      <p className="sleek-label opacity-40">Encryption and password management</p>
                    </div>
                    <div className="max-w-md space-y-8 pt-8">
                      <div className="space-y-2">
                         <label className="sleek-label text-black">Current Password</label>
                         <div className="relative">
                           <input 
                             type={showCurrentPassword ? "text" : "password"} 
                             placeholder="••••••••"  
                             className="sleek-input pr-12" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                           >
                             {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="sleek-label text-black">New Password</label>
                         <div className="relative">
                           <input 
                             type={showNewPassword ? "text" : "password"} 
                             placeholder="••••••••"  
                             className="sleek-input pr-12" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowNewPassword(!showNewPassword)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                           >
                             {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="sleek-label text-black">Confirm New Password</label>
                         <div className="relative">
                           <input 
                             type={showConfirmNewPassword ? "text" : "password"} 
                             placeholder="••••••••"  
                             className="sleek-input pr-12" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                           >
                             {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                         </div>
                      </div>
                      <div className="pt-4">
                         <button 
                          onClick={handlePasswordChange}
                          className="sleek-button-primary px-12 py-5 text-sm uppercase tracking-widest w-full md:w-auto"
                         >
                           Update Password
                         </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                   <div className="space-y-12">
                    <div className="space-y-2">
                      <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-tight">Order Status</h1>
                      <p className="sleek-label opacity-40">Purchase records and verification status</p>
                    </div>
                    <div className="space-y-10 pt-8">
                       {displayOrders.map(order => {
                         const orderTotal = order.items.reduce((sum, item) => sum + item.price, 0);
                         return (
                           <div key={order.id} className="sleek-card p-10 border-gray-100 space-y-10 group hover:border-black transition-all bg-white overflow-hidden relative">
                              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-50 pb-8">
                                 <div className="space-y-2">
                                    <div className="flex items-center space-x-3 opacity-30">
                                       <span className="text-[10px] font-black uppercase tracking-widest">{order.id}</span>
                                       <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                       <span className="text-[10px] font-black uppercase tracking-widest">{order.date}</span>
                                    </div>
                                    <h3 className="text-3xl font-display font-black tracking-tighter uppercase leading-tight">Order Details</h3>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                                    <p className="text-3xl font-display font-black tracking-tighter">IDR {orderTotal.toLocaleString()}</p>
                                 </div>
                              </div>

                              <div className="space-y-8">
                                 {order.items.map((item, idx) => (
                                   <div key={idx} className="flex gap-8 items-center group/item">
                                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                         <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover/item:scale-110" />
                                      </div>
                                      <div className="flex-1 space-y-1">
                                         <div className="flex justify-between items-start">
                                            <h4 className="font-display font-black text-xl tracking-tight uppercase leading-none">{item.name}</h4>
                                            <p className="font-display font-black tracking-tighter text-lg">IDR {item.price.toLocaleString()}</p>
                                         </div>
                                         <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                               <div className="flex items-center space-x-2">
                                                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Size</span>
                                                  <span className="px-2 py-0.5 bg-gray-50 rounded-md text-[9px] font-black">{item.size}</span>
                                               </div>
                                               <div className="flex items-center space-x-2">
                                                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Condition</span>
                                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase">{item.condition}</span>
                                               </div>
                                            </div>
                                            <button 
                                              onClick={() => openReviewModal(item)}
                                              className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-black transition-colors"
                                            >
                                              Give Review
                                            </button>
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                              </div>

                              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-gray-50">
                                 <div className="flex items-center space-x-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                    <div className={cn(
                                      "inline-flex px-6 py-2 text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg",
                                      order.status === 'Delivered' ? "bg-black text-white" : "bg-emerald-500 text-white"
                                    )}>
                                      {order.status}
                                    </div>
                                 </div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                   </div>
                )}
             </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-8 py-4 rounded-2xl flex items-center space-x-4 shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
               <CheckCircle size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">{notification.message}</p>
          </motion.div>
        )}

        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] p-12 overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-12">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500">
                    <Star size={40} fill="currentColor" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Write Your Review</h2>
                    <p className="sleek-label opacity-40">Your feedback helps the community grow</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <button
                        key={index}
                        onClick={() => setRating(index)}
                        onMouseEnter={() => setHover(index)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          size={48} 
                          className={cn(
                            "transition-colors",
                            (hover || rating) >= index ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <label className="sleek-label text-black">Your thoughts on the product</label>
                    <textarea 
                      placeholder="Was the quality as expected? How was the fit?"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className="w-full min-h-[150px] bg-gray-50 rounded-3xl p-8 outline-none focus:ring-4 focus:ring-black/5 transition-all text-sm font-medium border border-gray-100 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowReviewModal(false)}
                      className="sleek-button-secondary py-5 text-sm uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePublishReview}
                      disabled={!rating || !review}
                      className="sleek-button-primary py-5 text-sm uppercase tracking-widest disabled:opacity-20"
                    >
                      Publish Review
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
