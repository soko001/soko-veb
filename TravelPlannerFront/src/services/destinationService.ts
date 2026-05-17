import api from './api';
import type { Destination } from '../models/types';

export const destinationService = {
  getByPlanId: async (planId: number): Promise<Destination[]> => {
    const res = await api.get<Destination[]>(`/api/travel-plans/${planId}/destinations`);
    return res.data;
  },
  create: async (planId: number, data: Omit<Destination, 'id' | 'travelPlanId'>): Promise<Destination> => {
    const res = await api.post<Destination>(`/api/travel-plans/${planId}/destinations`, data);
    return res.data;
  },
  update: async (planId: number, id: number, data: Partial<Destination>): Promise<Destination> => {
    const res = await api.put<Destination>(`/api/travel-plans/${planId}/destinations/${id}`, data);
    return res.data;
  },
  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/destinations/${id}`);
  }
};