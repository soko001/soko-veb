import api from './api';
import type { Expense, ExpenseCategory } from '../models/types';

const categoryMap: Record<ExpenseCategory, number> = {
  'Transport': 0,
  'Accommodation': 1,
  'Food': 2,
  'Tickets': 3,
  'Shopping': 4,
  'Other': 5
};

const reverseCategoryMap: Record<number, ExpenseCategory> = {
  0: 'Transport',
  1: 'Accommodation',
  2: 'Food',
  3: 'Tickets',
  4: 'Shopping',
  5: 'Other'
};

export const expenseService = {
  getByPlanId: async (planId: number): Promise<Expense[]> => {
    const response = await api.get<any[]>(`/api/travel-plans/${planId}/expenses`);
    return response.data.map(item => ({
      ...item,
      category: reverseCategoryMap[item.category] || 'Other'
    }));
  },

  create: async (planId: number, expense: Omit<Expense, 'id' | 'travelPlanId'>): Promise<Expense> => {
    const payload = {
      ...expense,
      category: categoryMap[expense.category]
    };
    const response = await api.post(`/api/travel-plans/${planId}/expenses`, payload);
    return { ...response.data, category: expense.category };
  },

  update: async (planId: number, id: number, expense: Partial<Expense>): Promise<Expense> => {
    const payload = {
      ...expense,
      category: expense.category ? categoryMap[expense.category] : undefined
    };
    const response = await api.put(`/api/travel-plans/${planId}/expenses/${id}`, payload);
    return { 
      ...response.data, 
      category: expense.category || reverseCategoryMap[response.data.category] 
    };
  },

  delete: async (planId: number, id: number): Promise<void> => {
    await api.delete(`/api/travel-plans/${planId}/expenses/${id}`);
  }
};