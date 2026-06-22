import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import { BasketProvider } from './context/BasketContext';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BasketDrawer from './components/BasketDrawer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import FloatingLanguageSwitcher from './components/FloatingLanguageSwitcher';
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
import AiStudio from './pages/admin/AiStudio';
import AdminCategories from './pages/admin/Categories';
import AdminTeam from './pages/admin/Team';
import AdminEmailTemplates from './pages/admin/EmailTemplates';
import AdminEmailBlast from './pages/admin/EmailBlast';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

// Page transition wrapper — slide+fade on route change
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

const PublicShell = ({ children }) => (
  <>
    <ScrollProgress />
    <Header />
    <main><PageTransition>{children}</PageTransition></main>
    <Footer />
    <BasketDrawer />
    <FloatingWhatsApp />
    <FloatingLanguageSwitcher />
  </>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicShell><Home /></PublicShell>} />
        <Route path="/products" element={<PublicShell><Products /></PublicShell>} />
        <Route path="/product/:slug" element={<PublicShell><ProductDetail /></PublicShell>} />
        <Route path="/category/:slug" element={<PublicShell><CategoryPage /></PublicShell>} />
        <Route path="/about" element={<PublicShell><About /></PublicShell>} />
        <Route path="/request-a-quote" element={<PublicShell><RequestQuote /></PublicShell>} />
        <Route path="/request-quote" element={<Navigate to="/request-a-quote" replace />} />
        <Route path="/quote" element={<Navigate to="/request-a-quote" replace />} />
        <Route path="/rfq" element={<Navigate to="/request-a-quote" replace />} />
        <Route path="/basket" element={<PublicShell><Basket /></PublicShell>} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="ai" element={<AiStudio />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="templates" element={<AdminEmailTemplates />} />
          <Route path="blast" element={<AdminEmailBlast />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <HelmetProvider>
      <SiteConfigProvider>
        <LanguageProvider>
          <BasketProvider>
            <AuthProvider>
              <div className="App bg-black text-white antialiased">
                <BrowserRouter>
                  <ScrollToTop />
                  <AnimatedRoutes />
                  <Toaster />
                </BrowserRouter>
              </div>
            </AuthProvider>
          </BasketProvider>
        </LanguageProvider>
      </SiteConfigProvider>
    </HelmetProvider>
  );
}

export default App;
