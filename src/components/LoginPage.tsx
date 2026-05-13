// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';
import { useTranslation } from 'react-i18next';
import apiClient from '../lib/api';
import { authAPI } from '../lib/api';

(window as any).apiClient = apiClient;
(window as any).authAPI = authAPI;

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setError('2FA verification not implemented in this view');
    setIsLoading(false);
  };

  const testApi = async () => {
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email:'test@api.com',password:'Test1234',name:'T',businessName:'B',businessType:'general'})
      });
      const text = await r.text();
      setError('API TEST: Status ' + r.status + ' - ' + text.substring(0,200));
    } catch(e: any) {
      setError('API TEST FAILED: ' + e.message);
    }
  };

  const backToLogin = () => {
    setShowTwoFactor(false);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-8 h-8 text-white" />
            <span className="text-3xl font-bold text-white">BizzAuto</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('login.heroTitle', 'Automate Your Business Growth')}
          </h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {!showTwoFactor ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-600">
                  {t('login.title', 'BizzAuto Solutions')}
                </h1>
                <p className="text-gray-500 mt-1">
                  {t('login.subtitle', 'Platform Automation')}
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder={t('login.emailPlaceholder', 'Email Address')}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder={t('login.passwordPlaceholder', 'Password')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                    Trusted by 1000+ businesses across India
                  </p>
                  <div className="flex items-center justify-center gap-6 text-gray-400">
                    {['Flipkart', 'Zomato', 'Swiggy'].map((company) => (
                      <span key={company} className="text-sm font-medium opacity-50">{company}</span>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <button onClick={testApi} type="button" className="w-full mb-2 text-xs text-gray-400 hover:text-blue-600 underline">
                🔧 Test API Connection
              </button>
              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? t('common.loading', 'Loading...') : (
                    <>
                      {t('login.signIn', 'Sign In')} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={backToLogin} className="flex items-center gap-2 text-gray-500 mb-6">
                <ArrowLeft size={18} /> {t('common.back', 'Back')}
              </button>
              <h2 className="text-2xl font-bold mb-2">{t('login.verify', 'Verification')}</h2>
              <p className="text-gray-500 mb-6">{t('login.verifyDesc', 'Enter 6-digit code')}</p>
              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full text-center text-2xl tracking-widest p-3 border rounded-lg"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium">
                  {t('login.verifyBtn', 'Verify')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
