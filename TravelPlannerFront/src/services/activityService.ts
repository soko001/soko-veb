import api from './api';
import type { Activity, ActivityStatus } from '../models/types';

const statusMap: Record<ActivityStatus, number> = { Planned: 0, Reserved: 1, Completed: 2, Cancelled: 3 };
const reverseStatusMap: Record<number, ActivityStatus> = { 0: 'Planned', 1: 'Reserved', 2: 'Completed', 3: 'Cancelled' };

export const activityService = {
  create: async (planId: number, activity: any): Promise<Activity> => {
    const payload = { ...activity, time: null, status: statusMap[activity.status as ActivityStatus] };
    const res = await api.post(`/api/travel-plans/${planId}/activities`, payload);
    return { ...res.data, status: reverseStatusMap[res.data.status] };
  },
  update: async (planId: number, id: number, activity: any): Promise<Activity> => {
    const payload = { ...activity, time: null, status: statusMap[activity.status as ActivityStatus] };
    const res = await api.put(`/api/travel-plans/${planId}/activities/${id}`, payload);
    return { ...res.data, status: reverseStatusMap[res.data.status] };
  },
  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/activities/${id}`);
  }
};