import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MOCK_QUOTES, MOCK_CUSTOMERS, PRODUCTS } from '../../mock';
import { FileText, Users, Package, TrendingUp, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Stat = ({ icon: Icon, label, value, sub, color = 'text-orange-500' }) => (
  <div className="border border-neutral-800 bg-neutral-950 p-5">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-widest text-neutral-500">{label}</div>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-white font-black text-3xl mt-3">{value}</div>
    {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const newQuotes = MOCK_QUOTES.filter(q => q.status === 'new').length;
  const inProgress = MOCK_QUOTES.filter(q => q.status === 'in-progress').length;
  const replied = MOCK_QUOTES.filter(q => q.status === 'replied').length;

  return (
    <div className="p-8">
      <Helmet><title>Dashboard — Owner Panel</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-1">Overview of quotes, products and customers.</p>
        </div>
        <div className="text-xs text-neutral-500">Last updated {new Date().toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={FileText} label="New Quotes" value={newQuotes} sub="Awaiting reply" />
        <Stat icon={Clock} label="In Progress" value={inProgress} sub="Active conversations" color="text-amber-500" />
        <Stat icon={Mail} label="Replied" value={replied} sub="This month" color="text-emerald-500" />
        <Stat icon={Users} label="Customers" value={MOCK_CUSTOMERS.length} sub="Total in CRM" color="text-sky-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-bold tracking-wide uppercase text-sm">Recent Quotes</div>
            <Link to="/admin/quotes" className="text-xs text-orange-500 hover:underline tracking-widest uppercase">View all</Link>
          </div>
          <div className="space-y-3">
            {MOCK_QUOTES.slice(0, 5).map(q => (
              <Link key={q.id} to="/admin/quotes" className="flex items-center justify-between p-3 border border-neutral-900 hover:border-orange-500/50 transition-colors">
                <div>
                  <div className="text-white font-medium text-sm">{q.id} — {q.customer.name}</div>
                  <div className="text-xs text-neutral-500">{q.customer.company} • {new Date(q.date).toLocaleDateString()}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                  q.status === 'new' ? 'border-orange-500/40 text-orange-400' : q.status === 'replied' ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'
                }`}>{q.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-6">
          <div className="text-white font-bold tracking-wide uppercase text-sm mb-4">Top Customers</div>
          <div className="space-y-3">
            {MOCK_CUSTOMERS.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm">{c.name}</div>
                  <div className="text-xs text-neutral-500">{c.company}</div>
                </div>
                <div className="text-xs text-orange-500 font-semibold">€{c.totalValue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border border-neutral-800 bg-neutral-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-bold tracking-wide uppercase text-sm">Catalog Overview</div>
          <Link to="/admin/products" className="text-xs text-orange-500 hover:underline tracking-widest uppercase">Manage</Link>
        </div>
        <div className="flex items-center gap-6">
          <Stat icon={Package} label="Products" value={PRODUCTS.length} sub="Active SKUs" />
          <Stat icon={TrendingUp} label="Categories" value={2} sub="Gauges + Cutting Tools" color="text-sky-500" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
