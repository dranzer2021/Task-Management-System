import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { RootState } from '../types';

interface NavigationItem {
  name: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const Sidebar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', to: '/', icon: HomeIcon },
    { name: 'Tasks', to: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Create Task', to: '/tasks/create', icon: PlusCircleIcon },
    ...(user?.role === 'admin'
      ? [
          { name: 'User Management', to: '/users', icon: UserGroupIcon },
          { name: 'Analytics', to: '/analytics', icon: ChartBarIcon }
        ]
      : [])
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center p-2 text-base font-normal rounded-lg ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon
                  className="w-6 h-6 transition duration-75"
                  aria-hidden="true"
                />
                <span className="ml-3">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="pt-4 mt-4 space-y-2 border-t border-gray-200">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center p-2 text-base font-normal rounded-lg ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Profile Settings</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 