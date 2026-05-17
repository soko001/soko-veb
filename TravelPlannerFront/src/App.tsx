import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';

// Core Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { CreateTravelPlan } from './pages/CreateTravelPlan';
import { PlanDetail } from './pages/PlanDetail';
import { SharedPlanView } from './pages/SharedPlanView';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Gateways */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Token Validation Route (No Route Guards Required) */}
          <Route path="/shared-plans/:token" element={<SharedPlanView />} />

          {/* Core App Protected Routes nested within the custom layout frame */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/travel-plans/create" element={
            <ProtectedRoute>
              <Layout>
                <CreateTravelPlan />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/travel-plans/:id" element={
            <ProtectedRoute>
              <Layout>
                <PlanDetail />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Restricted Matrix */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          } />

          {/* Fallback routing logic */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;