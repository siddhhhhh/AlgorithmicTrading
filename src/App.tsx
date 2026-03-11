import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';

// Page Components
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import StrategyBuilderPage from './pages/StrategyBuilderPage';
import BacktestingPage from './pages/BacktestingPage';
import RiskManagementPage from './pages/RiskManagementPage';
import LearningHubPage from './pages/LearningHubPage';
import CommunityPage from './pages/CommunityPage';
import BillingPage from './pages/BillingPage';
import Portfolio from './pages/Portfolio';
import AIStrategyBuilderPage from './pages/AIStrategyBuilderPage';
import BrokerIntegrationPage from './pages/BrokerIntegrationPage';
import OptionChainPage from './pages/OptionChainPage';
import NewsInsightsPage from './pages/NewsInsightsPage';
import LoadingScreen from './components/ui/LoadingScreen';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) return <LoadingScreen />;

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/market" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
              <Route path="/strategy-builder" element={<ProtectedRoute><StrategyBuilderPage /></ProtectedRoute>} />
              <Route path="/ai-strategy" element={<ProtectedRoute><AIStrategyBuilderPage /></ProtectedRoute>} />
              <Route path="/broker-integration" element={<ProtectedRoute><BrokerIntegrationPage /></ProtectedRoute>} />
              <Route path="/backtesting" element={<ProtectedRoute><BacktestingPage /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/option-chain" element={<ProtectedRoute><OptionChainPage /></ProtectedRoute>} />
              <Route path="/news-insights" element={<ProtectedRoute><NewsInsightsPage /></ProtectedRoute>} />
              <Route path="/risk-management" element={<ProtectedRoute><RiskManagementPage /></ProtectedRoute>} />
              <Route path="/learning" element={<ProtectedRoute><LearningHubPage /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;