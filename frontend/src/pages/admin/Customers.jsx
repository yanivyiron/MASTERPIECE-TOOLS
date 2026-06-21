import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MOCK_CUSTOMERS, MOCK_QUOTES } from '../../mock';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Mail, Building, Globe } from 'lucide-react';

const AdminCustomers = () => {
  const [search, setSearch] = useState('');
  const list = MOCK_CUSTOMERS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <Helmet><title>Customers — Owner Panel</title></Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Customers</h1>
          <p className="text-neutral-500 text-sm mt-1">CRM — all customers and their RFQ history.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-64 focus-visible:ring-orange-500" />
        </div>
      </div>

      <div className="border border-neutral-800 bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-900 text-[10px] uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Country</th>
                <th className="text-right px-4 py-3">Quotes</th>
                <th className="text-right px-4 py-3">Lifetime Value</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {list.map(c => (
                <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-300 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-orange-500" />{c.company}</td>
                  <td className="px-4 py-3 text-neutral-300"><a href={`mailto:${c.email}`} className="hover:text-orange-500">{c.email}</a></td>
                  <td className="px-4 py-3 text-neutral-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-neutral-500" />{c.country}</td>
                  <td className="px-4 py-3 text-right text-neutral-300">{c.quotesCount}</td>
                  <td className="px-4 py-3 text-right text-orange-500 font-semibold">€{c.totalValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs">
                      <a href={`mailto:${c.email}`}><Mail className="w-3 h-3 mr-1" /> Email</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
