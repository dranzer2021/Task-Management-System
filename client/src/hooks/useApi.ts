import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { AppDispatch } from '../store';

interface ApiError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

type ApiFunction = (...args: any[]) => Promise<any>;

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const request = useCallback(async <T>(apiFunc: ApiFunction, ...args: any[]): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunc(...args);
      return response;
    } catch (err) {
      // Handle unauthorized errors
      const apiError = err as ApiError;
      if (apiError.response?.status === 401) {
        dispatch(logout());
      }
      
      // Set error message
      setError(
        apiError.response?.data?.message || 
        apiError.message || 
        'An unexpected error occurred'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    request,
    clearError
  };
};

export default useApi; 