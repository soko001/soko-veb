import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  FileText, Calendar, DollarSign, MapPin, CheckSquare,
  AlertCircle, Trash2, ArrowLeft, Plus, Square,
  Pencil, X, Check, Bell, FileDown, Save, Globe,
  Activity as ActivityIcon, List, BarChart2, ClipboardList, Share2, Map as MapIcon
} from 'lucide-react';

import { travelPlanService } from '../services/travelPlanService';
import { destinationService } from '../services/destinationService';
import { activityService } from '../services/activityService';
import { expenseService } from '../services/expenseService';
import { checklistService } from '../services/checklistService';
import { sharingService } from '../services/sharingService';
import type { TravelPlan, ActivityStatus, ExpenseCategory, Destination, Activity, Expense } from '../models/types';
import { Button } from '../components/ui/Button';
import { TravelMap } from '../components/TravelMap';

const SafeQRCode = (props: any) => {
  const QRCodeComponent: any = (QRCode as any).default || QRCode;
  try { return <QRCodeComponent {...props} />; }
  catch (e) { return <div className="p-4 border border-dashed border-border text-xs text-center text-slate">QR Code unavailable</div>; }
};

const ACTIVITY_STATUSES: ActivityStatus[] = ['Planned', 'Reserved', 'Completed', 'Cancelled'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Other'];

type ActiveTab = 'overview' | 'destinations' | 'activities' | 'expenses' | 'checklist' | 'share' | 'map' | 'reminders';

interface Reminder { id: string; text: string; datetime: string; fired: boolean; }

const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-mist text-sm focus:outline-none focus:border-teal transition-colors font-mono";
const labelCls = "block text-[11px] font-label uppercase text-slate tracking-wider mb-1";

const statusColors: Record<ActivityStatus, string> = {
  Planned: 'bg-slate/10 text-slate border-slate/20',
  Reserved: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  Completed: 'bg-teal/10 text-teal border-teal/20',
  Cancelled: 'bg-danger/10 text-danger border-danger/20',
};

const TAB_META: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',      label: 'Overview',     icon: <FileText className="w-4 h-4" /> },
  { key: 'destinations',  label: 'Destinations', icon: <MapPin className="w-4 h-4" /> },
  { key: 'activities',    label: 'Activities',   icon: <ActivityIcon className="w-4 h-4" /> },
  { key: 'expenses',      label: 'Expenses',     icon: <DollarSign className="w-4 h-4" /> },
  { key: 'checklist',     label: 'Checklist',    icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'reminders',     label: 'Reminders',    icon: <Bell className="w-4 h-4" /> },
  { key: 'share',         label: 'Share',        icon: <Share2 className="w-4 h-4" /> },
  { key: 'map',           label: 'Map',          icon: <MapIcon className="w-4 h-4" /> },
];

