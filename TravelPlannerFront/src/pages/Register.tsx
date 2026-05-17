import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AlertCircle, Globe, CheckCircle, KeyRound } from 'lucide-react';
 
const Register = () => {
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
 
  const navigate = useNavigate();
 
  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
 
    if (!givenName.trim() || !familyName.trim()) {
      setRegError('Please enter your first and last name.');
      return;
    }
    if (!regEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPass.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPass !== regConfirmPass) {
      setRegError('Passwords do not match.');
      return;
    }
 
    try {
      setIsRegistering(true);
      const payload: any = { firstName: givenName, lastName: familyName, email: regEmail, password: regPass };
      if (adminToken.trim()) payload.adminKey = adminToken.trim();
      await authService.register(payload);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 text-mist font-body">
      <div className="bg-navy-light border border-border rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal/15 border border-teal/30 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6 text-teal" />
          </div>
          <h2 className="text-xl font-display font-bold text-snow tracking-tight">Create an account</h2>
          <p className="text-xs font-body text-slate mt-1">Start planning your trips with Columbo</p>
        </div>
 
        {regError && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger rounded-lg flex items-center gap-2 text-xs font-functional">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{regError}</span>
          </div>
        )}
 
        {isSuccess && (
          <div className="mb-4 p-3 bg-teal/10 border border-teal/30 text-teal rounded-lg flex items-center gap-2 text-xs font-functional">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Account created! Redirecting to login...</span>
          </div>
        )}
 
        <form onSubmit={submitRegistration} className="space-y-4 text-xs font-functional">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate font-semibold mb-1 uppercase tracking-wider">First Name</label>
              <input type="text" required value={givenName} onChange={e => setGivenName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-mist focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="block text-slate font-semibold mb-1 uppercase tracking-wider">Last Name</label>
              <input type="text" required value={familyName} onChange={e => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-mist focus:outline-none focus:border-teal" />
            </div>
          </div>
 
          <div>
            <label className="block text-slate font-semibold mb-1 uppercase tracking-wider">Email Address</label>
            <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-mist focus:outline-none focus:border-teal" />
          </div>
 
          <div>
            <label className="block text-slate font-semibold mb-1 uppercase tracking-wider">Password</label>
            <input type="password" required value={regPass} onChange={e => setRegPass(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-mist focus:outline-none focus:border-teal" />
          </div>
 
          <div>
            <label className="block text-slate font-semibold mb-1 uppercase tracking-wider">Confirm Password</label>
            <input type="password" required value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-mist focus:outline-none focus:border-teal" />
          </div>
 
          <div className="p-3 bg-surface/50 border border-border/60 rounded-lg space-y-1.5">
            <label className="flex items-center gap-1.5 text-slate font-semibold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-teal/60" />
              Admin Key <span className="normal-case font-body text-slate/50">(optional)</span>
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              placeholder="Leave blank for standard access"
              className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-mist placeholder:text-slate/40 focus:outline-none focus:border-teal"
            />
            <p className="text-[10px] text-slate/50 font-body">Enter the admin key to receive administrator access.</p>
          </div>
 
          <button type="submit" disabled={isRegistering || isSuccess}
            className="w-full py-2.5 bg-teal hover:bg-teal-light text-navy font-label font-semibold tracking-wide rounded-lg shadow-[0_0_16px_rgba(14,165,176,0.3)] transition-all uppercase">
            {isRegistering ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
 
        <div className="mt-5 pt-4 border-t border-border text-center text-xs font-functional text-slate">
          Already have an account?{' '}
          <Link to="/login" className="text-teal hover:text-teal-light font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
 
export default Register;