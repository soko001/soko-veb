import api from './api';
import type { TravelPlan, User } from '../models/types';

export const adminService = {
  getAllPlans: async (): Promise<TravelPlan[]> => {
    const response = await api.get<TravelPlan[]>('/api/admin/travel-plans');
    return response.data;
  },

  getPlanById: async (id: number): Promise<TravelPlan> => {
    const response = await api.get<TravelPlan>(`/api/admin/travel-plans/${id}`);
    return response.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/travel-plans/${id}`);
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/users');
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  deactivateUser: async (id: number): Promise<void> => {
    await api.put(`/api/users/${id}/deactivate`);
  }
};