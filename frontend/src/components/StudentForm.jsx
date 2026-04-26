import React, { useState } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical',
  'Civil', 'Business Administration', 'Arts', 'Science', 'Other'
];

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required').min(2, 'Min 2 chars'),
  lastName: yup.string().required('Last name is required').min(2, 'Min 2 chars'),
  email: yup.string().required('Email is required').email('Invalid email address'),
  phone: yup.string()
    .test('is-valid-phone', 'Invalid phone number', (value) => !value || /^[0-9+\-\s()]{7,15}$/.test(value)),
  department: yup.string().required('Department is required').oneOf(DEPARTMENTS, 'Invalid department'),
  program: yup.string().required('Program is required'),
  year: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Year is required')
    .min(1, 'Min 1')
    .max(6, 'Max 6'),
  semester: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Semester is required')
    .min(1, 'Min 1')
    .max(12, 'Max 12'),
  gender: yup.string(),
  dateOfBirth: yup.string(),
  status: yup.string(),
  address: yup.object().shape({
    street: yup.string(),
    city: yup.string(),
    state: yup.string(),
    pincode: yup.string(),
    country: yup.string(),
  }),
  guardian: yup.object().shape({
    name: yup.string(),
    relation: yup.string(),
    phone: yup.string(),
    email: yup.string(),
  })
});

const StudentForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { user, isAdmin } = useAuth();
  const [addressOpen, setAddressOpen] = useState(true);
  const [guardianOpen, setGuardianOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useHookForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      status: 'Active',
      gender: '',
      department: !isAdmin ? user?.department : '',
      address: { country: 'India' },
      guardian: {}
    }
  });

  const InputField = ({ label, name, type = 'text', placeholder = '', isSelect = false, options = [], required = false, ...props }) => {
    // Handling nested errors (e.g. address.city)
    const errorPath = name.split('.');
    let errorObj = errors;
    for (const key of errorPath) {
      if (errorObj) errorObj = errorObj[key];
    }
    const errorMessage = errorObj?.message;

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isSelect ? (
          <select
            {...register(name)}
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errorMessage ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            {...register(name)}
            placeholder={placeholder}
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errorMessage ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            {...props}
          />
        )}
        {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      
      {/* Section 1: Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField label="First Name" name="firstName" required />
          <InputField label="Last Name" name="lastName" required />
          <InputField label="Email" name="email" type="email" required />
          <InputField label="Phone" name="phone" placeholder="+91 9876543210" />
          <InputField label="Date of Birth" name="dateOfBirth" type="date" />
          <InputField label="Gender" name="gender" isSelect options={['Male', 'Female', 'Other']} />
        </div>
      </div>

      {/* Section 2: Academic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Academic Information</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          {isAdmin ? (
            <InputField label="Department" name="department" isSelect options={DEPARTMENTS} required />
          ) : (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                value={user?.department || ''}
                className="block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              />
              <input type="hidden" {...register("department")} value={user?.department || ''} />
            </div>
          )}
          <InputField label="Program" name="program" placeholder="B.Tech, MBA, etc." required />
          <InputField label="Year" name="year" type="number" required />
          <InputField label="Semester" name="semester" type="number" required />
          <InputField label="Admission Date" name="admissionDate" type="date" />
          <InputField label="Status" name="status" isSelect options={['Active', 'Inactive', 'Graduated', 'Suspended']} />
        </div>
      </div>

      {/* Section 3: Address */}
      <div>
        <button
          type="button"
          onClick={() => setAddressOpen(!addressOpen)}
          className="flex w-full items-center justify-between text-lg font-medium text-gray-900 border-b pb-2 mb-4 focus:outline-none"
        >
          <span>Address Details</span>
          <svg className={`h-5 w-5 transform transition-transform ${addressOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {addressOpen && (
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <InputField label="Street" name="address.street" />
            <InputField label="City" name="address.city" />
            <InputField label="State" name="address.state" />
            <InputField label="Pincode" name="address.pincode" />
            <div className="sm:col-span-2">
              <InputField label="Country" name="address.country" defaultValue="India" />
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Guardian Information */}
      <div>
        <button
          type="button"
          onClick={() => setGuardianOpen(!guardianOpen)}
          className="flex w-full items-center justify-between text-lg font-medium text-gray-900 border-b pb-2 mb-4 focus:outline-none"
        >
          <span>Guardian Information</span>
          <svg className={`h-5 w-5 transform transition-transform ${guardianOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {guardianOpen && (
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <InputField label="Guardian Name" name="guardian.name" />
            <InputField label="Relation" name="guardian.relation" placeholder="Father, Mother, etc." />
            <InputField label="Phone" name="guardian.phone" />
            <InputField label="Email" name="guardian.email" type="email" />
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Student'
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
