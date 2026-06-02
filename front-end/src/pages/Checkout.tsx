import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShieldCheck, Lock, Clock, Truck } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const PAYMENT_TIMEOUT_SECONDS = 900;
const PLATFORM_FEE = 50000; // Flat Rp 50.000 platform/service fee

type ShippingRate = {
  courier: string;
  service: string;
  estimated_days: string;
  price: number;
};

export default function Checkout() {
  const { cart, removeFromCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const selectedSize = searchParams.get('size') || 'M';

  const [product, setProduct] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping rates from API (REQ-F2-3 / Feature 4.5)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [isExpired, setIsExpired] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'e_wallet',
  });

  useEffect(() => {
    if (isSuccess || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, isExpired]);

  // items to checkout: either single product (from productId URL param) or all cart items
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);

  useEffect(() => {
    if (productId) {
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          const productsList = Array.isArray(data) ? data : data.products || [];
          const found = productsList.find((p: any) => p.id.toString() === productId);
          if (found) {
            setProduct(found);
            setCheckoutItems([{ ...found, size: selectedSize, cartId: null }]);
          }
        });
    } else if (cart.length > 0) {
      setProduct(cart[0]);
      setCheckoutItems(cart);
    }
  }, [productId, cart]);

  if (!product || checkoutItems.length === 0) return <div className="p-20 text-center uppercase font-black tracking-widest">Loading Secured Link...</div>;

  // Fetch shipping rates when postal code changes (REQ-F2-3 dummy logistics API)
  const fetchShippingRates = async (postalCode: string) => {
    if (postalCode.length !== 5) return;
    setLoadingRates(true);
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_postal_code: postalCode, weight_grams: 500 }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingRates(data.rates || []);
        if (data.rates && data.rates.length > 0) setSelectedRate(data.rates[0]);
      }
    } catch (e) {
      console.error('Failed to fetch shipping rates:', e);
    } finally {
      setLoadingRates(false);
    }
  };

  const subtotal = checkoutItems.reduce((sum, item) => sum + Number(item.price), 0);
  const shippingFee = selectedRate ? selectedRate.price : (shippingMethod === 'express' ? 50000 : 0);
  const serviceFee = PLATFORM_FEE; // Rp 50.000 platform fee (simulated gateway charge)
  const total = subtotal + shippingFee + serviceFee;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePayment = async () => {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter((f) => !formData[f as keyof typeof formData]);
    if (missingFields.length > 0) { setError('PLEASE FILL ALL MANDATORY FIELDS'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { setError('INVALID EMAIL FORMAT'); return; }
    if (formData.postalCode.length !== 5 || !/^\d+$/.test(formData.postalCode)) { setError('POSTAL CODE MUST BE 5 DIGITS'); return; }
    if (formData.phone.length < 10 || formData.phone.length > 13 || !/^\d+$/.test(formData.phone)) { setError('PHONE NUMBER MUST BE 10-13 DIGITS'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // ── Step 1: Create one order per item (SUBMITTED state, BR-1, REQ-F2-1) ─
      const orderIds: number[] = [];
      for (const item of checkoutItems) {
        const perItemTotal = Number(item.price) + Math.round(shippingFee / checkoutItems.length) + Math.round(serviceFee / checkoutItems.length);
        const orderRes = await fetch('/api/orders', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            product_id: item.id,
            total_amount: perItemTotal,
            size: item.size || selectedSize,
            payment_method: formData.paymentMethod,
          }),
        });
        if (!orderRes.ok) {
          const err = await orderRes.json();
          setError(err.error || `Failed to create order for ${item.name}`);
          return;
        }
        const order = await orderRes.json();
        orderIds.push(order.id);
      }

      // ── Step 2: Pay each order → PAID (escrow) ─────────────────────────────
      for (const orderId of orderIds) {
        const payRes = await fetch('/api/payment/process', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ order_id: orderId }),
        });
        if (!payRes.ok) {
          const err = await payRes.json();
          setError(err.error || 'Payment gateway error');
          return;
        }
      }

      // ── Step 3: Clear cart and show success ──────────────────────────────────
      if (productId) {
        const cartItem = cart.find((item) => item.id.toString() === productId.toString() && item.size === selectedSize);
        if (cartItem) removeFromCart(cartItem.cartId);
      } else {
        cart.forEach((item) => removeFromCart(item.cartId));
      }
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      setError('A connection error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="sleek-card p-16 max-w-lg text-center space-y-8 bg-white shadow-2xl">
          <div className="mx-auto w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <Clock size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Order Expired</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Payment window has closed. Your order has been automatically cancelled.
            </p>
          </div>
          <Link to="/listing" className="sleek-button-primary block py-6 uppercase tracking-widest">
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="sleek-card p-16 max-w-lg text-center space-y-8 bg-white shadow-2xl">
          <div className="mx-auto w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Payment Secured</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Your order has been placed and funds are in escrow.
            </p>
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
          {/* BR-3: Countdown timer */}
          <div className={cn(
            "ml-auto flex items-center space-x-2 px-4 py-2 rounded-xl font-mono font-black text-sm",
            timeLeft < 120 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
          )}>
            <Clock size={16} />
            <span>{formatTime(timeLeft)}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Contact Info */}
            <div className="sleek-card p-10 border-none space-y-8">
              <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">01</span>
                <span>Contact Information</span>
              </h2>
              <div className="space-y-2">
                <label className="sleek-label text-black">Email Address</label>
                <input type="email" placeholder="example@email.com" className="sleek-input"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Valid format: name@domain.com</p>
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
                  <input type="text" placeholder="First Name" className="sleek-input"
                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    maxLength={50} required />
                </div>
                <div className="space-y-2">
                  <label className="sleek-label text-black">Last Name</label>
                  <input type="text" placeholder="Last Name" className="sleek-input"
                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    maxLength={50} required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="sleek-label text-black">Street Address</label>
                  <input type="text" placeholder="Jl. Fashion No. 1" className="sleek-input"
                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="sleek-label text-black">Postal Code</label>
                  <input type="text" placeholder="12345" className="sleek-input"
                    value={formData.postalCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setFormData({ ...formData, postalCode: val });
                      if (val.length === 5) fetchShippingRates(val);
                    }}
                    pattern="[0-9]{5}" required />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Numeric only; 5 digits — shipping rates will load automatically</p>
                </div>
                <div className="space-y-2">
                  <label className="sleek-label text-black">Phone Number</label>
                  <input type="text" placeholder="0812XXXXXXXX" className="sleek-input"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    minLength={10} maxLength={13} pattern="[0-9]+" required />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">Numeric only; 10-13 digits</p>
                </div>
              </div>
            </div>

            {/* 3. Shipping Method — Real rates from dummy logistics API (Feature 4.5) */}
            <div className="sleek-card p-10 border-none space-y-8">
              <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">03</span>
                <span>Shipping Method</span>
              </h2>
              {!formData.postalCode || formData.postalCode.length < 5 ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <Truck size={14} /><span>Enter your postal code above to see available shipping options</span>
                </p>
              ) : loadingRates ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading shipping rates...</p>
              ) : shippingRates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingRates.map((rate, i) => (
                    <button key={i} onClick={() => setSelectedRate(rate)}
                      className={cn("flex flex-col items-start p-6 rounded-[1.5rem] border-2 transition-all text-left",
                        selectedRate?.courier === rate.courier && selectedRate?.service === rate.service
                          ? "border-black bg-white shadow-xl"
                          : "border-gray-100 bg-gray-50/50 hover:bg-white"
                      )}>
                      <div className="w-full flex justify-between items-center mb-4">
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          selectedRate?.courier === rate.courier && selectedRate?.service === rate.service ? "border-black" : "border-gray-200")}>
                          {selectedRate?.courier === rate.courier && selectedRate?.service === rate.service && <div className="w-3 h-3 bg-black rounded-full" />}
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">IDR {rate.price.toLocaleString()}</span>
                      </div>
                      <p className="font-black text-base uppercase tracking-tight">{rate.courier} {rate.service}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{rate.estimated_days} business days</p>
                    </button>
                  ))}
                </div>
              ) : (
                /* Fallback if API returns nothing — keep static options */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['standard', 'express'] as const).map((method) => (
                    <button key={method} onClick={() => { setShippingMethod(method); setSelectedRate(null); }}
                      className={cn("flex flex-col items-start p-6 rounded-[1.5rem] border-2 transition-all text-left",
                        shippingMethod === method ? "border-black bg-white shadow-xl" : "border-gray-100 bg-gray-50/50 hover:bg-white"
                      )}>
                      <div className="w-full flex justify-between items-center mb-4">
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", shippingMethod === method ? "border-black" : "border-gray-200")}>
                          {shippingMethod === method && <div className="w-3 h-3 bg-black rounded-full" />}
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">{method === 'standard' ? 'Free' : 'IDR 50.000'}</span>
                      </div>
                      <p className="font-black text-lg uppercase tracking-tight">{method === 'standard' ? 'Standard' : 'Express'}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{method === 'standard' ? '3-5 Business Days' : '1-2 Business Days'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Payment Method — TIDAK meminta data kartu langsung */}
            <div className="sleek-card p-10 border-none space-y-8">
              <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">04</span>
                <span>Payment Method</span>
              </h2>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                  🔒 Secure Payment — You will be redirected to our payment partner (Midtrans/Xendit) to complete payment safely. Your card details are never shared with Clovet.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { value: 'bank_transfer', label: 'Bank Transfer', desc: 'BCA, Mandiri, BNI, BRI' },
                  { value: 'e_wallet', label: 'E-Wallet', desc: 'GoPay, OVO, Dana, ShopeePay' },
                ] as const).map((method) => (
                  <button key={method.value} onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                    className={cn("flex flex-col items-start p-6 rounded-[1.5rem] border-2 transition-all text-left",
                      formData.paymentMethod === method.value ? "border-black bg-white shadow-xl" : "border-gray-100 bg-gray-50/50 hover:bg-white"
                    )}>
                    <div className="w-full flex justify-between items-center mb-2">
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === method.value ? "border-black" : "border-gray-200")}>
                        {formData.paymentMethod === method.value && <div className="w-3 h-3 bg-black rounded-full" />}
                      </div>
                    </div>
                    <p className="font-black text-base uppercase tracking-tight">{method.label}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="sleek-card p-10 border-none space-y-10 shadow-xl">
                <h2 className="text-xl font-display font-black flex items-center space-x-4 uppercase tracking-tight">
                  <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold">05</span>
                  <span>Order Review</span>
                </h2>
                <div className="space-y-10">
                  {/* All items in this order */}
                  <div className="space-y-4 pb-8 border-b border-gray-100">
                    {checkoutItems.map((item, idx) => (
                      <div key={item.cartId || item.id + '-' + idx} className="flex space-x-5">
                        <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1 py-1 flex-1 min-w-0">
                          <h4 className="font-black text-sm uppercase tracking-tight leading-tight truncate">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Size: {item.size || selectedSize}
                          </p>
                          <p className="font-black text-sm mt-1">IDR {Number(item.price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* REQ-F2-3: Full cost breakdown before payment */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Subtotal</span><span className="text-black">IDR {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Shipping {selectedRate ? `(${selectedRate.courier} ${selectedRate.service})` : ''}</span>
                      <span className="text-black">{shippingFee > 0 ? `IDR ${shippingFee.toLocaleString()}` : 'Free'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Platform Fee (Gateway)</span><span className="text-black">IDR {serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                      <span className="sleek-label text-black">Total Amount</span>
                      <span className="text-3xl font-display font-black tracking-tighter">IDR {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed">
                    <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider text-center">
                      Secure transaction: funds are held in escrow until verification is complete.
                    </p>
                  </div>

                  <button onClick={handlePayment} disabled={isProcessing}
                    className="sleek-button-authentic w-full py-6 flex items-center justify-center space-x-3 text-sm disabled:opacity-50">
                    <Lock size={16} />
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
