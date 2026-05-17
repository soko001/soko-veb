import api from './api';
import type { TravelPlan } from '../models/types';

export const travelPlanService = {
  getAll: async (): Promise<TravelPlan[]> => {
    const response = await api.get<TravelPlan[]>('/api/travel-plans');
    return response.data;
  },

  getById: async (id: number): Promise<TravelPlan> => {
    const response = await api.get<TravelPlan>(`/api/travel-plans/${id}`);
    return response.data;
  },

  create: async (plan: Omit<TravelPlan, 'id' | 'userId' | 'totalExpenses' | 'remainingBudget' | 'createdAt' | 'destinations' | 'activities' | 'expenses' | 'checklistItems'>): Promise<TravelPlan> => {
    const response = await api.post<TravelPlan>('/api/travel-plans', plan);
    return response.data;
  },

  update: async (id: number, plan: Partial<TravelPlan>): Promise<TravelPlan> => {
    const response = await api.put<TravelPlan>(`/api/travel-plans/${id}`, plan);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${id}`);
  }
};