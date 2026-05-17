import api from './api';
import type { Destination } from '../models/types';

export const destinationService = {
  getByPlanId: async (planId: number): Promise<Destination[]> => {
    const response = await api.get<Destination[]>(`/api/travel-plans/${planId}/destinations`);
    return response.data;
  },

  create: async (planId: number, destination: Omit<Destination, 'id' | 'travelPlanId'>): Promise<Destination> => {
    const response = await api.post<Destination>(`/api/travel-plans/${planId}/destinations`, destination);
    return response.data;
  },

  update: async (planId: number, id: number, destination: Partial<Destination>): Promise<Destination> => {
    const response = await api.put<Destination>(`/api/travel-plans/${planId}/destinations/${id}`, destination);
    return response.data;
  },

  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/destinations/${id}`);
  }
};