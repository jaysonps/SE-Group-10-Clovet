import React, { useState } from 'react';
import { 
  ChevronLeft, 
  CreditCard, 
  Plus, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';

const PRODUCTS: Record<string, any> = {
  '1': { id: '1', name: 'Green T-Shirt', brand: 'Clovet', price: 150000, image: '/src/assets/tops1.PNG' },
  '2': { id: '2', name: 'Colorblock Polo', brand: 'Clovet', price: 170000, image: '/src/assets/tops2.PNG' },
  '3': { id: '3', name: 'Black Cropped Tee', brand: 'Clovet', price: 120000, image: '/src/assets/tops3.PNG' },
  '4': { id: '4', name: 'Graphic Red T-Shirt', brand: 'Clovet', price: 195000, image: '/src/assets/Graphic Red T-shirts.PNG' },
  '5': { id: '5', name: 'Black Cargo Pants', brand: 'Clovet', price: 350000, image: '/src/assets/bottoms1.PNG' },
};

export default function Checkout() {
  const { cart, removeFromCart } = useCart();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const selectedSize = searchParams.get('size') || 'M';
  const [product, setProduct] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  React.useEffect(() => {
    if (productId) {
      fetch(`/api/products`)
        .then(res => res.json())
        .then(data => {
          const productsList = Array.isArray(data) ? data : (data.products || []);
          const found = productsList.find((p: any) => p.id.toString() === productId);
          setProduct(found || PRODUCTS['1']);
        });
    } else if (cart.length > 0) {
      // If no productId but cart has items, use the first one for the summary (simplification)
      // or we could show multiple. For now let's stick to the UI design.
      setProduct(cart[0]);
    } else {
      setProduct(PRODUCTS['1']);
    }
  }, [productId, cart]);

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  if (!product) return <div className="p-20 text-center uppercase font-black tracking-widest">Loading Secured Link...</div>;

  const subtotal = Number(product.price);
  const shippingFee = shippingMethod === 'express' ? 50000 : 0;
  const serviceFee = 10000;
  const total = subtotal + shippingFee + serviceFee;

  const handlePayment = async () => {
    // 1. Mandatory Fields Check
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'postalCode', 'phone', 'cardNumber', 'expiry', 'cvv'];
    const missingFields = requiredFields.filter(f => !formData[f as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError('PLEASE FILL ALL MANDATORY FIELDS');
      return;
    }

    // 2. Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('INVALID EMAIL FORMAT');
      return;
    }

    if (formData.postalCode.length !== 5 || !/^\d+$/.test(formData.postalCode)) {
      setError('POSTAL CODE MUST BE 5 DIGITS');
      return;
    }

    if (formData.phone.length < 10 || formData.phone.length > 13 || !/^\d+$/.test(formData.phone)) {
      setError('PHONE NUMBER MUST BE 10-13 DIGITS');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          total_amount: total,
          size: selectedSize
        })
      });

      if (response.ok) {
        // Success: Remove from cart
        if (productId) {
          const cartItem = cart.find(item => item.id.toString() === productId.toString() && item.size === selectedSize);
          if (cartItem) {
            removeFromCart(cartItem.cartId);
          }
        } else {
          // If checking out "from cart" generally, clear related items
          cart.forEach(item => removeFromCart(item.cartId));
        }
        setIsSuccess(true);
      } else {
        const err = await response.json();
        setError(err.error || 'Payment failed');
      }
    } catch (e) {
      console.error(e);
      setError('A connection error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="sleek-card p-16 max-w-lg text-center space-y-8 bg-white shadow-2xl">
           <div className="mx-auto w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
             <ShieldCheck size={48} />
           </div>
           <div className="space-y-2">
             <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Payment Secured</h2>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your order has been placed and funds are in escrow.</p>
           </div>
           <div className="p-8 bg-zinc-50 rounded-2xl text-left border border-gray-100">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Verification Flow</p>
             <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">
               The seller will ship the item to our authentication hub. You can monitor the status in your profile.
             </p>
           </div>
           <Link to="/listing" className="sleek-button-primary block py-6 uppercase tracking-widest">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-screen pb-32">
      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-7xl">
        <div className="flex items-center space-x-6 mb-16">
          <Link to="/" className="p-4 bg-white rounded-2xl text-black hover:bg-gray-50 transition-all shadow-sm border border-gray-100">
            <ChevronLeft size={24} />
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-black tracking-tighter uppercase">Secure Checkout</h1>
            <p className="sleek-label opacity-40">Review and complete your exclusive purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Form */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Contact Info */}
            <div className="sleek-card p-10 border-none space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                   <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">01</span>
                   <span>Contact Information</span>
                 </h2>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="sleek-label text-black">Email Address</label>
                    <input 
                       type="email" 
                       placeholder="example@email.com" 
                       className="sleek-input" 
                       value={formData.email}
                       onChange={e => setFormData({ ...formData, email: e.target.value })}
                       required 
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Valid format: name@domain.com</p>
                 </div>
                 <div className="flex items-center space-x-3">
                   <input type="checkbox" id="news" className="w-5 h-5 rounded-lg border-gray-200 text-black focus:ring-black cursor-pointer" />
                   <label htmlFor="news" className="text-sm font-bold text-gray-500 cursor-pointer select-none">Keep me updated on exclusive drops and offers</label>
                 </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="sleek-card p-10 border-none space-y-8">
               <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                 <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">02</span>
                 <span>Shipping Address</span>
               </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="sleek-label text-black">First Name</label>
                     <input 
                       type="text" 
                       placeholder="First Name" 
                       className="sleek-input" 
                       value={formData.firstName}
                       onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                       maxLength={50} pattern="[A-Za-z\s]+" required 
                     />
                     <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Letters & spaces only, max 50 characters</p>
                  </div>
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Last Name</label>
                     <input 
                       type="text" 
                       placeholder="Last Name" 
                       className="sleek-input" 
                       value={formData.lastName}
                       onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                       maxLength={50} pattern="[A-Za-z\s]+" required 
                     />
                     <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Letters & spaces only, max 50 characters</p>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="sleek-label text-black">Street Address</label>
                     <input 
                       type="text" 
                       placeholder="123 Fashion Ave, Suite 100" 
                       className="sleek-input" 
                       value={formData.address}
                       onChange={e => setFormData({ ...formData, address: e.target.value })}
                       required 
                     />
                     <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Complete shipping address</p>
                  </div>
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Postal Code</label>
                     <input 
                       type="text" 
                       placeholder="12345" 
                       className="sleek-input" 
                       value={formData.postalCode}
                       onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                       pattern="[0-9]{5}" required 
                     />
                     <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Numeric only; 5 digits</p>
                  </div>
                  <div className="space-y-2">
                     <label className="sleek-label text-black">Phone Number</label>
                     <input 
                       type="text" 
                       placeholder="0812XXXXXXXX" 
                       className="sleek-input" 
                       value={formData.phone}
                       onChange={e => setFormData({ ...formData, phone: e.target.value })}
                       minLength={10} maxLength={13} pattern="[0-9]+" required 
                     />
                     <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Numeric only; 10-13 digits</p>
                  </div>
                </div>
            </div>

            {/* 3. Shipping Method */}
            <div className="sleek-card p-10 border-none space-y-8">
               <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                 <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">03</span>
                 <span>Shipping Method</span>
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShippingMethod('standard')}
                    className={cn(
                      "flex flex-col items-start p-6 rounded-[1.5rem] border-2 transition-all text-left",
                      shippingMethod === 'standard' ? "border-black bg-white shadow-xl" : "border-gray-100 bg-gray-50/50 hover:bg-white"
                    )}
                  >
                    <div className="w-full flex justify-between items-center mb-4">
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", shippingMethod === 'standard' ? "border-black" : "border-gray-200")}>
                        {shippingMethod === 'standard' && <div className="w-3 h-3 bg-black rounded-full" />}
                      </div>
                      <span className="font-black text-sm uppercase tracking-widest">Free</span>
                    </div>
                    <p className="font-black text-lg uppercase tracking-tight">Standard</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">3-5 Business Days</p>
                  </button>
                  <button 
                    onClick={() => setShippingMethod('express')}
                    className={cn(
                      "flex flex-col items-start p-6 rounded-[1.5rem] border-2 transition-all text-left",
                      shippingMethod === 'express' ? "border-black bg-white shadow-xl" : "border-gray-100 bg-gray-50/50 hover:bg-white"
                    )}
                  >
                    <div className="w-full flex justify-between items-center mb-4">
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", shippingMethod === 'express' ? "border-black" : "border-gray-200")}>
                        {shippingMethod === 'express' && <div className="w-3 h-3 bg-black rounded-full" />}
                      </div>
                      <span className="font-black text-sm uppercase tracking-widest">IDR 50.000</span>
                    </div>
                    <p className="font-black text-lg uppercase tracking-tight">Express</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">1-2 Business Days</p>
                  </button>
               </div>
            </div>

            {/* 4. Payment */}
            <div className="sleek-card p-10 border-none space-y-8">
               <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                 <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">04</span>
                 <span>Payment Details</span>
               </h2>
               <div className="p-8 bg-zinc-900 rounded-[2rem] flex items-center justify-between text-white mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <CreditCard size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Amount to secure</p>
                      <p className="text-2xl font-display font-black tracking-tight">IDR {total.toLocaleString()}</p>
                    </div>
                  </div>
                  <Lock size={20} className="text-white/20" />
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="sleek-label text-black">Card Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="XXXX XXXX XXXX XXXX" 
                        className="sleek-input pr-12" 
                        value={formData.cardNumber}
                        onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
                        required pattern="[0-9\s]{16,22}" 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 py-1 px-2 bg-gray-200 rounded text-[8px] font-black uppercase tracking-widest text-gray-500">Secure</div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">16 digits</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="sleek-label text-black">Expiration</label>
                       <input 
                         type="text" 
                         placeholder="MM / YY" 
                         className="sleek-input" 
                         value={formData.expiry}
                         onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                         required pattern="[0-9]{2}\s?/\s?[0-9]{2}" 
                       />
                       <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">MM / YY format</p>
                    </div>
                    <div className="space-y-2">
                       <label className="sleek-label text-black">CVV</label>
                       <input 
                         type="password" 
                         placeholder="***" 
                         className="sleek-input" 
                         value={formData.cvv}
                         onChange={e => setFormData({ ...formData, cvv: e.target.value })}
                         required pattern="[0-9]{3}" 
                       />
                       <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">3 digits</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar: Order Review */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="sleek-card p-10 border-none space-y-10 shadow-xl">
                 <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                   <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">05</span>
                   <span>Order Review</span>
                 </h2>
                 
                 <div className="space-y-10">
                    <div className="pb-8 border-b border-gray-100">
                       <div className="flex space-x-6">
                         <div className="w-24 h-24 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                            <img src={product.image} alt="Item" className="w-full h-full object-cover" />
                         </div>
                         <div className="space-y-1 py-1">
                            <h4 className="font-black text-lg uppercase tracking-tight leading-tight">{product.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Brand: {product.brand || 'Clovet'} • Size: {selectedSize}</p>
                            <p className="font-black text-lg mt-2">IDR {subtotal.toLocaleString()}</p>
                         </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>Subtotal</span>
                          <span className="text-black">IDR {subtotal.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>Shipping</span>
                          <span className="text-black">{shippingFee > 0 ? `IDR ${shippingFee.toLocaleString()}` : 'Free'}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>Service Fee</span>
                          <span className="text-black">IDR {serviceFee.toLocaleString()}</span>
                       </div>
                       <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                          <span className="sleek-label text-black">Total Amount</span>
                          <span className="text-3xl font-display font-black tracking-tighter">IDR {total.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed">
                      <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider text-center">
                        Secure transaction protection: funds are held in escrow until verification is complete.
                      </p>
                    </div>

                    <button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="sleek-button-authentic w-full py-6 flex items-center justify-center space-x-3 text-sm disabled:opacity-50"
                    >
                       <span>{isProcessing ? 'Processing...' : `Pay IDR ${total.toLocaleString()}`}</span>
                    </button>
                    
                    {error && (
                      <p className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                        {error}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-center space-x-3 opacity-30">
                       <ShieldCheck size={20} />
                       <span className="text-[10px] font-black uppercase tracking-widest">100% Encrypted Payment</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
