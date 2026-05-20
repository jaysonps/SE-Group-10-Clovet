/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import ProductReviews from './pages/ProductReviews';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function RoleBasedRoute({ children, allowedRole, requireAuth }: { children: React.ReactNode, allowedRole: 'customer' | 'seller' | 'verifier', requireAuth?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (allowedRole === 'customer' && !requireAuth) return <>{children}</>;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.email.toLowerCase().includes('seller') ? 'seller' : 
                   user.email.toLowerCase().includes('verifier') ? 'verifier' : 'customer';

  if (allowedRole === 'customer' && userRole !== 'customer') {
    return <Navigate to={userRole === 'seller' ? '/seller' : '/verifier'} replace />;
  }

  if (allowedRole !== 'customer' && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProfileRoute() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Profile /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          
          <main className="flex-1">
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<RoleBasedRoute allowedRole="customer"><Home /></RoleBasedRoute>} />
              <Route path="/listing" element={<RoleBasedRoute allowedRole="customer"><ProductListing /></RoleBasedRoute>} />
              <Route path="/cart" element={<RoleBasedRoute allowedRole="customer"><Cart /></RoleBasedRoute>} />
              <Route path="/product/:id" element={<RoleBasedRoute allowedRole="customer"><ProductDetail /></RoleBasedRoute>} />
              <Route path="/product/:id/reviews" element={<RoleBasedRoute allowedRole="customer"><ProductReviews /></RoleBasedRoute>} />
              <Route path="/checkout" element={<RoleBasedRoute allowedRole="customer" requireAuth={true}><Checkout /></RoleBasedRoute>} />
              <Route path="/profile" element={<ProfileRoute />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Role Based Dashboards */}
              <Route path="/seller/*" element={<RoleBasedRoute allowedRole="seller"><SellerDashboard /></RoleBasedRoute>} />
              <Route path="/verifier/*" element={<RoleBasedRoute allowedRole="verifier"><VerifierDashboard /></RoleBasedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
