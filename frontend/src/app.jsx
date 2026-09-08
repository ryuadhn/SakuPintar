import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider, hasOAuthCallbackParams, useAuth } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import './index.css';

// Import Pages
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './features/dashboard/Dashboard';
import MultiWallet from './features/wallets/MultiWallet';
import SavingsGoals from './features/savings/SavingsGoals';
import Categories from './features/categories/Categories';
import Reports from './features/reports/Reports';
import AIAdvisor from './features/ai-advisor/AIAdvisor';
import FinancialPlanner from './features/planner/FinancialPlanner';
import BillsCalendar from './features/calendar/BillsCalendar';
import Tasks from './features/tasks/Tasks';

registerSW({ immediate: true });

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading || hasOAuthCallbackParams()) {
    return (
      <div className="app-shell h-screen w-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0e6c4a] border-t-transparent"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading || hasOAuthCallbackParams()) {
    return (
      <div className="app-shell h-screen w-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0e6c4a] border-t-transparent"></div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRoute() {
  const { user, authLoading } = useAuth();
  if (authLoading || hasOAuthCallbackParams()) {
    return (
      <div className="app-shell h-screen w-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0e6c4a] border-t-transparent"></div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            {/* Default Route */}
            <Route path="/" element={<RootRoute />} />

            {/* Auth Routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* App Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/wallets" element={<ProtectedRoute><MultiWallet /></ProtectedRoute>} />
            <Route path="/savings" element={<ProtectedRoute><SavingsGoals /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
            <Route path="/planner" element={<ProtectedRoute><FinancialPlanner /></ProtectedRoute>} />
             <Route path="/calendar" element={<ProtectedRoute><BillsCalendar /></ProtectedRoute>} />
             <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />

            {/* Fallback route */}
            <Route path="*" element={<RootRoute />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
