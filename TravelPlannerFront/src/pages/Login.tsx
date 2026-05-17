import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Globe, Mail, Lock } from 'lucide-react';
 
const Login = () => {
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
 
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';
 
  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
 
    if (!authEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setLoginErr('Please enter a valid email address.');
      return;
    }
    if (authPass.length < 6) {
      setLoginErr('Password must be at least 6 characters.');
      return;
    }
 
    try {
      setIsAuthenticating(true);
      await login({ email: authEmail, password: authPass });
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setLoginErr('Invalid credentials. Please check your email and password.');
      } else {
        setLoginErr(err.response?.data?.message || 'Connection error. Check your API gateway.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy">
      <div className="w-full max-w-md">
        <div className="bg-navy-light border border-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal/15 border border-teal/30 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-teal" />
            </div>
            <h1 className="text-2xl font-display font-bold text-snow tracking-tight">Welcome back</h1>
            <p className="text-sm font-body text-slate mt-1">Sign in to your Columbo account</p>
          </div>
 
          {loginErr && (
            <div className="mb-5 p-3 bg-danger/10 border border-danger/30 text-danger text-sm font-functional flex items-start gap-2 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{loginErr}</span>
            </div>
          )}
 
          <form onSubmit={executeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-label text-slate uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate/50">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-surface border border-border text-mist rounded-lg font-functional text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-all placeholder:text-slate/40"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-xs font-label text-slate uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-surface border border-border text-mist rounded-lg font-functional text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-all placeholder:text-slate/40"
                />
              </div>
            </div>
 
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 mt-2 bg-teal hover:bg-teal-light text-navy font-label font-semibold tracking-wide rounded-lg shadow-[0_0_16px_rgba(14,165,176,0.3)] transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isAuthenticating ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
 
          <div className="mt-6 pt-5 border-t border-border text-center text-sm font-functional text-slate">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal hover:text-teal-light font-semibold transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Login;