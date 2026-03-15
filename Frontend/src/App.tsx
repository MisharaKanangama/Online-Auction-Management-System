import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import EditAuctionPage from './pages/EditAuctionPage';
import ProfilePage from './pages/ProfilePage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route Component (redirect to home if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          } />

          {/* Protected Routes with Layout */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
          
          {/* Auction Detail Page */}
          <Route path="/auctions/:id" element={<Layout><AuctionDetailPage /></Layout>} />
          
          {/* Edit Auction Page */}
          <Route path="/auctions/:id/edit" element={
            <ProtectedRoute>
              <Layout><EditAuctionPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Create Auction Page */}
          <Route path="/create-auction" element={
            <ProtectedRoute>
              <Layout><CreateAuctionPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Profile Page */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
