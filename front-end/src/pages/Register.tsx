import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    // Username validation: alphanumeric, 4-20 chars, no space
    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!usernameRegex.test(formData.username)) {
      newErrors.username = 'Username should contain alphanumeric, 4-20 characters, without spaces.';
    }

    // Name validation: alphabet & space, max 50
    const nameRegex = /^[A-Za-z\s]{1,50}$/;
    if (!nameRegex.test(formData.firstName)) {
      newErrors.firstName = 'First Name should contain only alphabet and spaces, max 50 characters.';
    }

    // Last Name is optional but if provided must follow same rules
    if (formData.lastName && !nameRegex.test(formData.lastName)) {
      newErrors.lastName = 'Last Name should contain only alphabet and spaces, max 50 characters.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email should contain a valid email address (e.g. name@domain.com).';
    }

    // Phone validation: numeric 10-13 digits (based on SRS Page 8)
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone Number should contain numeric characters and be between 10-13 digits.';
    }

    // Password validation: min 8, uppercase, number, symbol
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password should contain at least 8 characters, including an uppercase letter, a number, and a symbol.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => { throw new Error(data.error || 'Registration failed'); });
      }
      return res.json();
    })
    .then(data => {
      login(data);
      navigate('/profile');
    })
    .catch(err => {
      setErrors({ global: err.message });
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl sleek-card border-none p-12 space-y-12"
      >
        <div className="text-center space-y-4">
          <Link to="/" className="text-4xl font-display font-black italic tracking-tighter text-black uppercase leading-none">CLOVET</Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-black tracking-tighter uppercase leading-tight">Create Account</h1>
            <p className="sleek-label opacity-40">Join the exclusive fashion network</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
                <label className="sleek-label text-black">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="username"
                    placeholder="clovet_user" 
                    className="sleek-input pl-12" 
                    value={formData.username}
                    onChange={handleChange}
                    minLength={4}
                    maxLength={20}
                    pattern="[a-zA-Z0-9]+"
                    required
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.username ? <span className="text-red-500">{errors.username}</span> : "Alphanumeric, min 4 - max 20 characters, no spaces"}
                </p>
            </div>
            <div className="space-y-2">
                <label className="sleek-label text-black">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="firstName"
                    placeholder="John" 
                    className="sleek-input pl-12" 
                    value={formData.firstName}
                    onChange={handleChange}
                    maxLength={50}
                    pattern="[A-Za-z\s]+"
                    required
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.firstName ? <span className="text-red-500">{errors.firstName}</span> : "Letters & spaces only, max 50 characters"}
                </p>
            </div>
            <div className="space-y-2">
                <label className="sleek-label text-black">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="lastName"
                    placeholder="Doe" 
                    className="sleek-input pl-12" 
                    value={formData.lastName}
                    onChange={handleChange}
                    maxLength={50}
                    pattern="[A-Za-z\s]+"
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.lastName ? <span className="text-red-500">{errors.lastName}</span> : "Letters & spaces only, max 50 characters; optional"}
                </p>
            </div>
            <div className="md:col-span-2 space-y-2">
                <label className="sleek-label text-black">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="john@example.com" 
                    className="sleek-input pl-12" 
                    value={formData.email}
                    onChange={handleChange}
                    pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                    required
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.email ? <span className="text-red-500">{errors.email}</span> : "Valid format: name@domain.com"}
                </p>
            </div>
            <div className="md:col-span-2 space-y-2">
                <label className="sleek-label text-black">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="phone"
                    placeholder="0812XXXXXXXX" 
                    className="sleek-input pl-12" 
                    value={formData.phone}
                    onChange={handleChange}
                    minLength={10}
                    maxLength={15}
                    pattern="[0-9]+"
                    required
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.phone ? <span className="text-red-500">{errors.phone}</span> : "Numeric only; 10-13 digits"}
                </p>
            </div>
            <div className="space-y-2">
                <label className="sleek-label text-black">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="••••••••" 
                    className="sleek-input pl-12 pr-12" 
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.password ? <span className="text-red-500">{errors.password}</span> : "Min 8 characters, including uppercase, number, and symbol"}
                </p>
            </div>
            <div className="space-y-2">
                <label className="sleek-label text-black">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    placeholder="••••••••" 
                    className="sleek-input pl-12 pr-12" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-400">
                  {errors.confirmPassword ? <span className="text-red-500">{errors.confirmPassword}</span> : "Must match password"}
                </p>
            </div>
          </div>

          <div className="space-y-8 pt-4">
            {errors.global && (
              <p className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                {errors.global}
              </p>
            )}
            <button type="submit" className="sleek-button-primary w-full py-5 text-sm uppercase tracking-widest">
              Register Identity
            </button>
            <p className="text-center text-xs font-bold text-gray-400">Already a member? <Link to="/login" className="text-black font-black uppercase hover:underline ml-2">Log in</Link></p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
