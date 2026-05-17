import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
 
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal border-t-transparent"></div>
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
 
  return <>{children}</>;
};