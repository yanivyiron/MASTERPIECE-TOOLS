import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useBasket } from '../context/BasketContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { UploadCloud, ShoppingBasket, CheckCircle2, ArrowRight, ShieldCheck, Send, Clock, Cog, Crosshair, BadgeCheck, Truck, Mail, Phone } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const RequestQuote = () => {
  const { t } = useLang();
  const { items, count, clear } = useBasket();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [productTypes, setProductTypes] = useState({ gauge: false, cutting: false });
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '', country: '', phone: '', industry: '', message: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleFiles = (e) => setFiles(Array.from(e.target.files || []));

  const isStep1Valid = form.firstName && /^\S+@\S+\.\S+$/.test(form.email) && form.company && (productTypes.gauge || productTypes.cutting || items.length > 0);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    const quote = {
      ...form, productTypes, items,
      files: files.map(f => f.name), submittedAt: new Date().toISOString()
    };
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
          <p className="text-neutral-400 mt-3">We typically respond within 24 hours. (DEMO: backend integration pending — will email yaniv@masterpiece-innovations.com)</p>
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
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">Submission Guidelines</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase">Request a Quotation</h1>
          <p className="text-neutral-300 mt-4 max-w-2xl text-lg">Send us your request and our team will review it and get back to you shortly. We typically respond within 24 hours.</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
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
              <div className="space-y-6">
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">What do you need?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${productTypes.gauge ? 'border-orange-500 bg-orange-500/5' : 'border-neutral-800 hover:border-neutral-600'}`}>
                    <Checkbox checked={productTypes.gauge} onCheckedChange={(v) => setProductTypes({ ...productTypes, gauge: !!v })} className="mt-0.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                    <div>
                      <div className="text-white font-bold">Precision Gauge</div>
                      <div className="text-xs text-neutral-500 mt-1">Thread plug, ring, plain, helicoil, buttress, custom</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${productTypes.cutting ? 'border-orange-500 bg-orange-500/5' : 'border-neutral-800 hover:border-neutral-600'}`}>
                    <Checkbox checked={productTypes.cutting} onCheckedChange={(v) => setProductTypes({ ...productTypes, cutting: !!v })} className="mt-0.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                    <div>
                      <div className="text-white font-bold">Custom Cutting Tool</div>
                      <div className="text-xs text-neutral-500 mt-1">Endmills, drills, reamers, custom carbide</div>
                    </div>
                  </label>
                </div>

                <h2 className="text-white text-xl font-bold tracking-wide uppercase pt-3">Your details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">First Name *</Label>
                    <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">Last Name</Label>
                    <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">Company Name *</Label>
                    <Input value={form.company} onChange={(e) => update('company', e.target.value)} required className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">Phone</Label>
                    <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase tracking-widest">Country</Label>
                    <Input value={form.country} onChange={(e) => update('country', e.target.value)} className="mt-2 bg-neutral-950 border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" disabled={!isStep1Valid} onClick={() => setStep(2)} className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-6 disabled:opacity-50">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">Specifications & Drawing</h2>
                <div>
                  <Label className="text-neutral-400 text-xs uppercase tracking-widest">Describe your requirement (if no drawing is available)</Label>
                  <Textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Describe materials, tolerances, quantities, deadline, certifications required..." className="mt-2 bg-neutral-950 border-neutral-800 text-white min-h-[140px] focus-visible:ring-orange-500" />
                </div>
                <div>
                  <Label className="text-neutral-400 text-xs uppercase tracking-widest">Upload Drawing (STEP, XT, PDF, JPG)</Label>
                  <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-orange-500 bg-neutral-950 cursor-pointer p-8 transition-colors">
                    <UploadCloud className="w-8 h-8 text-orange-500" />
                    <div className="mt-3 text-sm text-white">Click or drop files here</div>
                    <div className="text-xs text-neutral-500 mt-1">PDF, STEP, XT, DXF, JPG / PNG up to 25 MB</div>
                    <input type="file" multiple onChange={handleFiles} className="hidden" accept=".pdf,.step,.stp,.xt,.dxf,.dwg,.jpg,.jpeg,.png" />
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
                <h2 className="text-white text-xl font-bold tracking-wide uppercase">Review & Submit</h2>
                <div className="border border-neutral-800 bg-neutral-950 p-5">
                  <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Product Type</div>
                  <div className="text-sm text-white">
                    {productTypes.gauge && <span className="inline-block mr-2 px-2 py-0.5 border border-orange-500/40 text-orange-300 text-xs">Precision Gauge</span>}
                    {productTypes.cutting && <span className="inline-block mr-2 px-2 py-0.5 border border-orange-500/40 text-orange-300 text-xs">Custom Cutting Tool</span>}
                    {items.length > 0 && <span className="inline-block px-2 py-0.5 border border-emerald-500/40 text-emerald-300 text-xs">{items.length} basket item(s)</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-neutral-800 pt-4">
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Name</div><div className="text-white">{form.firstName} {form.lastName}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Email</div><div className="text-white">{form.email}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Company</div><div className="text-white">{form.company}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Phone</div><div className="text-white">{form.phone || '—'}</div></div>
                    <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Country</div><div className="text-white">{form.country || '—'}</div></div>
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
                    {submitting ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Get a Quote</>}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Submission guidelines */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-neutral-800 bg-neutral-950 p-5">
              <div className="text-orange-500 text-[11px] tracking-widest uppercase font-bold mb-2">Submission Guidelines</div>
              <ul className="text-sm text-neutral-300 space-y-2">
                <li className="flex gap-2"><span className="text-orange-500 shrink-0">▸</span> Provide full 2D drawings (PDF) and 3D models (STEP/XT).</li>
                <li className="flex gap-2"><span className="text-orange-500 shrink-0">▸</span> Specify material type and required tolerances.</li>
                <li className="flex gap-2"><span className="text-orange-500 shrink-0">▸</span> Mention any special coating or heat treatment requirements.</li>
              </ul>
            </div>
            <div className="border border-neutral-800 bg-neutral-950 p-5">
              <div className="text-orange-500 text-[11px] tracking-widest uppercase font-bold mb-2 inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Logistics Commitment</div>
              <p className="text-sm text-neutral-300">Standard delivery within 14 business days across all European manufacturing hubs.</p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-neutral-500"><Clock className="w-3.5 h-3.5 text-orange-500" /> We typically respond within 24 hours</div>
            </div>
          </div>
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
                    <img src={it.image} alt="" className="w-12 h-12 object-contain bg-neutral-900 border border-neutral-800 p-1" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{t(it.nameKey)}</div>
                      <div className="text-neutral-500 text-xs">Qty: {it.qty}{it.notes ? ` — ${it.notes}` : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/products" className="mt-5 inline-block text-xs text-orange-500 hover:underline tracking-widest uppercase">{t('btn.continueShopping')}</Link>

            {/* Contact card */}
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3 text-sm">
              <div className="text-[11px] tracking-widest uppercase text-neutral-500 font-bold">Direct contact</div>
              <a href="mailto:yaniv@masterpiece-innovations.com" className="flex items-center gap-2 text-neutral-300 hover:text-orange-500"><Mail className="w-4 h-4 text-orange-500" /> yaniv@masterpiece-innovations.com</a>
              <a href="tel:+31625363610" className="flex items-center gap-2 text-neutral-300 hover:text-orange-500"><Phone className="w-4 h-4 text-orange-500" /> +31 6 25363610</a>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <section className="bg-neutral-950 border-y border-neutral-900 py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">Technical Specifications</div>
          <h2 className="text-white font-black text-2xl sm:text-3xl uppercase tracking-tight mb-10">Why our gauges set the standard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: '01', icon: Cog, title: 'Manufacturing Material', desc: 'High-grade tool steel or tungsten carbide for maximum wear resistance.' },
              { num: '02', icon: Crosshair, title: 'Precision Level', desc: 'Sub-micron tolerance according to international ISO standards.' },
              { num: '03', icon: BadgeCheck, title: 'Quality Control', desc: 'Each gauge undergoes rigorous 100% inspection using advanced measuring equipment.' }
            ].map((b) => {
              const Ic = b.icon;
              return (
                <div key={b.num} className="group relative p-6 border border-neutral-800 hover:border-orange-500/60 bg-black hover:bg-neutral-900/40 transition-all duration-500 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500/5 group-hover:bg-orange-500/15 blur-2xl transition-all duration-700" />
                  <div className="relative">
                    <div className="text-orange-500 text-xs tracking-widest font-bold">{b.num}</div>
                    <Ic className="w-6 h-6 text-orange-500 mt-3" />
                    <h3 className="text-white font-bold uppercase text-base mt-3">{b.title}</h3>
                    <p className="text-neutral-400 mt-3 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RequestQuote;
