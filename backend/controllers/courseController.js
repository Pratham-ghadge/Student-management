const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Student = require('../models/Student');

const VALID_DEPARTMENTS = [
    'Computer Science', 'Electronics', 'Mechanical',
    'Civil', 'Business Administration', 'Arts', 'Science', 'Other'
];

// @desc    Get all courses
// @route   GET /api/courses
const getCourses = async (req, res, next) => {
    try {
        const { department, isActive, search } = req.query;
        const filter = {};

        if (req.user.role === 'staff') {
            filter.department = req.user.department;
        } else if (department) {
            filter.department = department;
        }
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { courseCode: { $regex: search, $options: 'i' } },
                { courseName: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(filter).sort({ courseCode: 1 }).lean();

        // Add enrolled count for each course
        const coursesWithCount = await Promise.all(
            courses.map(async (course) => {
                const enrolledCount = await Student.countDocuments({
                    enrolledCourses: course._id
                });
                return { ...course, enrolledCount };
            })
        );

        res.json(coursesWithCount);
    } catch (error) {
        next(error);
    }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && course.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(course);
    } catch (error) {
        next(error);
    }
};

// @desc    Create course
// @route   POST /api/courses
const createCourse = [
    body('courseCode').notEmpty().withMessage('Course code is required').trim(),
    body('courseName').notEmpty().withMessage('Course name is required').trim(),
    body('department').isIn(VALID_DEPARTMENTS).withMessage('Invalid department'),
    body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
    body('instructor').notEmpty().withMessage('Instructor is required').trim(),

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

            const existing = await Course.findOne({ courseCode: req.body.courseCode.toUpperCase() });
            if (existing) {
                return res.status(400).json({ message: 'Course code already exists' });
            }

            const course = await Course.create(req.body);
            res.status(201).json(course);
        } catch (error) {
            next(error);
        }
    }
];

// @desc    Update course
// @route   PUT /api/courses/:id
const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && course.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Prevent staff from changing department
        if (req.user.role === 'staff' && req.body.department && req.body.department !== req.user.department) {
            req.body.department = req.user.department;
        }

        const allowedFields = [
            'courseCode', 'courseName', 'department', 'credits',
            'instructor', 'semester', 'description', 'maxEnrollment', 'isActive'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();
        res.json(course);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && course.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Remove from all students' enrolledCourses
        await Student.updateMany(
            { enrolledCourses: course._id },
            { $pull: { enrolledCourses: course._id } }
        );

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
