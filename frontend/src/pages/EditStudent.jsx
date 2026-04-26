import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import StudentForm from '../components/StudentForm';

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        // format dateOfBirth for input type="date"
        const data = { ...res.data };
        if (data.dateOfBirth) {
          data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
        }
        if (data.admissionDate) {
          data.admissionDate = new Date(data.admissionDate).toISOString().split('T')[0];
        }
        setInitialData(data);
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to fetch student details', 'error');
        navigate('/students');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate, showToast]);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      await api.put(`/students/${id}`, data);
      showToast('Student updated successfully', 'success');
      navigate(`/students/${id}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/students/${id}`);
  };

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
          <p className="text-sm text-gray-500 mt-1">Update details for {initialData?.studentId}</p>
        </div>
      </div>

      {initialData && (
        <StudentForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default EditStudent;
