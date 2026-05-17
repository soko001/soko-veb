export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'User' | 'Admin';
  createdAt: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userId: number;
}

export interface TravelPlan {
  id: number;
  userId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  totalExpenses: number;
  remainingBudget: number;
  notes: string;
  createdAt: string;
  destinations: Destination[];
  activities: Activity[];
  expenses: Expense[];
  checklistItems: ChecklistItem[];
}

export interface Destination {
  id: number;
  travelPlanId: number;
  name: string;
  location: string;
  arrivalDate: string;
  departureDate: string;
  description: string;
  notes: string;
}

export type ActivityStatus = 'Planned' | 'Reserved' | 'Completed' | 'Cancelled';

export interface Activity {
  id: number;
  travelPlanId: number;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  estimatedCost: number;
  status: ActivityStatus;
}

export type ExpenseCategory = 'Transport' | 'Accommodation' | 'Food' | 'Tickets' | 'Shopping' | 'Other';

export interface Expense {
  id: number;
  travelPlanId: number;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
}

export interface ChecklistItem {
  id: number;
  travelPlanId: number;
  name: string;
  isCompleted: boolean;
}

export interface ShareToken {
  id: number;
  token: string;
  travelPlanId: number;
  createdByUserId: number;
  accessLevel: 'View' | 'Edit';
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
}