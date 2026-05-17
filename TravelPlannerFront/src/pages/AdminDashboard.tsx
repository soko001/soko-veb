import { useEffect, useState } from 'react';
import { Shield, Users, FileText, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { User, TravelPlan } from '../models/types';

export const AdminDashboard = () => {
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [accountList, setAccountList] = useState<User[]>([]);
  const [tripList, setTripList] = useState<TravelPlan[]>([]);

  const loadAdminData = async () => {
    try {
      setIsFetching(true);
      setFetchErr(null);
      const [fetchedUsers, fetchedPlans] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllPlans()
      ]);
      setAccountList(fetchedUsers);
      setTripList(fetchedPlans);
    } catch (err: any) {
      setFetchErr("Failed to load admin data. Check your permissions.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDisableUser = async (userId: number) => {
    if (!window.confirm("Deactivate this user's account?")) return;
    try {
      await adminService.deactivateUser(userId);
      loadAdminData();
    } catch (err) {
      alert("Failed to deactivate user.");
    }
  };

  const handleRemovePlan = async (planId: number) => {
    if (!window.confirm("Permanently delete this travel plan?")) return;
    try {
      await adminService.deletePlan(planId);
      loadAdminData();
    } catch (err) {
      alert("Failed to delete plan.");
    }
  };

  if (isFetching) return (
    <div className="p-8 text-center font-label text-teal animate-pulse">Loading admin data...</div>
  );
  if (fetchErr) return (
    <div className="p-6 bg-danger/10 border border-danger/30 text-danger font-label text-center rounded-xl max-w-md mx-auto mt-12">{fetchErr}</div>
  );

  const activeUserCount = accountList.filter(u => u.isActive).length;
  const adminUserCount = accountList.filter(u => u.role === 'Admin').length;
  const pooledBudget = tripList.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className="w-10 h-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-snow">Admin Panel</h1>
          <p className="font-body text-xs text-slate">Manage users and travel plans across the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-navy-light border border-border rounded-xl p-4">
          <p className="font-label text-[10px] uppercase tracking-wider text-slate">Total Users</p>
          <p className="font-mono text-2xl font-bold text-snow mt-1">{accountList.length}</p>
        </div>
        <div className="bg-navy-light border border-border rounded-xl p-4">
          <p className="font-label text-[10px] uppercase tracking-wider text-slate">Active</p>
          <p className="font-mono text-2xl font-bold text-teal mt-1">{activeUserCount}</p>
        </div>
        <div className="bg-navy-light border border-border rounded-xl p-4">
          <p className="font-label text-[10px] uppercase tracking-wider text-slate">Total Plans</p>
          <p className="font-mono text-2xl font-bold text-snow mt-1">{tripList.length}</p>
        </div>
        <div className="bg-navy-light border border-border rounded-xl p-4">
          <p className="font-label text-[10px] uppercase tracking-wider text-slate">Budget Pool</p>
          <p className="font-mono text-xl font-bold text-mist mt-1">{pooledBudget.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-navy-light border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users className="w-4 h-4 text-teal" />
          <h2 className="font-label text-sm font-semibold text-snow">Users</h2>
          <span className="ml-auto font-mono text-xs text-slate">{accountList.length} total · {adminUserCount} admin</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate font-label uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {accountList.map(u => (u.id &&
                <tr key={u.id} className="hover:bg-surface/40">
                  <td className="px-5 py-3">
                    <div className="font-medium text-mist">{u.firstName} {u.lastName}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-[11px] text-slate/70 font-mono select-all">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-label px-2 py-0.5 rounded-full border ${
                      u.role === 'Admin'
                        ? 'bg-teal/10 text-teal border-teal/20'
                        : 'bg-surface text-slate border-border'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive
                      ? <span className="text-[10px] font-label text-teal">Active</span>
                      : <span className="text-[10px] font-label text-danger italic">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive ? (
                      <button onClick={() => handleDisableUser(u.id)}
                        className="text-xs bg-surface hover:bg-danger/10 hover:text-danger px-2 py-1 border border-border rounded-lg transition-colors">
                        Deactivate
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-navy-light border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <FileText className="w-4 h-4 text-teal" />
          <h2 className="font-label text-sm font-semibold text-snow">All Plans</h2>
          <span className="ml-auto font-mono text-xs text-slate">{tripList.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate font-label uppercase tracking-wider">
                <th className="px-5 py-3">Plan Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Dates</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {tripList.map(p => (
                <tr key={p.id} className="hover:bg-surface/30">
                  <td className="px-5 py-3 font-medium text-mist font-label text-xs">{p.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-[11px] text-slate">
                    {p.startDate?.substring(0, 10)} — {p.endDate?.substring(0, 10)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate">{p.budget}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemovePlan(p.id)}
                      className="text-slate hover:text-danger p-1 transition-colors" title="Delete Plan">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
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