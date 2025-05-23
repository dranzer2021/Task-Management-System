import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTasksStart, fetchTasksSuccess, fetchTasksFailure, deleteTask } from '../features/tasks/taskSlice';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  FlagIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { RootState, Task } from '../types';

interface Filters {
  status: string;
  priority: string;
  dueDate: string;
}

interface SortConfig {
  key: keyof Task | '';
  direction: 'asc' | 'desc';
}

interface SortableTask extends Task {
  [key: string]: any;
}

const TaskDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tasks, isLoading, error } = useSelector((state: RootState) => state.tasks);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    priority: '',
    dueDate: ''
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: '',
    direction: 'asc'
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        dispatch(fetchTasksStart());
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        const data = await response.json();
        console.log(data);
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch tasks');
        }

        dispatch(fetchTasksSuccess(data.tasks));
      } catch (err) {
        dispatch(fetchTasksFailure(err instanceof Error ? err.message : 'An error occurred'));
      }
    };

    if (user?.token) {
      fetchTasks();
    }
  }, [dispatch, user]);

  const handleCreateTask = (): void => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task): void => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleViewTask = (taskId: string): void => {
    navigate(`/tasks/${taskId}`);
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete task');
        }

        dispatch(deleteTask(taskId));
      } catch (err) {
        console.error('Error deleting task:', err);
        alert(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleSort = (key: keyof Task): void => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.status) {
      result = result.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(task => task.priority === filters.priority);
    }
    if (filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      result = result.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        switch (filters.dueDate) {
          case 'today':
            return dueDate >= today && dueDate < tomorrow;
          case 'week':
            return dueDate >= today && dueDate < nextWeek;
          case 'overdue':
            return dueDate < today;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const taskA = a as SortableTask;
        const taskB = b as SortableTask;

        if (sortConfig.key === 'dueDate') {
          const dateA = taskA.dueDate ? new Date(taskA.dueDate) : new Date(0);
          const dateB = taskB.dueDate ? new Date(taskB.dueDate) : new Date(0);
          return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }
        
        const valueA = taskA[sortConfig.key];
        const valueB = taskB[sortConfig.key];
        
        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valueB === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [tasks, filters, sortConfig]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 lg:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>

              {isFilterMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">All</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <select
                        value={filters.dueDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">All</option>
                        <option value="today">Due Today</option>
                        <option value="week">Due This Week</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFilters({ status: '', priority: '', dueDate: '' })}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateTask}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Task
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-auto sm:rounded-md">
          <div className="border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('title')}
                    >
                      Title
                      {sortConfig.key === 'title' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> :
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('priority')}
                    >
                      <FlagIcon className="h-4 w-4 mr-1" />
                      Priority
                      {sortConfig.key === 'priority' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> :
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('status')}
                    >
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> :
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('dueDate')}
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Due Date
                      {sortConfig.key === 'dueDate' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> :
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 overflow-x-auto">
                {filteredAndSortedTasks?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No tasks found. Create your first task!
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTasks?.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => handleViewTask(task._id)}>
                              {task.title}
                            </div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority || 'low'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'todo' ? 'To Do' : 
                           task.status === 'in_progress' ? 'In Progress' : 
                           task.status === 'completed' ? 'Completed' : 
                           task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                      {/* Show buttons on medium and larger screens */}
                      <div className="hidden md:flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleViewTask(task._id)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900 rounded"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900 rounded"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900 rounded"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Dropdown menu for small screens */}
                      <div className="relative md:hidden">
                        <details className="dropdown">
                          <summary className="cursor-pointer px-3 py-1 bg-gray-100 rounded">Actions</summary>
                          <ul className="absolute bg-white border rounded shadow right-0 z-10 w-32 mt-2">
                            <li>
                              <button
                                type="button"
                                onClick={() => handleViewTask(task._id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              >
                                View
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleEditTask(task)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task._id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                              >
                                Delete
                              </button>
                            </li>
                          </ul>
                        </details>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm task={selectedTask || undefined} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default TaskDashboard; 