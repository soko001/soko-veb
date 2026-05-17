import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar, DollarSign, ShieldCheck, AlertCircle, Globe,
  CheckSquare, Square, MapPin, ClipboardList, Plus,
  Pencil, Trash2, X, Check, FileDown, Bell, Save,
  FileText, Activity as ActivityIcon, Map as MapIcon, Share2
} from 'lucide-react';
import { sharingService } from '../services/sharingService';
import { checklistService } from '../services/checklistService';
import { destinationService } from '../services/destinationService';
import { activityService } from '../services/activityService';
import { expenseService } from '../services/expenseService';
import { travelPlanService } from '../services/travelPlanService';
import type { TravelPlan, ActivityStatus, ExpenseCategory, Destination, Activity, Expense } from '../models/types';
import { Button } from '../components/ui/Button';
import { TravelMap } from '../components/TravelMap';

const ACTIVITY_STATUSES: ActivityStatus[] = ['Planned', 'Reserved', 'Completed', 'Cancelled'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Other'];
const STATUS_LABELS = ['Planned', 'Reserved', 'Completed', 'Cancelled'];
const CATEGORY_LABELS = ['Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Other'];

type ViewTab = 'overview' | 'destinations' | 'activities' | 'expenses' | 'checklist' | 'reminders' | 'map';
interface Reminder { id: string; text: string; datetime: string; fired: boolean; }

const inputCls = "w-full bg-navy border border-border rounded-lg px-3 py-2 text-mist text-sm focus:outline-none focus:border-teal transition-colors font-mono";
const labelCls = "block text-[11px] font-label uppercase text-slate tracking-wider mb-1";

const TAB_META: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',     label: 'Overview',     icon: <FileText className="w-4 h-4" /> },
  { key: 'destinations', label: 'Destinations', icon: <MapPin className="w-4 h-4" /> },
  { key: 'activities',   label: 'Activities',   icon: <ActivityIcon className="w-4 h-4" /> },
  { key: 'expenses',     label: 'Expenses',     icon: <DollarSign className="w-4 h-4" /> },
  { key: 'checklist',    label: 'Checklist',    icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'reminders',    label: 'Reminders',    icon: <Bell className="w-4 h-4" /> },
  { key: 'map',          label: 'Map',          icon: <MapIcon className="w-4 h-4" /> },
];

