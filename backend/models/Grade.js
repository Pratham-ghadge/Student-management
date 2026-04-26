const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required']
    },
    marks: {
        type: Number,
        required: [true, 'Marks are required'],
        min: 0,
        max: 100
    },
    grade: {
        type: String
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 12
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        trim: true
    },
    remarks: {
        type: String,
        default: '',
        maxlength: 300
    }
}, {
    timestamps: true
});

// Compute grade letter from marks before saving
gradeSchema.pre('save', function (next) {
    if (this.marks >= 90) this.grade = 'A+';
    else if (this.marks >= 80) this.grade = 'A';
    else if (this.marks >= 70) this.grade = 'B+';
    else if (this.marks >= 60) this.grade = 'B';
    else if (this.marks >= 50) this.grade = 'C';
    else this.grade = 'F';
    next();
});

// Prevent duplicate grade for same student+course+semester+year
gradeSchema.index(
    { student: 1, course: 1, semester: 1, academicYear: 1 },
    { unique: true }
);

module.exports = mongoose.model('Grade', gradeSchema);
