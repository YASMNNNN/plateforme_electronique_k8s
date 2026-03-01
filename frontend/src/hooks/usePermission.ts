import { useAuth } from '../contexts/AuthContext';
import { hasFeature } from '../config/permissions';

export const usePermission = () => {
  const { user, isAdmin } = useAuth();
  const role = user?.role ?? 'USER';
  const userId = user?.id ?? '';

  const can = (feature: string): boolean => {
    return hasFeature(feature, role);
  };

  return { can, isAdmin, role, userId };
};