export const SharedPlanView = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [linkedErr, setLinkedErr] = useState<string | null>(null);
  const [isFetchingLinked, setIsFetchingLinked] = useState(true);
  const [linkedPlan, setLinkedPlan] = useState<TravelPlan | null>(null);
  const [currentSection, setCurrentSection] = useState<ViewTab>('overview');
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  const isEditMode = searchParams.get('perm') === '1';

  const [destForm, setDestForm] = useState({ name: '', arrivalDate: '', departureDate: '', description: '' });
  const [actForm, setActForm] = useState({ name: '', description: '', dateTime: '', location: '', status: 'Planned' as ActivityStatus });
  const [expForm, setExpForm] = useState({ name: '', amount: '', category: 'Transport' as ExpenseCategory });
  const [checkForm, setCheckForm] = useState({ title: '' });

  const [editingPlan, setEditingPlan] = useState(false);
  const [editingDestId, setEditingDestId] = useState<number | null>(null);
  const [editingActId, setEditingActId] = useState<number | null>(null);
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  const [planEditForm, setPlanEditForm] = useState({ name: '', description: '', startDate: '', endDate: '', budget: 0, notes: '' });
  const [destEditForm, setDestEditForm] = useState({ name: '', arrivalDate: '', departureDate: '', description: '' });
  const [actEditForm, setActEditForm] = useState({ name: '', dateTime: '', location: '', status: 'Planned' as ActivityStatus });
  const [expEditForm, setExpEditForm] = useState({ name: '', amount: '', category: 'Transport' as ExpenseCategory });

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderForm, setReminderForm] = useState({ text: '', datetime: '' });
  const reminderTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchSharedData = async () => {
    if (!token) return;
    try {
      setIsFetchingLinked(true);
      setLinkedErr(null);
      const authValidation = await sharingService.validateToken(token);
      if (!authValidation.isValid) throw new Error(authValidation.reason || "This share link is invalid.");
      const planData = await sharingService.getSharedPlan(authValidation.travelPlanId, token);
      setLinkedPlan(planData);
    } catch (err: any) {
      setLinkedErr(err.message || "This share link has expired or is invalid.");
    } finally {
      setIsFetchingLinked(false);
    }
  };

  useEffect(() => { fetchSharedData(); }, [token]);

  useEffect(() => {
    if (linkedPlan) {
      try {
        const stored = JSON.parse(localStorage.getItem(`reminders_${linkedPlan.id}`) || '[]');
        setReminders(stored);
        stored.forEach((r: Reminder) => { if (!r.fired) scheduleNotification(r, linkedPlan.id); });
      } catch {}
    }
    return () => { reminderTimers.current.forEach(t => clearTimeout(t)); };
  }, [linkedPlan?.id]);

  const refreshPlanState = async () => {
    if (!linkedPlan || !token) return;
    const planData = await sharingService.getSharedPlan(linkedPlan.id, token);
    setLinkedPlan(planData);
  };

  const saveReminders = (updated: Reminder[], planId: number) => {
    setReminders(updated);
    localStorage.setItem(`reminders_${planId}`, JSON.stringify(updated));
  };

  const scheduleNotification = (r: Reminder, planId: number) => {
    const ms = new Date(r.datetime).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => {
      if (Notification.permission === 'granted') new Notification('Columbo Reminder', { body: r.text });
      else alert(`Reminder: ${r.text}`);
      setReminders(prev => {
        const updated = prev.map(x => x.id === r.id ? { ...x, fired: true } : x);
        localStorage.setItem(`reminders_${planId}`, JSON.stringify(updated));
        return updated;
      });
    }, ms);
    reminderTimers.current.set(r.id, t);
  };

  const pushReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPlan || !reminderForm.text.trim() || !reminderForm.datetime) return;
    const r: Reminder = { id: Date.now().toString(), text: reminderForm.text.trim(), datetime: reminderForm.datetime, fired: false };
    const updated = [...reminders, r];
    saveReminders(updated, linkedPlan.id);
    scheduleNotification(r, linkedPlan.id);
    if (Notification.permission === 'default') Notification.requestPermission();
    setReminderForm({ text: '', datetime: '' });
  };

  const cancelReminder = (rid: string) => {
    if (!linkedPlan) return;
    const t = reminderTimers.current.get(rid);
    if (t) clearTimeout(t);
    reminderTimers.current.delete(rid);
    saveReminders(reminders.filter(r => r.id !== rid), linkedPlan.id);
  };

  const triggerExport = () => {
    if (!linkedPlan) return;
    const lines: string[] = [];
    lines.push(`SHARED TRAVEL PLAN: ${linkedPlan.name}`);
    lines.push(`Period: ${linkedPlan.startDate?.substring(0, 10)} — ${linkedPlan.endDate?.substring(0, 10)}`);
    lines.push(`Budget: ${linkedPlan.budget} | Spent: ${linkedPlan.totalExpenses} | Remaining: ${linkedPlan.remainingBudget}`);
    if (linkedPlan.description) lines.push(`\nDescription: ${linkedPlan.description}`);
    if (linkedPlan.notes) lines.push(`Notes: ${linkedPlan.notes}`);
    if (linkedPlan.destinations?.length) {
      lines.push('\n--- DESTINATIONS ---');
      linkedPlan.destinations.forEach((d: any) => lines.push(`• ${d.name}: ${d.arrivalDate?.substring(0, 10)} → ${d.departureDate?.substring(0, 10)}`));
    }
    if (linkedPlan.activities?.length) {
      lines.push('\n--- ACTIVITIES ---');
      linkedPlan.activities.forEach((a: any) => lines.push(`• ${a.name} | ${a.date?.substring(0, 10)} @ ${a.date?.substring(11, 16)} | ${a.location || 'TBD'} | ${typeof a.status === 'number' ? STATUS_LABELS[a.status] : a.status}`));
    }
    if (linkedPlan.expenses?.length) {
      lines.push('\n--- EXPENSES ---');
      linkedPlan.expenses.forEach((e: any) => lines.push(`• ${e.name} (${typeof e.category === 'number' ? CATEGORY_LABELS[e.category] : e.category}): ${e.amount}`));
    }
    if (linkedPlan.checklistItems?.length) {
      lines.push('\n--- CHECKLIST ---');
      linkedPlan.checklistItems.forEach((c: any) => lines.push(`[${c.isCompleted ? 'x' : ' '}] ${c.name}`));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${linkedPlan.name.replace(/\s+/g, '_')}_shared_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEditPlan = () => {
    if (!linkedPlan || !isEditMode) return;
    setPlanEditForm({ name: linkedPlan.name, description: linkedPlan.description || '', startDate: linkedPlan.startDate?.substring(0, 10), endDate: linkedPlan.endDate?.substring(0, 10), budget: linkedPlan.budget, notes: linkedPlan.notes || '' });
    setEditingPlan(true);
  };

  const commitPlanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode) return;
    if (new Date(planEditForm.endDate) < new Date(planEditForm.startDate)) { alert("End date cannot be before start date."); return; }
    if (planEditForm.budget < 0) { alert("Budget cannot be negative."); return; }
    try { await travelPlanService.update(linkedPlan.id, planEditForm); setEditingPlan(false); await refreshPlanState(); }
    catch { alert("Failed to update plan."); }
  };

  const insertDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode || !destForm.name || !destForm.arrivalDate || !destForm.departureDate) return;
    if (new Date(destForm.departureDate) < new Date(destForm.arrivalDate)) { alert("Departure cannot be before arrival."); return; }
    try {
      await destinationService.create(linkedPlan.id, { name: destForm.name, location: destForm.name, arrivalDate: destForm.arrivalDate, departureDate: destForm.departureDate, description: destForm.description || '', notes: '' });
      setDestForm({ name: '', arrivalDate: '', departureDate: '', description: '' });
      await refreshPlanState();
    } catch { alert("Failed to add destination."); }
  };

  const startEditDest = (d: Destination) => {
    if (!isEditMode) return;
    setEditingDestId(d.id);
    setDestEditForm({ name: d.name, arrivalDate: d.arrivalDate?.substring(0, 10), departureDate: d.departureDate?.substring(0, 10), description: d.description || '' });
  };

  const commitDestEdit = async (e: React.FormEvent, destId: number) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode) return;
    if (new Date(destEditForm.departureDate) < new Date(destEditForm.arrivalDate)) { alert("Departure cannot be before arrival."); return; }
    try {
      await destinationService.update(linkedPlan.id, destId, { name: destEditForm.name, location: destEditForm.name, arrivalDate: destEditForm.arrivalDate, departureDate: destEditForm.departureDate, description: destEditForm.description, notes: '' });
      setEditingDestId(null);
      await refreshPlanState();
    } catch { alert("Failed to update destination."); }
  };

  const removeDest = async (destId: number) => {
    if (!linkedPlan || !isEditMode || !window.confirm("Remove this destination?")) return;
    try { await destinationService.delete(linkedPlan.id, destId); await refreshPlanState(); } catch { alert("Failed to remove destination."); }
  };

  const insertActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode || !actForm.name || !actForm.dateTime) return;
    try {
      await activityService.create(linkedPlan.id, { name: actForm.name, date: actForm.dateTime + ':00', time: null, location: actForm.location || 'TBD', description: actForm.description || '', estimatedCost: 0, status: actForm.status });
      setActForm({ name: '', description: '', dateTime: '', location: '', status: 'Planned' });
      await refreshPlanState();
    } catch { alert("Failed to add activity."); }
  };

  const startEditAct = (a: Activity) => {
    if (!isEditMode) return;
    setEditingActId(a.id);
    setActEditForm({ name: a.name, dateTime: a.date?.substring(0, 16), location: a.location || '', status: typeof a.status === 'number' ? STATUS_LABELS[a.status] as ActivityStatus : a.status });
  };

  const commitActEdit = async (e: React.FormEvent, actId: number) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode) return;
    try {
      await activityService.update(linkedPlan.id, actId, { name: actEditForm.name, date: actEditForm.dateTime + ':00', time: null, location: actEditForm.location || 'TBD', status: actEditForm.status });
      setEditingActId(null);
      await refreshPlanState();
    } catch { alert("Failed to update activity."); }
  };

  const removeAct = async (actId: number) => {
    if (!linkedPlan || !isEditMode || !window.confirm("Remove this activity?")) return;
    try { await activityService.delete(linkedPlan.id, actId); await refreshPlanState(); } catch { alert("Failed to remove activity."); }
  };

  const insertExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expForm.amount);
    if (!linkedPlan || !isEditMode || !expForm.name || amountNum <= 0) return;
    try {
      await expenseService.create(linkedPlan.id, { name: expForm.name, amount: amountNum, category: expForm.category, date: new Date().toISOString(), description: '' });
      setExpForm({ name: '', amount: '', category: 'Transport' });
      await refreshPlanState();
    } catch { alert("Failed to add expense."); }
  };

  const startEditExp = (e: Expense) => {
    if (!isEditMode) return;
    setEditingExpId(e.id);
    setExpEditForm({ name: e.name, amount: String(e.amount), category: typeof e.category === 'number' ? CATEGORY_LABELS[e.category] as ExpenseCategory : e.category });
  };

  const commitExpEdit = async (ev: React.FormEvent, expId: number) => {
    ev.preventDefault();
    if (!linkedPlan || !isEditMode) return;
    const amountNum = Number(expEditForm.amount);
    if (amountNum <= 0) { alert("Amount must be greater than zero."); return; }
    try {
      await expenseService.update(linkedPlan.id, expId, { name: expEditForm.name, amount: amountNum, category: expEditForm.category });
      setEditingExpId(null);
      await refreshPlanState();
    } catch { alert("Failed to update expense."); }
  };

  const removeExp = async (expId: number) => {
    if (!linkedPlan || !isEditMode || !window.confirm("Remove this expense?")) return;
    try { await expenseService.delete(linkedPlan.id, expId); await refreshPlanState(); } catch { alert("Failed to remove expense."); }
  };

  const insertChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPlan || !isEditMode || !checkForm.title.trim()) return;
    try { await checklistService.create(linkedPlan.id, checkForm.title.trim()); setCheckForm({ title: '' }); await refreshPlanState(); }
    catch { alert("Failed to add item."); }
  };

  const handleToggleChecklist = async (itemId: number, currentStatus: boolean) => {
    if (!linkedPlan || !isEditMode) return;
    try { setToggleLoadingId(itemId); await checklistService.toggle(linkedPlan.id, itemId, !currentStatus); await refreshPlanState(); }
    catch { alert("Failed to toggle item."); } finally { setToggleLoadingId(null); }
  };

  const removeCheckItem = async (itemId: number) => {
    if (!linkedPlan || !isEditMode || !window.confirm("Remove this item?")) return;
    try { await checklistService.delete(linkedPlan.id, itemId); await refreshPlanState(); } catch { alert("Failed to remove item."); }
  };

  if (isFetchingLinked) return (
    <div className="min-h-screen bg-navy flex items-center justify-center font-label text-teal animate-pulse">
      Validating share link...
    </div>
  );

  if (linkedErr || !linkedPlan) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-light border border-border rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-danger mx-auto" />
          <h3 className="font-display text-xl font-bold text-snow">Invalid Link</h3>
          <p className="font-body text-sm text-slate">{linkedErr}</p>
          <Button onClick={() => navigate('/login')} className="w-full mt-2">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-mist font-body p-4 sm:p-8 max-w-6xl mx-auto space-y-5">
      <div className="bg-navy-light border border-border rounded-2xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-label uppercase text-teal tracking-widest mb-1">
            <Globe className="w-3.5 h-3.5" /> Shared Travel Plan
          </div>
          <h1 className="font-display text-xl font-bold text-snow">{linkedPlan.name}</h1>
          {linkedPlan.description && <p className="text-xs font-functional text-slate mt-0.5">{linkedPlan.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-label rounded-lg ${
            isEditMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-teal/10 border-teal/30 text-teal'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" /> {isEditMode ? "Edit Access" : "View Only"}
          </div>
          <Button variant="secondary" onClick={triggerExport} className="text-xs">
            <FileDown className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <nav className="w-44 shrink-0 bg-navy-light border border-border rounded-2xl p-2 space-y-0.5 sticky top-4">
          {TAB_META.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setCurrentSection(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-label font-medium tracking-wide transition-all text-left ${
                currentSection === key
                  ? 'bg-teal text-navy shadow-[0_0_8px_rgba(14,165,176,0.25)]'
                  : 'text-slate hover:text-mist hover:bg-surface'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}

          <div className="pt-3 mt-2 border-t border-border/60 px-1 space-y-1.5">
            <p className="font-label text-[10px] uppercase tracking-wider text-slate px-2">Budget</p>
            <div className="flex justify-between px-2 text-[11px] font-functional text-slate">
              <span>Total</span><span className="font-mono text-mist">{linkedPlan.budget}</span>
            </div>
            <div className="flex justify-between px-2 text-[11px] font-functional text-slate">
              <span>Spent</span><span className="font-mono text-danger">{linkedPlan.totalExpenses}</span>
            </div>
            <div className={`flex justify-between px-2 text-[11px] font-label font-semibold ${linkedPlan.remainingBudget < 0 ? 'text-danger' : 'text-teal'}`}>
              <span>{linkedPlan.remainingBudget < 0 ? 'Over' : 'Left'}</span>
              <span className="font-mono">{linkedPlan.remainingBudget}</span>
            </div>
          </div>
        </nav>

        <div className="flex-1 min-w-0 bg-navy-light border border-border rounded-2xl p-6 min-h-[400px]">
          {currentSection === 'overview' && (
            <div className="space-y-6">
              {isEditMode && editingPlan ? (
                <form onSubmit={commitPlanEdit} className="space-y-4">
                  <h3 className="font-label text-sm font-semibold text-snow border-b border-border pb-2">Edit Plan</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Name *</label><input required value={planEditForm.name} onChange={e => setPlanEditForm({...planEditForm, name: e.target.value})} className={inputCls} /></div>
                    <div><label className={labelCls}>Budget</label><input type="number" min="0" value={planEditForm.budget} onChange={e => setPlanEditForm({...planEditForm, budget: Number(e.target.value)})} className={inputCls} /></div>
                    <div><label className={labelCls}>Start Date *</label><input type="date" required value={planEditForm.startDate} onChange={e => setPlanEditForm({...planEditForm, startDate: e.target.value})} className={inputCls} /></div>
                    <div><label className={labelCls}>End Date *</label><input type="date" required value={planEditForm.endDate} onChange={e => setPlanEditForm({...planEditForm, endDate: e.target.value})} className={inputCls} /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea value={planEditForm.description} onChange={e => setPlanEditForm({...planEditForm, description: e.target.value})} rows={2} className={`${inputCls} resize-none`} /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>Notes</label><textarea value={planEditForm.notes} onChange={e => setPlanEditForm({...planEditForm, notes: e.target.value})} rows={3} className={`${inputCls} resize-none`} /></div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="secondary" className="text-xs" onClick={() => setEditingPlan(false)}><X className="w-3 h-3" /> Cancel</Button>
                    <Button type="submit" className="text-xs"><Save className="w-3 h-3" /> Save</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-label text-base font-semibold text-snow">Notes</h3>
                    {isEditMode && <Button variant="secondary" className="text-xs" onClick={startEditPlan}><Pencil className="w-3 h-3" /> Edit</Button>}
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-4 font-body text-sm text-mist min-h-[100px] whitespace-pre-wrap">
                    {linkedPlan.notes || "No notes."}
                  </div>
                  <div className="text-xs font-functional text-slate flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal/60" />
                    <span>{linkedPlan.startDate?.substring(0, 10)} — {linkedPlan.endDate?.substring(0, 10)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentSection === 'destinations' && (
            <div className="space-y-5">
              {isEditMode && (
                <form onSubmit={insertDestination} className="bg-surface border border-border rounded-xl p-4 grid sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2"><label className={labelCls}>Destination</label><input placeholder="e.g. Rome" required value={destForm.name} onChange={e => setDestForm({...destForm, name: e.target.value})} className={inputCls} /></div>
                  <div><label className={labelCls}>Arrival</label><input type="date" required value={destForm.arrivalDate} onChange={e => setDestForm({...destForm, arrivalDate: e.target.value})} className={inputCls} /></div>
                  <div><label className={labelCls}>Departure</label><input type="date" required value={destForm.departureDate} onChange={e => setDestForm({...destForm, departureDate: e.target.value})} className={inputCls} /></div>
                  <div className="sm:col-span-4 flex justify-end">
                    <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add</Button>
                  </div>
                </form>
              )}
              <div className="space-y-2">
                {linkedPlan.destinations?.map((d: any) => (
                  <div key={d.id} className="p-4 bg-surface border border-border rounded-xl">
                    {editingDestId === d.id ? (
                      <form onSubmit={e => commitDestEdit(e, d.id)} className="grid sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-2"><input required value={destEditForm.name} onChange={e => setDestEditForm({...destEditForm, name: e.target.value})} className={inputCls} /></div>
                        <input type="date" required value={destEditForm.arrivalDate} onChange={e => setDestEditForm({...destEditForm, arrivalDate: e.target.value})} className={inputCls} />
                        <input type="date" required value={destEditForm.departureDate} onChange={e => setDestEditForm({...destEditForm, departureDate: e.target.value})} className={inputCls} />
                        <div className="sm:col-span-4 flex gap-2 justify-end">
                          <Button type="button" variant="secondary" className="text-xs" onClick={() => setEditingDestId(null)}><X className="w-3 h-3" /> Cancel</Button>
                          <Button type="submit" className="text-xs"><Check className="w-3 h-3" /> Save</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-label text-sm font-semibold text-snow">{d.name}</h4>
                          <p className="font-mono text-xs text-slate mt-0.5">{d.arrivalDate?.substring(0, 10)} — {d.departureDate?.substring(0, 10)}</p>
                        </div>
                        {isEditMode && (
                          <div className="flex gap-1">
                            <button onClick={() => startEditDest(d)} className="p-1.5 text-slate hover:text-teal transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => removeDest(d.id)} className="p-1.5 text-slate hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'activities' && (
            <div className="space-y-5">
              {isEditMode && (
                <form onSubmit={insertActivity} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input placeholder="Activity name" required value={actForm.name} onChange={e => setActForm({...actForm, name: e.target.value})} className={inputCls} />
                    <input type="datetime-local" required value={actForm.dateTime} onChange={e => setActForm({...actForm, dateTime: e.target.value})} className={inputCls} />
                    <input placeholder="Location" value={actForm.location} onChange={e => setActForm({...actForm, location: e.target.value})} className={inputCls} />
                  </div>
                  <div className="flex justify-between items-center">
                    <select value={actForm.status} onChange={e => setActForm({...actForm, status: e.target.value as ActivityStatus})}
                      className="bg-navy border border-border text-xs py-2 px-3 font-label text-mist rounded-lg focus:outline-none focus:border-teal">
                      {ACTIVITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add Activity</Button>
                  </div>
                </form>
              )}
              <div className="space-y-2">
                {linkedPlan.activities?.map((a: any) => (
                  <div key={a.id} className="p-4 bg-surface border border-border rounded-xl">
                    {editingActId === a.id ? (
                      <form onSubmit={e => commitActEdit(e, a.id)} className="grid sm:grid-cols-3 gap-3 items-end">
                        <input required value={actEditForm.name} onChange={e => setActEditForm({...actEditForm, name: e.target.value})} className={`${inputCls} w-full`} />
                        <input type="datetime-local" required value={actEditForm.dateTime} onChange={e => setActEditForm({...actEditForm, dateTime: e.target.value})} className={`${inputCls} w-full`} />
                        <input value={actEditForm.location} onChange={e => setActEditForm({...actEditForm, location: e.target.value})} placeholder="Location" className={`${inputCls} w-full`} />
                        <select value={actEditForm.status} onChange={e => setActEditForm({...actEditForm, status: e.target.value as ActivityStatus})}
                          className="bg-navy border border-border text-xs py-2 px-3 font-label text-mist rounded-lg focus:outline-none focus:border-teal">
                          {ACTIVITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="sm:col-span-2 flex gap-2 justify-end">
                          <Button type="button" variant="secondary" className="text-xs" onClick={() => setEditingActId(null)}><X className="w-3 h-3" /> Cancel</Button>
                          <Button type="submit" className="text-xs"><Check className="w-3 h-3" /> Save</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-label text-sm font-medium text-mist block">{a.name}</span>
                          <span className="font-mono text-[11px] text-slate">
                            {a.date?.substring(0, 10)} @ {a.date?.substring(11, 16)}{a.location && a.location !== 'TBD' ? ` · ${a.location}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 border font-label text-[10px] tracking-wider rounded-full bg-surface border-border text-slate">
                            {typeof a.status === 'number' ? STATUS_LABELS[a.status] : a.status}
                          </span>
                          {isEditMode && (
                            <>
                              <button onClick={() => startEditAct(a)} className="p-1 text-slate hover:text-teal"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => removeAct(a.id)} className="p-1 text-slate hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'expenses' && (
            <div className="space-y-5">
              {isEditMode && (
                <form onSubmit={insertExpense} className="bg-surface border border-border rounded-xl p-4 grid sm:grid-cols-3 gap-3">
                  <input placeholder="Expense name" required value={expForm.name} onChange={e => setExpForm({...expForm, name: e.target.value})} className={inputCls} />
                  <input type="number" placeholder="Amount" required min="0.01" step="0.01" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} className={inputCls} />
                  <select value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value as ExpenseCategory})}
                    className="bg-navy border border-border text-sm py-2 px-3 text-mist rounded-lg w-full focus:outline-none focus:border-teal font-mono">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button type="submit" className="text-xs"><DollarSign className="w-3 h-3" /> Add Expense</Button>
                  </div>
                </form>
              )}
              <div className="space-y-2">
                {linkedPlan.expenses?.map((e: any) => (
                  <div key={e.id} className="p-3 bg-surface border border-border rounded-xl">
                    {editingExpId === e.id ? (
                      <form onSubmit={ev => commitExpEdit(ev, e.id)} className="grid sm:grid-cols-3 gap-2 items-end">
                        <input required value={expEditForm.name} onChange={ev => setExpEditForm({...expEditForm, name: ev.target.value})} className={inputCls} />
                        <input type="number" min="0.01" step="0.01" required value={expEditForm.amount} onChange={ev => setExpEditForm({...expEditForm, amount: ev.target.value})} className={inputCls} />
                        <select value={expEditForm.category} onChange={ev => setExpEditForm({...expEditForm, category: ev.target.value as ExpenseCategory})}
                          className="bg-navy border border-border text-sm py-2 px-3 text-mist rounded-lg focus:outline-none focus:border-teal font-mono">
                          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="sm:col-span-3 flex gap-2 justify-end">
                          <Button type="button" variant="secondary" className="text-xs" onClick={() => setEditingExpId(null)}><X className="w-3 h-3" /> Cancel</Button>
                          <Button type="submit" className="text-xs"><Check className="w-3 h-3" /> Save</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium text-mist block">{e.name}</span>
                          <span className="text-[10px] font-label tracking-widest uppercase text-teal/70">
                            {typeof e.category === 'number' ? CATEGORY_LABELS[e.category] : e.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-danger">-{e.amount}</span>
                          {isEditMode && (
                            <>
                              <button onClick={() => startEditExp(e)} className="p-1 text-slate hover:text-teal"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => removeExp(e.id)} className="p-1 text-slate hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'checklist' && (
            <div className="space-y-4">
              {isEditMode && (
                <form onSubmit={insertChecklistItem} className="flex gap-2">
                  <input placeholder="Add item..." required value={checkForm.title} onChange={e => setCheckForm({ title: e.target.value })}
                    className="flex-1 bg-surface border border-border px-3 py-2 text-sm text-mist rounded-lg focus:outline-none focus:border-teal" />
                  <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add</Button>
                </form>
              )}
              <div className="space-y-1.5">
                {linkedPlan.checklistItems?.map((item: any) => {
                  const isItemCompleting = toggleLoadingId === item.id;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-xl text-xs transition-all group ${
                      isEditMode ? 'hover:border-teal/40 bg-surface border-border' : 'bg-surface/40 border-border/30'
                    }`}>
                      <div onClick={() => handleToggleChecklist(item.id, item.isCompleted)} className={`flex items-center gap-3 flex-1 select-none ${isEditMode ? 'cursor-pointer' : ''}`}>
                        {item.isCompleted
                          ? <CheckSquare className={`w-4 h-4 text-teal flex-shrink-0 ${isItemCompleting ? 'animate-pulse' : ''}`} />
                          : <Square className={`w-4 h-4 flex-shrink-0 ${isEditMode ? 'text-slate/50' : 'text-slate/20'} ${isItemCompleting ? 'animate-pulse' : ''}`} />}
                        <span className={`font-body font-medium transition-all ${item.isCompleted ? 'line-through text-slate/40' : 'text-mist'}`}>{item.name}</span>
                      </div>
                      {isEditMode && (
                        <button onClick={() => removeCheckItem(item.id)} className="p-1 text-slate/30 hover:text-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentSection === 'reminders' && (
            <div className="space-y-5 max-w-lg">
              <form onSubmit={pushReminder} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-label text-sm font-semibold text-snow">Set a Reminder</h4>
                <div>
                  <label className={labelCls}>Reminder Text</label>
                  <input required value={reminderForm.text} onChange={e => setReminderForm({...reminderForm, text: e.target.value})} placeholder="e.g. Book hotel" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date & Time</label>
                  <input type="datetime-local" required value={reminderForm.datetime} onChange={e => setReminderForm({...reminderForm, datetime: e.target.value})} className={inputCls} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="text-xs"><Bell className="w-3 h-3" /> Set Reminder</Button>
                </div>
              </form>
              <div className="space-y-2">
                {reminders.length === 0 && <p className="text-xs font-functional text-slate/50 text-center py-4">No reminders set.</p>}
                {reminders.map(r => (
                  <div key={r.id} className={`flex justify-between items-center p-3 border rounded-xl text-sm ${r.fired ? 'opacity-50 bg-surface/30 border-border/20' : 'bg-surface border-border'}`}>
                    <div>
                      <p className="font-label font-medium text-snow text-sm">{r.text}</p>
                      <p className="font-mono text-[11px] text-slate">{r.datetime?.replace('T', ' ')}</p>
                      {r.fired && <span className="text-[10px] font-label text-teal uppercase mt-0.5 block">Fired</span>}
                    </div>
                    <button onClick={() => cancelReminder(r.id)} className="p-1.5 text-slate hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'map' && (
            <TravelMap activities={linkedPlan.activities ?? []} />
          )}

        </div>
      </div>
    </div>
  );
};