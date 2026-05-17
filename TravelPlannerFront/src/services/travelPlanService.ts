import api from './api';
import type { TravelPlan, ActivityStatus, ExpenseCategory } from '../models/types';

const reverseStatusMap: Record<number, ActivityStatus> = { 0: 'Planned', 1: 'Reserved', 2: 'Completed', 3: 'Cancelled' };
const reverseCategoryMap: Record<number, ExpenseCategory> = { 0: 'Transport', 1: 'Accommodation', 2: 'Food', 3: 'Tickets', 4: 'Shopping', 5: 'Other' };

export const travelPlanService = {
  getAll: async (): Promise<TravelPlan[]> => {
    const res = await api.get<TravelPlan[]>('/api/travel-plans');
    return res.data;
  },
  getById: async (id: number): Promise<TravelPlan> => {
    const res = await api.get<any>(`/api/travel-plans/${id}`);
    const data = res.data;
    if (data.activities) {
      data.activities = data.activities.map((a: any) => ({ ...a, status: reverseStatusMap[a.status] || 'Planned' }));
    }
    if (data.expenses) {
      data.expenses = data.expenses.map((e: any) => ({ ...e, category: reverseCategoryMap[e.category] || 'Other' }));
    }
    return data as TravelPlan;
  },
  create: async (plan: Omit<TravelPlan, 'id' | 'userId' | 'totalExpenses' | 'remainingBudget' | 'createdAt' | 'destinations' | 'activities' | 'expenses' | 'checklistItems'>): Promise<TravelPlan> => {
    const res = await api.post<TravelPlan>('/api/travel-plans', plan);
    return res.data;
  },
  update: async (id: number, plan: Partial<TravelPlan>): Promise<TravelPlan> => {
    const res = await api.put<TravelPlan>(`/api/travel-plans/${id}`, plan);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${id}`);
  }
};