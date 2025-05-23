import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TaskDetails from '../pages/TaskDetails';
import CreateTask from '../pages/CreateTask';
import { useEffect } from 'react';
import { loginSuccess } from '../features/auth/authSlice';
import { RootState } from '@/types';

const AppRoutes: React.FC = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = storedUser ? JSON.parse(storedUser) : null;
      dispatch(loginSuccess({ user: user, token: user?.token }));
    }
    // console.log(user);
  }, []);
  
  console.log(user);
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/create"
          element={
            <PrivateRoute>
              <CreateTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:taskId"
          element={
            <PrivateRoute>
              <TaskDetails />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Redirect root to dashboard if logged in, otherwise to login */}
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />

      {/* Catch all route - redirect to dashboard if logged in, otherwise to login */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes; 