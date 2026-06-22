import React from 'react';
import { Link, NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Package, Users, Settings, LogOut, ExternalLink, Sparkles, Layers, Shield, Mail, Megaphone } from 'lucide-react';
import Logo from '../../components/Logo';
import { useLang } from '../../context/LanguageContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;

  const link = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-l-2 border-transparent'}`;

  return (
    <div className="min-h-screen bg-black flex">
      <aside className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950 flex flex-col">
        <div className="p-5 border-b border-neutral-900">
          <Logo />
          <div className="mt-3 text-[11px] tracking-widest uppercase text-orange-500">Owner Panel</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <NavLink to="/admin" end className={link}><LayoutDashboard className="w-4 h-4" /> {t('admin.dashboard')}</NavLink>
          <NavLink to="/admin/ai" className={link} data-testid="admin-nav-ai">
            <Sparkles className="w-4 h-4" /> AI Studio
            <span className="ml-auto text-[9px] tracking-widest text-orange-500 border border-orange-500/40 px-1.5 py-0.5">NEW</span>
          </NavLink>
          <NavLink to="/admin/quotes" className={link}><FileText className="w-4 h-4" /> {t('admin.quotes')}</NavLink>
          <NavLink to="/admin/products" className={link}><Package className="w-4 h-4" /> {t('admin.products')}</NavLink>
          <NavLink to="/admin/categories" className={link} data-testid="admin-nav-categories"><Layers className="w-4 h-4" /> Categories</NavLink>
          <NavLink to="/admin/customers" className={link}><Users className="w-4 h-4" /> {t('admin.customers')}</NavLink>
          <NavLink to="/admin/blast" className={link} data-testid="admin-nav-blast"><Megaphone className="w-4 h-4" /> Email blast</NavLink>
          <NavLink to="/admin/templates" className={link} data-testid="admin-nav-templates"><Mail className="w-4 h-4" /> Templates</NavLink>
          <NavLink to="/admin/team" className={link} data-testid="admin-nav-team"><Shield className="w-4 h-4" /> Team &amp; access</NavLink>
          <NavLink to="/admin/settings" className={link}><Settings className="w-4 h-4" /> {t('admin.settings')}</NavLink>
        </nav>
        <div className="p-3 border-t border-neutral-900 space-y-2">
          <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-orange-500">
            <ExternalLink className="w-3.5 h-3.5" /> View Website
          </Link>
          <div className="px-3 py-2 text-xs text-neutral-500">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="truncate">{user.email}</div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-red-400 w-full">
            <LogOut className="w-3.5 h-3.5" /> {t('admin.logout')}
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
