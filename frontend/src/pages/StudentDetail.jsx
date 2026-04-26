import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Grades state
  const [gradeReport, setGradeReport] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Enroll modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      setStudent(res.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch student details', 'error');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'grades' && !gradeReport) {
      const fetchGrades = async () => {
        try {
          setLoadingGrades(true);
          const res = await api.get(`/grades/report/${id}`);
          setGradeReport(res.data);
        } catch (error) {
          showToast('Failed to load grades', 'error');
        } finally {
          setLoadingGrades(false);
        }
      };
      fetchGrades();
    }
  }, [activeTab, id, gradeReport]);

  const handleOpenEnrollModal = async () => {
    try {
      const res = await api.get('/courses?isActive=true');
      const enrolledIds = student.enrolledCourses.map(c => c._id);
      const notEnrolled = res.data.filter(c => !enrolledIds.includes(c._id));
      setAvailableCourses(notEnrolled);
      setIsEnrollModalOpen(true);
    } catch (error) {
      showToast('Failed to load courses', 'error');
    }
  };

  const handleEnrollConfirm = async () => {
    if (!selectedCourseId) {
      showToast('Please select a course', 'warning');
      return;
    }
    try {
      setEnrollLoading(true);
      const res = await api.post(`/students/${id}/enroll/${selectedCourseId}`);
      setStudent(res.data);
      showToast('Enrolled successfully', 'success');
      setIsEnrollModalOpen(false);
      setSelectedCourseId('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to enroll', 'error');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course?')) return;
    try {
      const res = await api.delete(`/students/${id}/enroll/${courseId}`);
      setStudent(res.data);
      showToast('Unenrolled successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to unenroll', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${id}`);
      showToast('Student deleted successfully', 'success');
      navigate('/students');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete student', 'error');
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 8) return 'text-green-600';
    if (gpa >= 6) return 'text-blue-600';
    if (gpa >= 5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeBadge = (grade) => {
    if (!grade) return '-';
    let color = 'bg-gray-100 text-gray-800';
    if (['A+', 'A'].includes(grade)) color = 'bg-green-100 text-green-800';
    else if (['B+', 'B'].includes(grade)) color = 'bg-blue-100 text-blue-800';
    else if (grade === 'C') color = 'bg-amber-100 text-amber-800';
    else if (grade === 'F') color = 'bg-red-100 text-red-800';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{grade}</span>;
  };

  if (loading || !student) {
    return (
      <div className="p-6">
        <div className="h-40 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse mb-6"></div>
        <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
          {getInitials(student.firstName, student.lastName)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-semibold text-gray-900">{student.fullName}</h2>
          <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2 items-center">
            <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              {student.studentId}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-700">{student.department}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-700">{student.program}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-700">Year {student.year}, Sem {student.semester}</span>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            student.status === 'Active' ? 'bg-green-100 text-green-800' :
            student.status === 'Inactive' ? 'bg-gray-100 text-gray-700' :
            student.status === 'Graduated' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${
              student.status === 'Active' ? 'bg-green-500' :
              student.status === 'Inactive' ? 'bg-gray-500' :
              student.status === 'Graduated' ? 'bg-blue-500' :
              'bg-red-500'
            }`}></span>
            {student.status}
          </span>
          <div className="flex gap-2">
            <Link
              to={`/students/${student._id}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Link>
            {isAdmin && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700"
              >
                <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-6" aria-label="Tabs">
            {['overview', 'courses', 'grades'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } capitalize`}
              >
                {tab === 'courses' ? 'Enrolled Courses' : tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Personal Details</h3>
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.email}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.phone || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.gender || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Admission Date</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '-'}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Address</h3>
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Street</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.address?.street || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">City</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.address?.city || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">State</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.address?.state || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Pincode</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.address?.pincode || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Country</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{student.address?.country || 'India'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {student.guardian && student.guardian.name && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-slate-300 pb-2">Guardian Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm text-gray-900 mt-1">{student.guardian.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Relation</p>
                      <p className="text-sm text-gray-900 mt-1">{student.guardian.relation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-1">{student.guardian.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 mt-1">{student.guardian.email || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Current Enrollments</h3>
                <button
                  onClick={handleOpenEnrollModal}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Enroll in Course
                </button>
              </div>

              {student.enrolledCourses?.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {student.enrolledCourses.map((course) => (
                        <tr key={course._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{course.courseCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.courseName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleUnenroll(course._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Unenroll
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses enrolled</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by enrolling this student in a course.</p>
                </div>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div>
              {loadingGrades ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : gradeReport ? (
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 text-center shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Overall GPA</h3>
                    <p className={`text-5xl font-bold ${getGPAColor(gradeReport.overallGPA)}`}>
                      {gradeReport.overallGPA}
                    </p>
                    <p className="text-sm text-blue-600 mt-2">Total Credits: {gradeReport.totalCredits}</p>
                  </div>

                  {gradeReport.gradesByYear.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No grades recorded yet.</div>
                  ) : (
                    gradeReport.gradesByYear.map((yearGroup) => (
                      <div key={yearGroup.academicYear} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">{yearGroup.academicYear}</h4>
                          <span className="text-sm font-medium text-gray-600">Year GPA: <span className={getGPAColor(yearGroup.yearGPA)}>{yearGroup.yearGPA}</span></span>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Semester</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {yearGroup.grades.map((grade) => (
                              <tr key={grade._id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{grade.courseName}</div>
                                  <div className="text-xs font-mono text-gray-500">{grade.courseCode}</div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-500">{grade.semester}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-900">{grade.marks}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-center">{getGradeBadge(grade.grade)}</td>
                                <td className="px-6 py-3 text-sm text-gray-500 truncate max-w-[200px]">{grade.remarks || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">Failed to load grade report.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enroll in Course</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              {availableCourses.length > 0 ? (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 border px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">-- Choose a course --</option>
                  {availableCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName} ({course.department})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                  No courses available to enroll. Student might be enrolled in all active courses.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsEnrollModalOpen(false); setSelectedCourseId(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollConfirm}
                disabled={!selectedCourseId || enrollLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {enrollLoading ? 'Enrolling...' : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.fullName}? This will also delete all of their grades permanently.`}
        confirmText="Delete permanently"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default StudentDetail;
