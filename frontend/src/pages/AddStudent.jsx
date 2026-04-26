import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import StudentForm from '../components/StudentForm';

const AddStudent = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post('/students', data);
      showToast('Student added successfully', 'success');
      navigate('/students');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/students');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
        <p className="text-sm text-gray-500 mt-1">Enter the student's details to create a new record.</p>
      </div>

      <StudentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </div>
  );
};

export default AddStudent;
