import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import { useForm } from 'react-hook-form';

const Courses = () => {
  const { isAdmin, user } = useAuth();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      const res = await api.get('/courses', { params });
      setCourses(res.data);
    } catch (error) {
      showToast('Failed to fetch courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, departmentFilter]);

  const handleSearch = (term) => {
    setSearch(term);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    reset({
      courseCode: '',
      courseName: '',
      department: !isAdmin ? user?.department : '',
      credits: 4,
      instructor: '',
      maxEnrollment: 60,
      description: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    reset({
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      credits: course.credits,
      instructor: course.instructor,
      maxEnrollment: course.maxEnrollment,
      description: course.description,
      isActive: course.isActive
    });
    setIsModalOpen(true);
  };

  const onModalSubmit = async (data) => {
    try {
      setModalLoading(true);
      data.courseCode = data.courseCode.toUpperCase();
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, data);
        showToast('Course updated successfully', 'success');
      } else {
        await api.post('/courses', data);
        showToast('Course created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(`/courses/${courseToDelete._id}`);
      showToast('Course deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete course', 'error');
    }
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex w-full md:w-auto gap-4">
          <SearchBar onSearch={handleSearch} placeholder="Search courses..." className="w-full md:w-64" />
          {isAdmin && (
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)} 
              className="block w-40 rounded-md border-gray-300 border py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Business Administration">Business Admin</option>
              <option value="Arts">Arts</option>
              <option value="Science">Science</option>
            </select>
          )}
        </div>
        
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Course
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                    {course.courseCode}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${course.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={course.isActive ? 'Active' : 'Inactive'}></span>
                </div>
                {isAdmin && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={() => openEditModal(course)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button onClick={() => { setCourseToDelete(course); setIsDeleteModalOpen(true); }} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 leading-tight">{course.courseName}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {course.instructor}
              </p>
              <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {course.department}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {course.credits} Credits
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="courseForm" onSubmit={handleSubmit(onModalSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                    <input {...register('courseCode', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase" placeholder="CS101" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
                    <input type="number" {...register('credits', { required: true, min: 1, max: 6 })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input {...register('courseName', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  {isAdmin ? (
                    <select {...register('department', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Arts">Arts</option>
                      <option value="Science">Science</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        disabled
                        value={user?.department || ''}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                      />
                      <input type="hidden" {...register('department')} value={user?.department || ''} />
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                  <input {...register('instructor', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Enrollment</label>
                    <input type="number" {...register('maxEnrollment')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue={60} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" {...register('isActive')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Is Active</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea {...register('description')} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"></textarea>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" form="courseForm" disabled={modalLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70">
                {modalLoading ? 'Saving...' : 'Save Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Course"
        message={`Are you sure you want to delete ${courseToDelete?.courseCode}? All students enrolled in this course will be unenrolled.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default Courses;
