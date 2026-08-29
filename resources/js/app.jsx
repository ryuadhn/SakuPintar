import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Store/AuthContext';
import { FinanceProvider } from './Store/FinanceContext';
import './index.css';

// Import Pages
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Dashboard from './Pages/Dashboard';
import MultiWallet from './Pages/MultiWallet';
import SavingsGoals from './Pages/SavingsGoals';
import Categories from './Pages/Categories';
import Reports from './Pages/Reports';
import AIAdvisor from './Pages/AIAdvisor';
import FinancialPlanner from './Pages/FinancialPlanner';
import BillsCalendar from './Pages/BillsCalendar';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            {/* Default Route redirects to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

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

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
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
