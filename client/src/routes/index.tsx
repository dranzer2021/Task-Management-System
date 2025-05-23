import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import UserDashboard from '../pages/UserDashboard';
import TaskDashboard from '../pages/TaskDashboard';
import TaskDetails from '../pages/TaskDetails';
import CreateTask from '../pages/CreateTask';
import { useEffect, useState } from 'react';
import { loginSuccess } from '../features/auth/authSlice';
import { RootState } from '../types';

const AppRoutes: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = storedUser ? JSON.parse(storedUser) : null;
      dispatch(loginSuccess({ user: user, token: user?.token }));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={'/dashboard'} replace/>} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={'/dashboard'} replace/>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><TaskDashboard /></PrivateRoute>} />
        <Route path="/tasks/create" element={<PrivateRoute><CreateTask /></PrivateRoute>} />
        <Route path="/tasks/:taskId" element={<PrivateRoute><TaskDetails /></PrivateRoute>} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 