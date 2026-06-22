import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';
import { LogoMark } from '../../components/Logo';
import { ShieldCheck, ArrowRight, Mail, KeyRound } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const AdminLogin = () => {
  const { user, requestCode, verifyCode } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');

  if (user) return <Navigate to="/admin" replace />;

  const sendCode = async (e) => {
    e?.preventDefault();
    setBusy(true);
    const res = await requestCode(email, password);
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error });
      return;
    }
    setStep(2);
    if (res.demoCode) {
      setHint(`Demo code: ${res.demoCode} (SMTP is not configured — code is shown here until you set it up in Admin → Settings → Email Provider).`);
    } else {
      setHint(`Code sent to ${email}. Check your inbox.`);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    setBusy(true);
    const res = await verifyCode(code);
    setBusy(false);
    if (!res.ok) { toast({ title: 'Error', description: res.error }); return; }
    toast({ title: 'Welcome back, Yaniv' });
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoMark className="w-12 h-12" />
          <div className="mt-4 text-white text-2xl font-bold tracking-wide">{t('admin.login')}</div>
          <div className="text-neutral-500 text-sm mt-1">Two-step verification required</div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-7">
          {step === 1 ? (
            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('admin.email')}</Label>
                <div className="relative mt-2">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9 bg-black border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                </div>
              </div>
              <div>
                <Label className="text-neutral-400 text-xs uppercase tracking-widest">{t('admin.password')}</Label>
                <div className="relative mt-2">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9 bg-black border-neutral-800 text-white h-11 focus-visible:ring-orange-500" />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-orange-500 hover:bg-orange-400 rounded-none h-11 disabled:opacity-50">
                {busy ? 'Sending...' : <>{t('admin.requestCode')} <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
              <p className="text-[11px] text-neutral-500 text-center">A 6-digit code will be emailed for verification. (While SMTP is unset, the code appears on the next screen.)</p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-neutral-400 border border-neutral-800 p-3 bg-black">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t('admin.codeHint')}
              </div>
              {hint && <div className="text-[11px] text-orange-400 -mt-2">{hint}</div>}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="bg-black border-neutral-800 text-white" />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" disabled={busy || code.length !== 6} className="w-full bg-orange-500 hover:bg-orange-400 rounded-none h-11 disabled:opacity-50">
                {busy ? 'Verifying...' : t('admin.signin')}
              </Button>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-neutral-500 hover:text-white w-full text-center">Back</button>
            </form>
          )}
        </div>

        <Link to="/" className="mt-6 block text-center text-xs text-neutral-500 hover:text-orange-500">← Back to website</Link>
      </div>
    </div>
  );
};

export default AdminLogin;
