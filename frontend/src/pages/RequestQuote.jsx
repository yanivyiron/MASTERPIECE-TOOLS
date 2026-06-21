import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useBasket } from '../context/BasketContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { UploadCloud, ShoppingBasket, CheckCircle2, ArrowRight, ShieldCheck, Send } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const RequestQuote = () => {
  const { t } = useLang();
  const { items, count, clear } = useBasket();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', company: '', country: '', phone: '', industry: '', message: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const isStep1Valid = form.name && /^\S+@\S+\.\S+$/.test(form.email) && form.company;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // MOCK: in real backend this will POST /api/quotes and trigger email to yaniv@masterpiece-innovations.com
    await new Promise(r => setTimeout(r, 900));
    const quote = { ...form, items, files: files.map(f => f.name), submittedAt: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem('mpt_quotes') || '[]');
      existing.unshift({ id: 'Q-LOCAL-' + Date.now(), ...quote });
      localStorage.setItem('mpt_quotes', JSON.stringify(existing));
    } catch (err) { /* ignore */ }
    setSubmitting(false);
    setSuccess(true);
    toast({ title: t('quote.success'), description: form.email });
  };

  if (success) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center border border-emerald-500/30 bg-emerald-500/5 p-10">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold">{t('quote.success')}</h1>
          <p className="text-neutral-400 mt-3">A confirmation has been recorded. (DEMO: backend integration pending — will email yaniv@masterpiece-innovations.com)</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={() => { clear(); navigate('/'); }} className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-6">Back to Home</Button>
            <Button onClick={() => navigate('/products')} variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-11 px-6">Browse Products</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <Helmet><title>{`${t('quote.title')} — Masterpiece Tools`}</title></Helmet>

      <div className="relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/8956445/pexels-photo-8956445.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/55" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 py-20">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('hero.cta1')}</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase">{t('quote.title')}</h1>
          <p className="text-neutral-300 mt-4 max-w-2xl">{t('quote.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-9 h-9 inline-flex items-center justify-center border ${step >= s ? 'border-orange-500 bg-orange-500 text-white' : 'border-neutral-800 text-neutral-500'} font-bold text-sm`}>{s}</div>
                {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-orange-500' : 'bg-neutral-800'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">Your details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.name')} *</Label>
                    <Input value={form.name} onChange={(e) => update('name', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.email')} *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.company')} *</Label>
                    <Input value={form.company} onChange={(e) => update('company', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.country')}</Label>
                    <Input value={form.country} onChange={(e) => update('country', e.target.value)} className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.phone')}</Label>
                    <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.industry')}</Label>
                    <Select value={form.industry} onValueChange={(v) => update('industry', v)}>
                      <SelectTrigger className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus:ring-orange-500"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-neutral-950 border-neutral-800 text-white">
                        <SelectItem value="aerospace">Aerospace</SelectItem>
                        <SelectItem value="defense">Defense</SelectItem>
                        <SelectItem value="medical">Medical Devices</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="semiconductor">Semiconductor</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" disabled={!isStep1Valid} onClick={() => setStep(2)} className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-6 disabled:opacity-50">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">Specifications & drawing</h2>
                <div>
                  <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.message')}</Label>
                  <Textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Describe materials, tolerances, quantities, deadline, certifications required..." className="mt-2 bg-neutral-950 border-neutral-800 text-white min-h-[140px] focus-visible:ring-orange-500" />
                </div>
                <div>
                  <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('quote.upload')}</Label>
                  <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-orange-500 bg-neutral-950 cursor-pointer p-8 transition-colors">
                    <UploadCloud className="w-8 h-8 text-orange-500" />
                    <div className="mt-3 text-sm text-white">Click or drop files here</div>
                    <div className="text-xs text-neutral-500 mt-1">{t('quote.uploadHint')}</div>
                    <input type="file" multiple onChange={handleFiles} className="hidden" accept=".pdf,.step,.stp,.dxf,.dwg,.jpg,.jpeg,.png" />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {files.map(f => (
                        <li key={f.name} className="text-xs text-neutral-400 border border-neutral-800 p-2 flex justify-between"><span>{f.name}</span><span>{(f.size / 1024).toFixed(1)} KB</span></li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-11 px-6">Back</Button>
                  <Button type="button" onClick={() => setStep(3)} className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-6">Review <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">Review & submit</h2>
                <div className="border border-neutral-800 bg-neutral-950 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.name')}</div><div className="text-white">{form.name}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.email')}</div><div className="text-white">{form.email}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.company')}</div><div className="text-white">{form.company}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.country')}</div><div className="text-white">{form.country || '—'}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.phone')}</div><div className="text-white">{form.phone || '—'}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">{t('quote.industry')}</div><div className="text-white">{form.industry || '—'}</div></div>
                  </div>
                  {form.message && <div className="mt-4 pt-4 border-t border-neutral-800 text-sm text-neutral-300">{form.message}</div>}
                  {files.length > 0 && <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-500">Attachments: {files.map(f => f.name).join(', ')}</div>}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Your information stays confidential and is used only to prepare your quote.
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-11 px-6">Back</Button>
                  <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-7 disabled:opacity-50">
                    {submitting ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> {t('btn.submitQuote')}</>}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-4">
          <div className="border border-neutral-800 bg-neutral-950 p-5 sticky top-[100px]">
            <div className="flex items-center gap-2 text-white font-bold tracking-wide uppercase">
              <ShoppingBasket className="w-4 h-4 text-orange-500" /> {t('basket.title')} <span className="text-orange-500">({count})</span>
            </div>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">{t('basket.empty')} — you can still submit a custom RFQ.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map(it => (
                  <li key={it.id} className="flex gap-3 text-sm">
                    <img src={it.image} alt="" className="w-12 h-12 object-cover border border-neutral-800" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{t(it.nameKey)}</div>
                      <div className="text-neutral-500 text-xs">Qty: {it.qty}{it.notes ? ` — ${it.notes}` : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/products" className="mt-5 inline-block text-xs text-orange-500 hover:underline tracking-widest uppercase">{t('btn.continueShopping')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuote;
