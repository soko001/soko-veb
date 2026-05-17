import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { travelPlanService } from '../services/travelPlanService';
import type { TravelPlan } from '../models/types';
import { format } from 'date-fns';
import { Calendar, DollarSign, ArrowRight, Globe, AlertCircle, Plus, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [alertErr, setAlertErr] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [savedPlans, setSavedPlans] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const retrievePlans = async () => {
      try {
        setIsFetching(true);
        const data = await travelPlanService.getAll();
        setSavedPlans(data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setAlertErr("Session expired. Please log in again.");
        } else {
          setAlertErr("Could not load your travel plans. Check your API gateway connection.");
        }
      } finally {
        setIsFetching(false);
      }
    };

    retrievePlans();
  }, []);

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal border-t-transparent"></div>
        <p className="mt-4 font-label text-sm tracking-wide text-slate">Loading your plans...</p>
      </div>
    );
  }

  const overallBudget = savedPlans.reduce((sum, p) => sum + (p.budget || 0), 0);
  const overallSpent = savedPlans.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);
  const plansOverBudget = savedPlans.filter(p => p.remainingBudget < 0).length;

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-snow">My Travel Plans</h1>
            <p className="font-functional text-sm text-slate mt-0.5">Manage and explore your upcoming trips.</p>
          </div>
          <RouterLink
            to="/travel-plans/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal hover:bg-teal-light text-navy font-label font-semibold text-sm rounded-xl shadow-[0_0_12px_rgba(14,165,176,0.25)] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </RouterLink>
        </div>

        {isAdmin() && (
          <RouterLink
            to="/admin"
            className="flex items-center justify-between gap-3 px-5 py-3 bg-teal/10 border border-teal/30 rounded-xl hover:bg-teal/15 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-teal" />
              <div>
                <p className="font-label text-sm text-teal font-semibold">Administrator Access Active</p>
                <p className="font-functional text-xs text-slate">Open Admin Control Panel</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-teal transition-transform group-hover:translate-x-1" />
          </RouterLink>
        )}

        {alertErr && (
          <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl flex items-center gap-3 font-functional text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{alertErr}</span>
          </div>
        )}

        {savedPlans.length === 0 ? (
          <div className="text-center py-16 bg-navy-light border border-dashed border-border rounded-2xl">
            <Globe className="w-12 h-12 text-border mx-auto mb-4" />
            <h3 className="font-display text-lg text-snow font-semibold">No plans yet</h3>
            <p className="font-body text-slate max-w-sm mx-auto mt-1 mb-6 text-sm">
              Create your first travel plan to get started.
            </p>
            <RouterLink
              to="/travel-plans/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-2 text-mist font-label text-sm rounded-xl border border-border transition-all"
            >
              <Plus className="w-4 h-4" />
              Create a Plan
            </RouterLink>
          </div>
        ) : (
          <div className="bg-navy-light border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-[11px] font-label uppercase tracking-wider text-slate">Plan</th>
                  <th className="px-4 py-3 text-[11px] font-label uppercase tracking-wider text-slate hidden md:table-cell">Dates</th>
                  <th className="px-4 py-3 text-[11px] font-label uppercase tracking-wider text-slate hidden sm:table-cell">Budget</th>
                  <th className="px-4 py-3 text-[11px] font-label uppercase tracking-wider text-slate hidden sm:table-cell">Remaining</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {savedPlans.map((trip) => {
                  const hasExceededBudget = trip.remainingBudget < 0;
                  return (
                    <tr key={trip.id} className="group hover:bg-surface/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-display text-sm font-semibold text-snow group-hover:text-teal transition-colors">{trip.name}</div>
                        {trip.description && (
                          <div className="font-body text-xs text-slate mt-0.5 line-clamp-1 max-w-[220px]">{trip.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs font-functional text-slate">
                          <Calendar className="w-3.5 h-3.5 text-teal/60 shrink-0" />
                          <span className="font-mono">
                            {format(new Date(trip.startDate), 'MMM dd')} — {format(new Date(trip.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs font-functional text-slate">
                          <DollarSign className="w-3.5 h-3.5 text-teal/60 shrink-0" />
                          <span className="font-mono font-semibold text-mist">{trip.budget.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          hasExceededBudget
                            ? 'bg-danger/10 text-danger border border-danger/20'
                            : 'bg-teal/10 text-teal border border-teal/20'
                        }`}>
                          {trip.remainingBudget >= 0
                            ? `+${trip.remainingBudget.toFixed(0)}`
                            : `${trip.remainingBudget.toFixed(0)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <RouterLink
                          to={`/travel-plans/${trip.id}`}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-surface hover:bg-surface-2 text-mist font-label text-xs font-medium rounded-lg border border-border transition-all group-hover:border-teal/40 group-hover:text-teal"
                        >
                          Open
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </RouterLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {savedPlans.length > 0 && (
        <aside className="w-52 shrink-0 space-y-4">
          <h2 className="font-label text-xs uppercase tracking-wider text-slate pt-1">Summary</h2>

          <div className="bg-navy-light border border-border rounded-xl p-4 space-y-1">
            <p className="font-label text-[10px] uppercase tracking-wider text-slate">Total Plans</p>
            <p className="font-mono text-2xl font-bold text-snow">{savedPlans.length}</p>
          </div>

          <div className="bg-navy-light border border-border rounded-xl p-4 space-y-1">
            <p className="font-label text-[10px] uppercase tracking-wider text-slate">Total Budget</p>
            <p className="font-mono text-xl font-bold text-mist">{overallBudget.toFixed(0)}</p>
          </div>

          <div className="bg-navy-light border border-border rounded-xl p-4 space-y-1">
            <p className="font-label text-[10px] uppercase tracking-wider text-slate">Total Spent</p>
            <p className="font-mono text-xl font-bold text-danger">{overallSpent.toFixed(0)}</p>
          </div>

          {plansOverBudget > 0 && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-1">
              <p className="font-label text-[10px] uppercase tracking-wider text-danger/70">Over Budget</p>
              <p className="font-mono text-xl font-bold text-danger">{plansOverBudget} plan{plansOverBudget > 1 ? 's' : ''}</p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};

export default Dashboard;