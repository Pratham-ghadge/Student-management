const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const { convertToCSV } = require('../utils/exportCSV');

const VALID_DEPARTMENTS = [
    'Computer Science', 'Electronics', 'Mechanical',
    'Civil', 'Business Administration', 'Arts', 'Science', 'Other'
];

// @desc    Get all students with pagination, search, filter, sort
// @route   GET /api/students
const getStudents = async (req, res, next) => {
    try {
        let {
            page = 1, limit = 10, search, department, status,
            year, program, sortBy = 'createdAt', order = 'desc'
        } = req.query;

        page = parseInt(page);
        limit = Math.min(parseInt(limit), 50);

        const filter = {};

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        // Role-Based Access Control: Staff can only see their department
        if (req.user.role === 'staff') {
            filter.department = req.user.department;
        } else if (department) {
            filter.department = department;
        }

        if (status) filter.status = status;
        if (year) filter.year = Number(year);
        if (program) filter.program = { $regex: program, $options: 'i' };

        const totalStudents = await Student.countDocuments(filter);
        const totalPages = Math.ceil(totalStudents / limit);

        const sortObj = {};
        sortObj[sortBy] = order === 'asc' ? 1 : -1;

        const students = await Student.find(filter)
            .populate('enrolledCourses', 'courseCode courseName credits')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            students,
            totalStudents,
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get student statistics
// @route   GET /api/students/stats/overview
const getStudentStats = async (req, res, next) => {
    try {
        const totalStudents = await Student.countDocuments();

        const statusCounts = await Student.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const departmentCounts = await Student.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        const yearCounts = await Student.aggregate([
            { $group: { _id: '$year', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const genderCounts = await Student.aggregate([
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newThisMonth = await Student.countDocuments({
            admissionDate: { $gte: thirtyDaysAgo }
        });

        const getCount = (arr, val) => {
            const found = arr.find(item => item._id === val);
            return found ? found.count : 0;
        };

        res.json({
            totalStudents,
            activeStudents: getCount(statusCounts, 'Active'),
            inactiveStudents: getCount(statusCounts, 'Inactive'),
            graduatedStudents: getCount(statusCounts, 'Graduated'),
            suspendedStudents: getCount(statusCounts, 'Suspended'),
            newThisMonth,
            studentsByDepartment: departmentCounts.map(d => ({
                department: d._id,
                count: d.count
            })),
            studentsByYear: yearCounts.map(y => ({
                year: y._id,
                count: y.count
            })),
            genderDistribution: genderCounts.map(g => ({
                gender: g._id || 'Not Specified',
                count: g.count
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export students as CSV
// @route   GET /api/students/export/csv
const exportStudentsCSV = async (req, res, next) => {
    try {
        const students = await Student.find().lean();

        const fields = [
            { label: 'Student ID', value: 'studentId' },
            { label: 'First Name', value: 'firstName' },
            { label: 'Last Name', value: 'lastName' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Department', value: 'department' },
            { label: 'Program', value: 'program' },
            { label: 'Year', value: 'year' },
            { label: 'Semester', value: 'semester' },
            { label: 'Status', value: 'status' },
            { label: 'Gender', value: 'gender' },
            { label: 'Admission Date', value: 'admissionDate' },
            { label: 'City', value: 'address.city' },
            { label: 'Country', value: 'address.country' }
        ];

        const csv = convertToCSV(students, fields);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
const getStudentById = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('enrolledCourses');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied to students outside your department' });
        }

        res.json(student);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new student
// @route   POST /api/students
const createStudent = [
    body('firstName').notEmpty().withMessage('First name is required').trim(),
    body('lastName').notEmpty().withMessage('Last name is required').trim(),
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('department').isIn(VALID_DEPARTMENTS).withMessage('Invalid department'),
    body('program').notEmpty().withMessage('Program is required').trim(),
    body('year').isInt({ min: 1, max: 6 }).withMessage('Year must be between 1 and 6'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12'),
    body('phone').optional({ values: 'falsy' }).matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number'),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
            }

            // RBAC Check: force department if staff
            if (req.user.role === 'staff') {
                req.body.department = req.user.department;
            }

            const existingEmail = await Student.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            const student = await Student.create(req.body);
            res.status(201).json(student);
        } catch (error) {
            next(error);
        }
    }
];

// @desc    Update student
// @route   PUT /api/students/:id
const updateStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Prevent staff from changing department
        if (req.user.role === 'staff' && req.body.department && req.body.department !== req.user.department) {
            req.body.department = req.user.department;
        }

        // If email changed, check uniqueness
        if (req.body.email && req.body.email !== student.email) {
            const emailExists = await Student.findOne({ email: req.body.email, _id: { $ne: student._id } });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use by another student' });
            }
        }

        const allowedFields = [
            'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
            'gender', 'address', 'department', 'program', 'year',
            'semester', 'status', 'guardian'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                student[field] = req.body[field];
            }
        });

        await student.save();
        await student.populate('enrolledCourses');
        res.json(student);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete all grades for this student
        await Grade.deleteMany({ student: student._id });

        // Delete the student
        await Student.findByIdAndDelete(req.params.id);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Enroll student in a course
// @route   POST /api/students/:id/enroll/:courseId
const enrollCourse = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (student.enrolledCourses.includes(req.params.courseId)) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        student.enrolledCourses.push(req.params.courseId);
        await student.save();
        await student.populate('enrolledCourses');

        res.json(student);
    } catch (error) {
        next(error);
    }
};

// @desc    Unenroll student from a course
// @route   DELETE /api/students/:id/enroll/:courseId
const unenrollCourse = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        student.enrolledCourses.pull(req.params.courseId);
        await student.save();
        await student.populate('enrolledCourses');

        res.json(student);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudents,
    getStudentStats,
    exportStudentsCSV,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    enrollCourse,
    unenrollCourse
};
