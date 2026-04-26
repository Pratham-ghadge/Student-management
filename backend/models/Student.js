const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', ''],
        default: ''
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        country: { type: String, default: 'India' }
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: [
            'Computer Science', 'Electronics', 'Mechanical',
            'Civil', 'Business Administration', 'Arts', 'Science', 'Other'
        ]
    },
    program: {
        type: String,
        required: [true, 'Program is required'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: 1,
        max: 6
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 12
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
        default: 'Active'
    },
    guardian: {
        name: { type: String, default: '' },
        relation: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Auto-generate studentId
studentSchema.pre('validate', async function (next) {
    if (this.studentId) return next();

    const getDeptCode = (dept) => {
        const map = {
            'Computer Science': 'CS',
            'Electronics': 'EC',
            'Mechanical': 'ME',
            'Civil': 'CE',
            'Business Administration': 'BA',
            'Arts': 'AR',
            'Science': 'SC',
            'Other': 'OT'
        };
        return map[dept] || 'OT';
    };

    try {
        const count = await mongoose.model('Student').countDocuments();
        const paddedCount = String(count + 1).padStart(4, '0');
        this.studentId = `STU-${getDeptCode(this.department)}-${new Date().getFullYear()}-${paddedCount}`;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Student', studentSchema);
