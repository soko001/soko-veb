import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
 
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal border-t-transparent"></div>
      </div>
    );
  }
 
  if (!user || !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
 
  return <>{children}</>;
};
 