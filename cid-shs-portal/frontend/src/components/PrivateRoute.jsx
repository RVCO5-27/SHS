import { Navigate, useLocation } from 'react-router-dom';
import { mustChangePasswordFromStorage } from '../utils/jwtPayload';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.redirectTo='/admin/login'] — where unauthenticated users go
 */
export default function PrivateRoute({ children, redirectTo = '/admin/login' }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (
    mustChangePasswordFromStorage() &&
    !location.pathname.startsWith('/admin/change-password')
  ) {
    return <Navigate to="/admin/change-password" replace state={{ from: location.pathname }} />;
  }

  return children;
}
