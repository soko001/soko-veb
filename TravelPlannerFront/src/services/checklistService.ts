import api from './api';
import type { ChecklistItem } from '../models/types';

export const checklistService = {
  create: async (planId: number, name: string): Promise<ChecklistItem> => {
    const res = await api.post<ChecklistItem>(`/api/travel-plans/${planId}/checklist`, { name });
    return res.data;
  },
  toggle: async (planId: number, id: number, isCompleted: boolean): Promise<ChecklistItem> => {
    const res = await api.put<ChecklistItem>(`/api/travel-plans/${planId}/checklist/${id}`, { isCompleted });
    return res.data;
  },
  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/checklist/${id}`);
  }
};