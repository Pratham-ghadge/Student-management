import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import SearchBar from '../components/SearchBar';

const Grades = () => {
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Right panel states
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [availableYears, setAvailableYears] = useState(['2024-25', '2023-24', '2022-23']);
  
  // Add/Edit Grade states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  
  const [formData, setFormData] = useState({
    course: '',
    semester: '',
    marks: '',
    remarks: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get('/students', { params: { search: searchTerm, limit: 20 } });
        setSearchResults(res.data.students);
      } catch (error) {
        console.error(error);
      }
    };
    
    const timeoutId = setTimeout(fetchSearchResults, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadStudentGrades = async (student) => {
    setSelectedStudent(student);
    setEnrolledCourses(student.enrolledCourses || []);
    setIsAddFormOpen(false);
    setEditingGradeId(null);
    
    try {
      setLoadingGrades(true);
      const res = await api.get(`/grades/student/${student._id}`);
      setGrades(res.data);
      
      // Update available academic years based on data
      const years = [...new Set(res.data.map(g => g.academicYear))];
      if (years.length > 0) {
        const sorted = years.sort().reverse();
        setAvailableYears(sorted.includes('2024-25') ? sorted : ['2024-25', ...sorted]);
        if (!sorted.includes(academicYear)) {
          setAcademicYear(sorted[0]);
        }
      }
    } catch (error) {
      showToast('Failed to load grades', 'error');
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!formData.course || !formData.semester || formData.marks === '') {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      const payload = {
        student: selectedStudent._id,
        course: formData.course,
        semester: Number(formData.semester),
        marks: Number(formData.marks),
        academicYear,
        remarks: formData.remarks
      };
      
      await api.post('/grades', payload);
      showToast('Grade saved successfully', 'success');
      
      // Reset form and reload grades
      setFormData({ course: '', semester: '', marks: '', remarks: '' });
      setIsAddFormOpen(false);
      
      const res = await api.get(`/grades/student/${selectedStudent._id}`);
      setGrades(res.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save grade', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveInlineEdit = async (gradeId) => {
    try {
      await api.put(`/grades/${gradeId}`, { marks: Number(editMarks) });
      showToast('Grade updated', 'success');
      setEditingGradeId(null);
      
      const res = await api.get(`/grades/student/${selectedStudent._id}`);
      setGrades(res.data);
    } catch (error) {
      showToast('Failed to update grade', 'error');
    }
  };

  const getInitials = (first, last) => `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

  const filteredGrades = grades.filter(g => g.academicYear === academicYear);
  
  // Calculate Year GPA
  let totalCredits = 0;
  let totalWeightedMarks = 0;
  filteredGrades.forEach(g => {
    const credits = g.course?.credits || 0;
    totalCredits += credits;
    totalWeightedMarks += g.marks * credits;
  });
  const yearGPA = totalCredits > 0 ? (totalWeightedMarks / totalCredits).toFixed(2) : 0;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      
      {/* Left Panel: Search & Select */}
      <div className="w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)]">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Student</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 && searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No students found</div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm text-gray-400">Search to find a student</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {searchResults.map((student) => (
                <li key={student._id}>
                  <button
                    onClick={() => loadStudentGrades(student)}
                    className={`w-full text-left p-4 hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                      selectedStudent?._id === student._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      selectedStudent?._id === student._id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getInitials(student.firstName, student.lastName)}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-medium truncate ${selectedStudent?._id === student._id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {student.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <span className="font-mono text-blue-600">{student.studentId}</span>
                        <span>•</span>
                        <span>{student.department}</span>
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel: Grades Management */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedStudent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full bg-white">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Manage Grades</h2>
            <p className="text-gray-500 max-w-md">Search and select a student from the left panel to view and manage their academic records and grades.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {/* Student Info Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(selectedStudent.firstName, selectedStudent.lastName)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedStudent.fullName}</h2>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-2 items-center mt-1">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{selectedStudent.studentId}</span>
                    <span>•</span>
                    <span>{selectedStudent.department}</span>
                    <span>•</span>
                    <span>{selectedStudent.program}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap pl-2">Academic Year:</label>
                <select 
                  value={academicYear} 
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Grade Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Grade Records</h3>
                <button 
                  onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                  className={`text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    isAddFormOpen ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAddFormOpen ? 'Cancel' : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Grade</>
                  )}
                </button>
              </div>
              
              {isAddFormOpen && (
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm mb-6 bg-gradient-to-r from-blue-50 to-white">
                  <form onSubmit={handleGradeSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Course *</label>
                      <select 
                        required
                        value={formData.course} 
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Enrolled Course</option>
                        {enrolledCourses.map(c => (
                          <option key={c._id || c} value={c._id || c}>
                            {c.courseCode} - {c.courseName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Semester *</label>
                      <input 
                        type="number" min="1" max="12" required
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Marks (0-100) *</label>
                      <input 
                        type="number" min="0" max="100" required step="0.01"
                        value={formData.marks}
                        onChange={(e) => setFormData({...formData, marks: e.target.value})}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div>
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm h-[38px]"
                      >
                        {isSaving ? 'Saving...' : 'Save Grade'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Grades Table */}
            {loadingGrades ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No grades recorded for academic year {academicYear}.</p>
                {!isAddFormOpen && (
                  <button onClick={() => setIsAddFormOpen(true)} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Add a grade now
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sem</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGrades.map((grade) => (
                      <tr key={grade._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-medium">
                          {grade.course?.courseCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {grade.course?.courseName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {grade.semester}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          {editingGradeId === grade._id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input 
                                type="number" 
                                className="w-16 px-2 py-1 border border-blue-400 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                value={editMarks} 
                                onChange={(e) => setEditMarks(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => saveInlineEdit(grade._id)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={() => setEditingGradeId(null)} className="text-gray-400 p-1 hover:bg-gray-100 rounded">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900">{grade.marks}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            ['A+', 'A'].includes(grade.grade) ? 'bg-green-100 text-green-800' :
                            ['B+', 'B'].includes(grade.grade) ? 'bg-blue-100 text-blue-800' :
                            grade.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {grade.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingGradeId !== grade._id && (
                            <button 
                              onClick={() => { setEditingGradeId(grade._id); setEditMarks(grade.marks); }}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 hover:bg-blue-50 rounded"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* GPA Summary */}
            {filteredGrades.length > 0 && !loadingGrades && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md p-6 text-white flex justify-between items-center">
                <div>
                  <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Academic Year {academicYear}</h4>
                  <p className="text-3xl font-bold">GPA: {yearGPA}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">Total Credits</p>
                  <p className="text-xl font-semibold text-white">{totalCredits}</p>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Grades;
