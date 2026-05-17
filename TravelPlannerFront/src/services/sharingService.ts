import api from './api';
import type { ShareToken } from '../models/types';

const accessMap: Record<'View' | 'Edit', number> = {
  'View': 0,
  'Edit': 1
};

const reverseAccessMap: Record<number, 'View' | 'Edit'> = {
  0: 'View',
  1: 'Edit'
};

export const sharingService = {
  create: async (payload: { travelPlanId: number; accessLevel: 'View' | 'Edit'; expiresInHours?: number }): Promise<ShareToken> => {
    const backendPayload = {
      ...payload,
      accessLevel: accessMap[payload.accessLevel]
    };
    const response = await api.post('/api/shares', backendPayload);
    return {
      ...response.data,
      accessLevel: payload.accessLevel
    };
  },

  validate: async (token: string): Promise<{ valid: boolean; travelPlanId: number; accessLevel: 'View' | 'Edit' }> => {
    const response = await api.post('/api/shares/validate', { token });
    return {
      ...response.data,
      accessLevel: reverseAccessMap[response.data.accessLevel] || 'View'
    };
  },

  getByPlanId: async (planId: number): Promise<ShareToken[]> => {
    const response = await api.get<any[]>(`/api/shares/plan/${planId}`);
    return response.data.map(token => ({
      ...token,
      accessLevel: reverseAccessMap[token.accessLevel] || 'View'
    }));
  },

  delete: async (tokenId: number): Promise<void> => {
    await api.delete(`/api/shares/${tokenId}`);
  }
};