import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import { BasketProvider } from './context/BasketContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BasketDrawer from './components/BasketDrawer';
import { ScrollProgress } from './components/animations';
import { Toaster } from './components/ui/toaster';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import About from './pages/About';
import RequestQuote from './pages/RequestQuote';
import Basket from './pages/Basket';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminQuotes from './pages/admin/Quotes';
import AdminProducts from './pages/admin/Products';
import AdminCustomers from './pages/admin/Customers';
import AdminSettings from './pages/admin/Settings';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

const PublicShell = ({ children }) => (
  <>
    <ScrollProgress />
    <Header />
    <main>{children}</main>
    <Footer />
    <BasketDrawer />
  </>
);

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <BasketProvider>
          <AuthProvider>
            <div className="App bg-black text-white antialiased">
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<PublicShell><Home /></PublicShell>} />
                  <Route path="/products" element={<PublicShell><Products /></PublicShell>} />
                  <Route path="/product/:slug" element={<PublicShell><ProductDetail /></PublicShell>} />
                  <Route path="/category/:slug" element={<PublicShell><CategoryPage /></PublicShell>} />
                  <Route path="/about" element={<PublicShell><About /></PublicShell>} />
                  <Route path="/request-a-quote" element={<PublicShell><RequestQuote /></PublicShell>} />
                  <Route path="/basket" element={<PublicShell><Basket /></PublicShell>} />

                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="quotes" element={<AdminQuotes />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Routes>
                <Toaster />
              </BrowserRouter>
            </div>
          </AuthProvider>
        </BasketProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
