import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import SearchBar from '../components/SearchBar';
import StudentTable from '../components/StudentTable';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const Students = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search,
        department,
        status,
        year,
        sortBy,
        order
      };
      
      const res = await api.get('/students', { params });
      setStudents(res.data.students);
      setTotalPages(res.data.totalPages);
      setTotalStudents(res.data.totalStudents);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, department, status, year, sortBy, order, showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (term) => {
    setSearch(term);
    setCurrentPage(1);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/students/${studentToDelete._id}`);
      showToast('Student deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      // If deleting the last item on a page, go to previous page
      if (students.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchStudents();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete student', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/students/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Failed to export CSV. You might not have permission.', 'error');
    }
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'newest') { setSortBy('createdAt'); setOrder('desc'); }
    else if (val === 'oldest') { setSortBy('createdAt'); setOrder('asc'); }
    else if (val === 'nameAsc') { setSortBy('firstName'); setOrder('asc'); }
    else if (val === 'nameDesc') { setSortBy('firstName'); setOrder('desc'); }
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-80">
          <SearchBar onSearch={handleSearch} placeholder="Search by name, ID or email..." />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
          <Link
            to="/students/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Student
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4">
        {isAdmin && (
          <select value={department} onChange={(e) => { setDepartment(e.target.value); setCurrentPage(1); }} className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border">
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Business Administration">Business Administration</option>
            <option value="Arts">Arts</option>
            <option value="Science">Science</option>
          </select>
        )}
        
        <select value={status} onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }} className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Graduated">Graduated</option>
          <option value="Suspended">Suspended</option>
        </select>

        <select value={year} onChange={(e) => { setYear(e.target.value); setCurrentPage(1); }} className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border">
          <option value="">All Years</option>
          {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>

        <select onChange={handleSortChange} defaultValue="newest" className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border ml-auto">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="nameAsc">Name A-Z</option>
          <option value="nameDesc">Name Z-A</option>
        </select>
      </div>

      {/* Table */}
      <StudentTable students={students} loading={loading} onDelete={handleDeleteClick} />
      
      {/* Pagination */}
      {!loading && totalStudents > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStudents}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentToDelete?.fullName}? This action cannot be undone and will remove all associated grades.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default Students;
