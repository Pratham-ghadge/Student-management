const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: [
            'Computer Science', 'Electronics', 'Mechanical',
            'Civil', 'Business Administration', 'Arts', 'Science', 'Other'
        ]
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: 1,
        max: 6
    },
    instructor: {
        type: String,
        required: [true, 'Instructor is required'],
        trim: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 12
    },
    description: {
        type: String,
        default: '',
        maxlength: 500
    },
    maxEnrollment: {
        type: Number,
        default: 60
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
