import api from './api';
import type { User, TravelPlan } from '../models/types';

export const adminService = {
  getAllUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/api/admin/users');
    return res.data;
  },
  getAllPlans: async (): Promise<TravelPlan[]> => {
    const res = await api.get<TravelPlan[]>('/api/admin/travel-plans');
    return res.data;
  },
  deactivateUser: async (userId: number): Promise<void> => {
    await api.put(`/api/users/${userId}/deactivate`);
  },
  deletePlan: async (planId: number): Promise<void> => {
    await api.delete(`/api/admin/travel-plans/${planId}`);
  }
};