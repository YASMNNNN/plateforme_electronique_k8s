import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type RoleGuardProps = {
  roles: string[];
  children: React.ReactElement;
};

const RoleGuard = ({ roles, children }: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default RoleGuard;
