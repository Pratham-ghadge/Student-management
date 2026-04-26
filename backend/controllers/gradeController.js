const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Course = require('../models/Course');

// @desc    Get all grades for a student
// @route   GET /api/grades/student/:studentId
const getStudentGrades = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const grades = await Grade.find({ student: req.params.studentId })
            .populate('course', 'courseCode courseName credits department')
            .sort({ academicYear: -1, semester: 1 });

        res.json(grades);
    } catch (error) {
        next(error);
    }
};

// @desc    Create or update a grade
// @route   POST /api/grades
const createOrUpdateGrade = [
    body('student').notEmpty().withMessage('Student ID is required')
        .custom(val => mongoose.Types.ObjectId.isValid(val)).withMessage('Invalid student ID'),
    body('course').notEmpty().withMessage('Course ID is required')
        .custom(val => mongoose.Types.ObjectId.isValid(val)).withMessage('Invalid course ID'),
    body('marks').isFloat({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12'),
    body('academicYear').notEmpty().withMessage('Academic year is required').trim(),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
            }

            const { student, course, marks, semester, academicYear, remarks } = req.body;

            // Check student exists
            const studentExists = await Student.findById(student);
            if (!studentExists) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // RBAC Check
            if (req.user.role === 'staff' && studentExists.department !== req.user.department) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Check course exists
            const courseExists = await Course.findById(course);
            if (!courseExists) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Try to find existing grade
            let grade = await Grade.findOne({ student, course, semester, academicYear });

            if (grade) {
                grade.marks = marks;
                grade.remarks = remarks || '';
                await grade.save();
            } else {
                grade = await Grade.create({ student, course, marks, semester, academicYear, remarks });
            }

            await grade.populate('course', 'courseCode courseName credits department');
            await grade.populate('student', 'firstName lastName studentId');

            res.status(grade.isNew ? 201 : 200).json(grade);
        } catch (error) {
            next(error);
        }
    }
];

// @desc    Update a grade
// @route   PUT /api/grades/:id
const updateGrade = async (req, res, next) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('student');
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && grade.student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.body.marks !== undefined) grade.marks = req.body.marks;
        if (req.body.remarks !== undefined) grade.remarks = req.body.remarks;

        await grade.save();
        await grade.populate('course', 'courseCode courseName credits department');
        await grade.populate('student', 'firstName lastName studentId');

        res.json(grade);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:id
const deleteGrade = async (req, res, next) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('student');
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && grade.student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Grade.findByIdAndDelete(req.params.id);
        res.json({ message: 'Grade deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get grade report for a student
// @route   GET /api/grades/report/:studentId
const getGradeReport = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // RBAC Check
        if (req.user.role === 'staff' && student.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const grades = await Grade.find({ student: req.params.studentId })
            .populate('course', 'courseCode courseName credits department')
            .sort({ academicYear: -1, semester: 1 });

        // Group by academic year
        const gradesByYearMap = {};
        grades.forEach(g => {
            if (!gradesByYearMap[g.academicYear]) {
                gradesByYearMap[g.academicYear] = [];
            }
            gradesByYearMap[g.academicYear].push({
                courseCode: g.course.courseCode,
                courseName: g.course.courseName,
                credits: g.course.credits,
                marks: g.marks,
                grade: g.grade,
                semester: g.semester,
                remarks: g.remarks,
                _id: g._id
            });
        });

        let totalWeightedMarks = 0;
        let totalCredits = 0;

        const gradesByYear = Object.keys(gradesByYearMap).map(year => {
            const yearGrades = gradesByYearMap[year];
            let yearWeightedMarks = 0;
            let yearCredits = 0;

            yearGrades.forEach(g => {
                yearWeightedMarks += g.marks * g.credits;
                yearCredits += g.credits;
                totalWeightedMarks += g.marks * g.credits;
                totalCredits += g.credits;
            });

            const yearGPA = yearCredits > 0
                ? parseFloat((yearWeightedMarks / yearCredits).toFixed(2))
                : 0;

            return {
                academicYear: year,
                grades: yearGrades,
                yearGPA
            };
        });

        const overallGPA = totalCredits > 0
            ? parseFloat((totalWeightedMarks / totalCredits).toFixed(2))
            : 0;

        res.json({
            student: {
                fullName: student.fullName,
                studentId: student.studentId,
                department: student.department,
                program: student.program
            },
            gradesByYear,
            overallGPA,
            totalCredits
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudentGrades,
    createOrUpdateGrade,
    updateGrade,
    deleteGrade,
    getGradeReport
};
