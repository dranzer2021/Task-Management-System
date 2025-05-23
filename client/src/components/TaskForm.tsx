import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, updateTask } from '../features/tasks/taskSlice';
import { Task, User, TaskFormData, RootState } from '../types';
import LoadingSpinner from './LoadingSpinner';
import api from '../utils/api';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
}

const TaskForm = ({ task, onClose }: TaskFormProps) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'low',
    dueDate: '',
    assignedTo: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority || 'low',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedTo: task.assignedTo?._id || ''
      });
    }
  }, [task]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await api.get('/users/assignable');
        if (response.data) {
          setUsers(response.data.map((user: User) => ({
            _id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          })));
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || undefined,
        assignedTo: formData.assignedTo || undefined
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks${task ? `/${task._id}` : ''}`, {
        method: task ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save task');
      }

      dispatch(task ? updateTask(data) : addTask(data));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoadingUsers) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              id="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              id="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
              Assign To
            </label>
            <select
              name="assignedTo"
              id="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
          >
            {task ? 'Update Task' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm; 