import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ReactNode } from 'react';
import { RootState } from '../types';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  // const storedUser = localStorage.getItem('user');
  // const user = storedUser ? JSON.parse(storedUser) : null;
  // console.log(user);
  
  if (!user || !token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 