export const PlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [planErr, setPlanErr] = useState<string | null>(null);
  const [isFetchingPlan, setIsFetchingPlan] = useState(true);
  const [tripDetails, setTripDetails] = useState<TravelPlan | null>(null);
  const [currentViewTab, setCurrentViewTab] = useState<ActiveTab>('overview');

  const [sharePermission, setSharePermission] = useState<number>(0);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const [destinationInput, setDestinationInput] = useState({ name: '', arrivalDate: '', departureDate: '', description: '' });
  const [activityInput, setActivityInput] = useState({ name: '', description: '', dateTime: '', location: '', status: 'Planned' as ActivityStatus });
  const [expenseInput, setExpenseInput] = useState({ name: '', amount: '', category: 'Transport' as ExpenseCategory });
  const [checklistInput, setChecklistInput] = useState({ title: '' });

  const [editingPlan, setEditingPlan] = useState(false);
  const [editingDestId, setEditingDestId] = useState<number | null>(null);
  const [editingActId, setEditingActId] = useState<number | null>(null);
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  const [planEditForm, setPlanEditForm] = useState({ name: '', description: '', startDate: '', endDate: '', budget: 0, notes: '' });
  const [destEditForm, setDestEditForm] = useState({ name: '', arrivalDate: '', departureDate: '', description: '' });
  const [actEditForm, setActEditForm] = useState({ name: '', dateTime: '', location: '', status: 'Planned' as ActivityStatus });
  const [expEditForm, setExpEditForm] = useState({ name: '', amount: '', category: 'Transport' as ExpenseCategory });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try { return JSON.parse(localStorage.getItem(`reminders_${id}`) || '[]'); } catch { return []; }
  });
  const [reminderForm, setReminderForm] = useState({ text: '', datetime: '' });
  const reminderTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const retrievePlanData = async () => {
    if (!id) return;
    try {
      setIsFetchingPlan(true);
      setPlanErr(null);
      const data = await travelPlanService.getById(Number(id));
      setTripDetails(data);
    } catch (err: any) {
      setPlanErr("Could not load plan details.");
    } finally {
      setIsFetchingPlan(false);
    }
  };

  useEffect(() => { retrievePlanData(); }, [id]);

  useEffect(() => {
    reminders.forEach(r => { if (!r.fired) scheduleNotification(r); });
    return () => { reminderTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  const saveReminders = (updated: Reminder[]) => {
    setReminders(updated);
    localStorage.setItem(`reminders_${id}`, JSON.stringify(updated));
  };

  const scheduleNotification = (r: Reminder) => {
    const ms = new Date(r.datetime).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Columbo Reminder', { body: r.text });
      } else {
        alert(`Reminder: ${r.text}`);
      }
      saveReminders(reminders.map(x => x.id === r.id ? { ...x, fired: true } : x));
    }, ms);
    reminderTimers.current.set(r.id, t);
  };

  const submitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderForm.text.trim() || !reminderForm.datetime) return;
    const r: Reminder = { id: Date.now().toString(), text: reminderForm.text.trim(), datetime: reminderForm.datetime, fired: false };
    const updated = [...reminders, r];
    saveReminders(updated);
    scheduleNotification(r);
    if (Notification.permission === 'default') Notification.requestPermission();
    setReminderForm({ text: '', datetime: '' });
  };

  const removeReminder = (rid: string) => {
    const t = reminderTimers.current.get(rid);
    if (t) clearTimeout(t);
    reminderTimers.current.delete(rid);
    saveReminders(reminders.filter(r => r.id !== rid));
  };

  const triggerExport = () => {
    if (!tripDetails) return;
    const lines: string[] = [];
    lines.push(`TRAVEL PLAN: ${tripDetails.name}`);
    lines.push(`Period: ${tripDetails.startDate?.substring(0, 10)} — ${tripDetails.endDate?.substring(0, 10)}`);
    lines.push(`Budget: ${tripDetails.budget} | Spent: ${tripDetails.totalExpenses} | Remaining: ${tripDetails.remainingBudget}`);
    if (tripDetails.description) lines.push(`\nDescription: ${tripDetails.description}`);
    if (tripDetails.notes) lines.push(`Notes: ${tripDetails.notes}`);
    if (tripDetails.destinations?.length) {
      lines.push('\n--- DESTINATIONS ---');
      tripDetails.destinations.forEach(d => lines.push(`• ${d.name}: ${d.arrivalDate?.substring(0, 10)} → ${d.departureDate?.substring(0, 10)}`));
    }
    if (tripDetails.activities?.length) {
      lines.push('\n--- ACTIVITIES ---');
      tripDetails.activities.forEach(a => lines.push(`• ${a.name} | ${a.date?.substring(0, 10)} ${a.date?.substring(11, 16)} | ${a.location || 'TBD'} | ${a.status}`));
    }
    if (tripDetails.expenses?.length) {
      lines.push('\n--- EXPENSES ---');
      tripDetails.expenses.forEach(e => lines.push(`• ${e.name} (${e.category}): ${e.amount}`));
    }
    if (tripDetails.checklistItems?.length) {
      lines.push('\n--- CHECKLIST ---');
      tripDetails.checklistItems.forEach(c => lines.push(`[${c.isCompleted ? 'x' : ' '}] ${c.name}`));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tripDetails.name.replace(/\s+/g, '_')}_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removePlan = async () => {
    if (!tripDetails || !window.confirm("Permanently delete this travel plan?")) return;
    try { await travelPlanService.delete(tripDetails.id); navigate('/dashboard'); }
    catch { alert("Failed to delete plan."); }
  };

  const initEditPlan = () => {
    if (!tripDetails) return;
    setPlanEditForm({
      name: tripDetails.name, description: tripDetails.description || '',
      startDate: tripDetails.startDate?.substring(0, 10), endDate: tripDetails.endDate?.substring(0, 10),
      budget: tripDetails.budget, notes: tripDetails.notes || ''
    });
    setEditingPlan(true);
  };

  const confirmPlanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(planEditForm.endDate) < new Date(planEditForm.startDate)) { alert("End date cannot be before start date."); return; }
    if (planEditForm.budget < 0) { alert("Budget cannot be negative."); return; }
    try {
      await travelPlanService.update(Number(id), planEditForm);
      setEditingPlan(false);
      retrievePlanData();
    } catch { alert("Failed to update plan."); }
  };

  const makeShareToken = async () => {
    if (!id) return;
    try {
      setShareLoading(true); setShareError(null);
      const response = await sharingService.createToken(Number(id), sharePermission);
      setGeneratedLink(`${window.location.origin}/shared-plans/${response.token}?perm=${sharePermission}`);
    } catch { setShareError("Failed to generate share token."); }
    finally { setShareLoading(false); }
  };

  const submitDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(destinationInput.departureDate) < new Date(destinationInput.arrivalDate)) { alert("Departure cannot be before arrival."); return; }
    try {
      await destinationService.create(Number(id), { name: destinationInput.name, location: destinationInput.name, arrivalDate: destinationInput.arrivalDate, departureDate: destinationInput.departureDate, description: destinationInput.description || '', notes: '' });
      setDestinationInput({ name: '', arrivalDate: '', departureDate: '', description: '' });
      retrievePlanData();
    } catch { alert("Failed to add destination."); }
  };

  const initEditDest = (d: Destination) => {
    setEditingDestId(d.id);
    setDestEditForm({ name: d.name, arrivalDate: d.arrivalDate?.substring(0, 10), departureDate: d.departureDate?.substring(0, 10), description: d.description || '' });
  };

  const confirmDestEdit = async (e: React.FormEvent, destId: number) => {
    e.preventDefault();
    if (new Date(destEditForm.departureDate) < new Date(destEditForm.arrivalDate)) { alert("Departure cannot be before arrival."); return; }
    try {
      await destinationService.update(Number(id), destId, { name: destEditForm.name, location: destEditForm.name, arrivalDate: destEditForm.arrivalDate, departureDate: destEditForm.departureDate, description: destEditForm.description, notes: '' });
      setEditingDestId(null);
      retrievePlanData();
    } catch { alert("Failed to update destination."); }
  };

  const removeDest = async (destId: number) => {
    if (!window.confirm("Remove this destination?")) return;
    try { await destinationService.delete(Number(id), destId); retrievePlanData(); }
    catch { alert("Failed to remove destination."); }
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityInput.name || !activityInput.dateTime) return;
    try {
      await activityService.create(Number(id), { name: activityInput.name, date: activityInput.dateTime + ':00', time: null, location: activityInput.location || 'TBD', description: '', estimatedCost: 0, status: activityInput.status });
      setActivityInput({ name: '', description: '', dateTime: '', location: '', status: 'Planned' });
      retrievePlanData();
    } catch { alert("Failed to add activity."); }
  };

  const initEditAct = (a: Activity) => {
    setEditingActId(a.id);
    setActEditForm({ name: a.name, dateTime: a.date?.substring(0, 16), location: a.location || '', status: a.status });
  };

  const confirmActEdit = async (e: React.FormEvent, actId: number) => {
    e.preventDefault();
    try {
      await activityService.update(Number(id), actId, { name: actEditForm.name, date: actEditForm.dateTime + ':00', time: null, location: actEditForm.location || 'TBD', status: actEditForm.status });
      setEditingActId(null);
      retrievePlanData();
    } catch { alert("Failed to update activity."); }
  };

  const removeAct = async (actId: number) => {
    if (!window.confirm("Remove this activity?")) return;
    try { await activityService.delete(Number(id), actId); retrievePlanData(); }
    catch { alert("Failed to remove activity."); }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseInput.amount);
    if (!expenseInput.name || amountNum <= 0) { alert("Amount must be greater than zero."); return; }
    try {
      await expenseService.create(Number(id), { name: expenseInput.name, amount: amountNum, category: expenseInput.category, date: new Date().toISOString(), description: '' });
      setExpenseInput({ name: '', amount: '', category: 'Transport' });
      retrievePlanData();
    } catch { alert("Failed to add expense."); }
  };

  const initEditExp = (e: Expense) => {
    setEditingExpId(e.id);
    setExpEditForm({ name: e.name, amount: String(e.amount), category: e.category });
  };

  const confirmExpEdit = async (ev: React.FormEvent, expId: number) => {
    ev.preventDefault();
    const amountNum = Number(expEditForm.amount);
    if (amountNum <= 0) { alert("Amount must be greater than zero."); return; }
    try {
      await expenseService.update(Number(id), expId, { name: expEditForm.name, amount: amountNum, category: expEditForm.category });
      setEditingExpId(null);
      retrievePlanData();
    } catch { alert("Failed to update expense."); }
  };

  const removeExp = async (expId: number) => {
    if (!window.confirm("Remove this expense?")) return;
    try { await expenseService.delete(Number(id), expId); retrievePlanData(); }
    catch { alert("Failed to remove expense."); }
  };

  const submitChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistInput.title.trim()) return;
    try { await checklistService.create(Number(id), checklistInput.title.trim()); setChecklistInput({ title: '' }); retrievePlanData(); }
    catch { alert("Failed to add checklist item."); }
  };

  const handleToggleCheckItem = async (itemId: number, currentStatus: boolean) => {
    try { await checklistService.toggle(Number(id), itemId, !currentStatus); retrievePlanData(); }
    catch { alert("Failed to toggle item."); }
  };

  const removeCheckItem = async (itemId: number) => {
    if (!window.confirm("Remove this item?")) return;
    try { await checklistService.delete(Number(id), itemId); retrievePlanData(); }
    catch { alert("Failed to remove item."); }
  };

  if (isFetchingPlan) return <div className="p-8 text-center font-label text-teal animate-pulse">Loading plan...</div>;
  if (planErr || !tripDetails) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-navy-light border border-border rounded-2xl">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <p className="font-display text-base text-snow">{planErr || "Plan not found."}</p>
        <Button onClick={() => navigate('/dashboard')} variant="secondary"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
      </div>
    );
  }

  const hasBustedBudget = tripDetails.remainingBudget < 0;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-snow">{tripDetails.name}</h1>
          <p className="font-body text-sm text-slate mt-1">{tripDetails.description || "No description provided."}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={triggerExport} className="text-xs">
            <FileDown className="w-4 h-4" /> Export
          </Button>
          <Button variant="danger" onClick={removePlan} className="text-xs">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <nav className="w-44 shrink-0 bg-navy-light border border-border rounded-2xl p-2 space-y-0.5 sticky top-4">
          {TAB_META.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setCurrentViewTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-label font-medium tracking-wide transition-all text-left ${
                currentViewTab === key
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
              <span>Total</span><span className="font-mono text-mist">{tripDetails.budget}</span>
            </div>
            <div className="flex justify-between px-2 text-[11px] font-functional text-slate">
              <span>Spent</span><span className="font-mono text-danger">{tripDetails.totalExpenses}</span>
            </div>
            <div className={`flex justify-between px-2 text-[11px] font-label font-semibold ${hasBustedBudget ? 'text-danger' : 'text-teal'}`}>
              <span>{hasBustedBudget ? 'Over' : 'Left'}</span>
              <span className="font-mono">{tripDetails.remainingBudget}</span>
            </div>
          </div>
        </nav>

        <div className="flex-1 min-w-0 bg-navy-light border border-border rounded-2xl p-6 min-h-[400px]">
          {currentViewTab === 'overview' && (
            <div className="space-y-6">
              {editingPlan ? (
                <form onSubmit={confirmPlanEdit} className="space-y-4">
                  <h3 className="font-label text-sm font-semibold text-snow border-b border-border pb-2">Edit Plan</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Name *</label>
                      <input required value={planEditForm.name} onChange={e => setPlanEditForm({...planEditForm, name: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Budget</label>
                      <input type="number" min="0" value={planEditForm.budget} onChange={e => setPlanEditForm({...planEditForm, budget: Number(e.target.value)})} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Start Date *</label>
                      <input type="date" required value={planEditForm.startDate} onChange={e => setPlanEditForm({...planEditForm, startDate: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>End Date *</label>
                      <input type="date" required value={planEditForm.endDate} onChange={e => setPlanEditForm({...planEditForm, endDate: e.target.value})} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Description</label>
                      <textarea value={planEditForm.description} onChange={e => setPlanEditForm({...planEditForm, description: e.target.value})} rows={2} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Notes</label>
                      <textarea value={planEditForm.notes} onChange={e => setPlanEditForm({...planEditForm, notes: e.target.value})} rows={3} className={`${inputCls} resize-none`} />
                    </div>
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
                    <Button variant="secondary" className="text-xs" onClick={initEditPlan}><Pencil className="w-3 h-3" /> Edit</Button>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-4 font-body text-sm text-mist min-h-[100px] whitespace-pre-wrap">
                    {tripDetails.notes || "No notes yet."}
                  </div>
                  <div className="text-xs font-functional text-slate flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal/60" />
                    <span>{tripDetails.startDate?.substring(0, 10)} — {tripDetails.endDate?.substring(0, 10)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentViewTab === 'destinations' && (
            <div className="space-y-5">
              <form onSubmit={submitDestination} className="grid sm:grid-cols-4 gap-3 bg-surface border border-border rounded-xl p-4 items-end">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Destination Name</label>
                  <input type="text" required value={destinationInput.name} onChange={e => setDestinationInput({...destinationInput, name: e.target.value})} className={inputCls} placeholder="e.g. Paris" />
                </div>
                <div>
                  <label className={labelCls}>Arrival</label>
                  <input type="date" required value={destinationInput.arrivalDate} onChange={e => setDestinationInput({...destinationInput, arrivalDate: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Departure</label>
                  <input type="date" required value={destinationInput.departureDate} onChange={e => setDestinationInput({...destinationInput, departureDate: e.target.value})} className={inputCls} />
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add Destination</Button>
                </div>
              </form>

              <div className="space-y-2">
                {tripDetails.destinations?.map(d => (
                  <div key={d.id} className="bg-surface border border-border rounded-xl p-4">
                    {editingDestId === d.id ? (
                      <form onSubmit={e => confirmDestEdit(e, d.id)} className="grid sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <input required value={destEditForm.name} onChange={e => setDestEditForm({...destEditForm, name: e.target.value})} className={inputCls} />
                        </div>
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
                        <div className="flex gap-1">
                          <button onClick={() => initEditDest(d)} className="p-1.5 text-slate hover:text-teal transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeDest(d.id)} className="p-1.5 text-slate hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentViewTab === 'activities' && (
            <div className="space-y-5">
              <form onSubmit={submitActivity} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Activity name" required value={activityInput.name} onChange={e => setActivityInput({...activityInput, name: e.target.value})} className={inputCls} />
                  <input type="datetime-local" required value={activityInput.dateTime} onChange={e => setActivityInput({...activityInput, dateTime: e.target.value})} className={inputCls} />
                  <input type="text" placeholder="Location" value={activityInput.location} onChange={e => setActivityInput({...activityInput, location: e.target.value})} className={inputCls} />
                </div>
                <div className="flex justify-between items-center">
                  <select value={activityInput.status} onChange={e => setActivityInput({...activityInput, status: e.target.value as ActivityStatus})}
                    className="bg-surface border border-border text-xs py-2 px-3 font-label text-mist rounded-lg focus:outline-none focus:border-teal">
                    {ACTIVITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add Activity</Button>
                </div>
              </form>

              <div className="divide-y divide-border/50">
                {tripDetails.activities?.map(a => (
                  <div key={a.id} className="py-3">
                    {editingActId === a.id ? (
                      <form onSubmit={e => confirmActEdit(e, a.id)} className="grid sm:grid-cols-3 gap-3 items-end">
                        <input required value={actEditForm.name} onChange={e => setActEditForm({...actEditForm, name: e.target.value})} className={inputCls} />
                        <input type="datetime-local" required value={actEditForm.dateTime} onChange={e => setActEditForm({...actEditForm, dateTime: e.target.value})} className={inputCls} />
                        <input value={actEditForm.location} onChange={e => setActEditForm({...actEditForm, location: e.target.value})} placeholder="Location" className={inputCls} />
                        <select value={actEditForm.status} onChange={e => setActEditForm({...actEditForm, status: e.target.value as ActivityStatus})}
                          className="bg-surface border border-border text-xs py-2 px-3 font-label text-mist rounded-lg focus:outline-none focus:border-teal">
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
                          <h5 className="font-label text-sm font-medium text-mist">{a.name}</h5>
                          <span className="font-mono text-xs text-slate">{a.date?.substring(0, 10)} @ {a.date?.substring(11, 16)} · {a.location || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 font-label text-[10px] rounded-full border ${statusColors[a.status] || statusColors.Planned}`}>{a.status}</span>
                          <button onClick={() => initEditAct(a)} className="p-1 text-slate hover:text-teal"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeAct(a.id)} className="p-1 text-slate hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentViewTab === 'expenses' && (
            <div className="space-y-5">
              <form onSubmit={submitExpense} className="grid sm:grid-cols-3 gap-3 bg-surface border border-border rounded-xl p-4 items-end">
                <input type="text" placeholder="Expense name" required value={expenseInput.name} onChange={e => setExpenseInput({...expenseInput, name: e.target.value})} className={inputCls} />
                <input type="number" placeholder="Amount" required min="1" value={expenseInput.amount} onChange={e => setExpenseInput({...expenseInput, amount: e.target.value})} className={inputCls} />
                <select value={expenseInput.category} onChange={e => setExpenseInput({...expenseInput, category: e.target.value as ExpenseCategory})}
                  className="bg-surface border border-border text-sm py-2 px-3 text-mist rounded-lg w-full focus:outline-none focus:border-teal font-mono">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="sm:col-span-3 flex justify-end">
                  <Button type="submit" className="text-xs"><DollarSign className="w-3 h-3" /> Add Expense</Button>
                </div>
              </form>

              <div className="bg-surface border border-border rounded-xl divide-y divide-border/50">
                {tripDetails.expenses?.map(e => (
                  <div key={e.id} className="p-3">
                    {editingExpId === e.id ? (
                      <form onSubmit={ev => confirmExpEdit(ev, e.id)} className="grid sm:grid-cols-3 gap-2 items-end">
                        <input required value={expEditForm.name} onChange={ev => setExpEditForm({...expEditForm, name: ev.target.value})} className={inputCls} />
                        <input type="number" min="0.01" step="0.01" required value={expEditForm.amount} onChange={ev => setExpEditForm({...expEditForm, amount: ev.target.value})} className={inputCls} />
                        <select value={expEditForm.category} onChange={ev => setExpEditForm({...expEditForm, category: ev.target.value as ExpenseCategory})}
                          className="bg-surface border border-border text-sm py-2 px-3 text-mist rounded-lg focus:outline-none focus:border-teal font-mono">
                          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="sm:col-span-3 flex gap-2 justify-end">
                          <Button type="button" variant="secondary" className="text-xs" onClick={() => setEditingExpId(null)}><X className="w-3 h-3" /> Cancel</Button>
                          <Button type="submit" className="text-xs"><Check className="w-3 h-3" /> Save</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-mist">{e.name} <span className="text-xs font-mono text-slate">({e.category})</span></span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-danger text-sm">-{e.amount}</span>
                          <button onClick={() => initEditExp(e)} className="p-1 text-slate hover:text-teal"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeExp(e.id)} className="p-1 text-slate hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentViewTab === 'checklist' && (
            <div className="space-y-4">
              <form onSubmit={submitChecklistItem} className="flex gap-2">
                <input type="text" required placeholder="Add item..." value={checklistInput.title} onChange={e => setChecklistInput({ title: e.target.value })}
                  className="flex-1 bg-surface border border-border px-3 py-2 text-sm text-mist rounded-lg focus:outline-none focus:border-teal" />
                <Button type="submit" className="text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </form>
              <div className="grid sm:grid-cols-2 gap-2">
                {tripDetails.checklistItems?.map(item => (
                  <div key={item.id} className="bg-surface border border-border p-3 rounded-xl flex items-center gap-3 hover:border-teal/40 transition-all group">
                    <div onClick={() => handleToggleCheckItem(item.id, item.isCompleted)} className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                      {item.isCompleted
                        ? <CheckSquare className="w-4 h-4 text-teal flex-shrink-0" />
                        : <Square className="w-4 h-4 text-slate/40 flex-shrink-0" />}
                      <span className={`text-sm ${item.isCompleted ? 'line-through text-slate/40' : 'text-mist'}`}>{item.name}</span>
                    </div>
                    <button onClick={() => removeCheckItem(item.id)} className="p-1 text-slate/30 hover:text-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentViewTab === 'reminders' && (
            <div className="space-y-5 max-w-lg">
              <form onSubmit={submitReminder} className="bg-surface border border-border rounded-xl p-4 space-y-3">
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
                  <div key={r.id} className={`flex justify-between items-center p-3 border rounded-xl text-sm ${r.fired ? 'opacity-50 bg-surface/40 border-border/30' : 'bg-surface border-border'}`}>
                    <div>
                      <p className="font-label font-medium text-snow text-sm">{r.text}</p>
                      <p className="font-mono text-[11px] text-slate">{r.datetime?.replace('T', ' ')}</p>
                      {r.fired && <span className="text-[10px] font-label text-teal uppercase mt-0.5 block">Fired</span>}
                    </div>
                    <button onClick={() => removeReminder(r.id)} className="p-1.5 text-slate hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentViewTab === 'share' && (
            <div className="max-w-md mx-auto text-center space-y-5">
              <h4 className="font-display text-base font-semibold text-snow">Share This Plan</h4>
              <div className="flex justify-center gap-8 py-2">
                <label className="flex items-center gap-2 font-functional text-xs cursor-pointer text-mist">
                  <input type="radio" checked={sharePermission === 0} onChange={() => setSharePermission(0)} className="accent-teal" /> View Only
                </label>
                <label className="flex items-center gap-2 font-functional text-xs cursor-pointer text-mist">
                  <input type="radio" checked={sharePermission === 1} onChange={() => setSharePermission(1)} className="accent-teal" /> Allow Editing
                </label>
              </div>
              <Button onClick={makeShareToken} isLoading={shareLoading} className="text-xs w-full">Generate Share Link</Button>
              {shareError && <p className="text-xs text-danger">{shareError}</p>}
              {generatedLink && (
                <div className="p-4 bg-surface border border-border rounded-xl space-y-4">
                  <div className="text-[11px] font-mono select-all bg-navy p-2 border border-border rounded-lg break-all text-teal">{generatedLink}</div>
                  <div className="bg-white p-3 inline-block rounded-xl border border-border shadow-inner">
                    <SafeQRCode value={generatedLink} size={130} />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentViewTab === 'map' && <TravelMap activities={tripDetails.activities ?? []} />}

        </div>
      </div>
    </div>
  );
};