import api from './api';
import type { Activity, ActivityStatus } from '../models/types';

const statusMap: Record<ActivityStatus, number> = {
  'Planned': 0,
  'Reserved': 1,
  'Completed': 2,
  'Cancelled': 3
};

const reverseStatusMap: Record<number, ActivityStatus> = {
  0: 'Planned',
  1: 'Reserved',
  2: 'Completed',
  3: 'Cancelled'
};

export const activityService = {
  getByPlanId: async (planId: number): Promise<Activity[]> => {
    const response = await api.get<any[]>(`/api/travel-plans/${planId}/activities`);
    return response.data.map(item => ({
      ...item,
      status: reverseStatusMap[item.status] || 'Planned'
    }));
  },

  create: async (planId: number, activity: Omit<Activity, 'id' | 'travelPlanId'>): Promise<Activity> => {
    const payload = {
      ...activity,
      status: statusMap[activity.status]
    };
    const response = await api.post(`/api/travel-plans/${planId}/activities`, payload);
    return { ...response.data, status: activity.status };
  },

  update: async (planId: number, id: number, activity: Partial<Activity>): Promise<Activity> => {
    const payload = {
      ...activity,
      status: activity.status ? statusMap[activity.status] : undefined
    };
    const response = await api.put(`/api/travel-plans/${planId}/activities/${id}`, payload);
    return { 
      ...response.data, 
      status: activity.status || reverseStatusMap[response.data.status] 
    };
  },

  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/activities/${id}`);
  }
};