import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guarda de ruta.
 * Acceso permitido si:
 *   - El usuario tiene uno de los roles en `roles` (array), O
 *   - El usuario tiene al menos uno de los permisos en `anyPermission` (array)
 * Si se pasa `permission` (string), también debe tenerlo (AND adicional).
 */
export default function PrivateRoute({ children, roles, permission, anyPermission }) {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const roleOk      = !roles         || roles.includes(user.role);
  const permOk      = !anyPermission || hasAnyPermission(...anyPermission);
  const extraPermOk = !permission    || hasPermission(permission);

  if ((!roleOk && !permOk) || !extraPermOk) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}
