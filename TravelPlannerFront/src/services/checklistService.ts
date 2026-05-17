import api from './api';
import type { ChecklistItem } from '../models/types';

export const checklistService = {
  getByPlanId: async (planId: number): Promise<ChecklistItem[]> => {
    const response = await api.get<ChecklistItem[]>(`/api/travel-plans/${planId}/checklist`);
    return response.data;
  },

  create: async (planId: number, name: string): Promise<ChecklistItem> => {
    const response = await api.post<ChecklistItem>(`/api/travel-plans/${planId}/checklist`, { name });
    return response.data;
  },

  update: async (planId: number, id: number, updates: { name?: string; isCompleted?: boolean }): Promise<ChecklistItem> => {
    const response = await api.put<ChecklistItem>(`/api/travel-plans/${planId}/checklist/${id}`, updates);
    return response.data;
  },

  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/checklist/${id}`);
  }
};