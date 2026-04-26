import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleMobile }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/students/add')) return 'Add Student';
    if (path.startsWith('/students') && path.includes('/edit')) return 'Edit Student';
    if (path.startsWith('/students/')) return 'Student Details';
    if (path.startsWith('/students')) return 'Students';
    if (path.startsWith('/courses')) return 'Courses';
    if (path.startsWith('/grades')) return 'Grades';
    if (path.startsWith('/reports')) return 'Reports';
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <button
          onClick={toggleMobile}
          className="mr-4 md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center hidden md:flex">
        <span className="text-sm text-gray-600 mr-3">{user?.name}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
          {isAdmin ? 'Admin' : 'Staff'}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
