import api from './api';
import type { ShareToken } from '../models/types';

export const sharingService = {
  createToken: async (travelPlanId: number, accessLevel: number): Promise<{ token: string }> => {
    const res = await api.post<{ token: string }>('/api/shares', { travelPlanId, accessLevel });
    return res.data;
  },
  validateToken: async (token: string): Promise<{ isValid: boolean; travelPlanId: number; reason?: string }> => {
    const res = await api.post<{ isValid: boolean; travelPlanId: number; reason?: string }>('/api/shares/validate', { token });
    return res.data;
  },
  getSharedPlan: async (planId: number, token: string): Promise<any> => {
    const res = await api.get(`/api/travel-plans/${planId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};