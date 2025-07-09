import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a simple placeholder for authentication
// In a real app, you would use Cognito or another auth provider
const isAuthenticated = () => {
  // For demo purposes, always return false to redirect to login
  return false;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
