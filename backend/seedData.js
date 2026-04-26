const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

const User = require('./models/User');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Grade = require('./models/Grade');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const departments = [
  'Computer Science', 'Electronics', 'Mechanical',
  'Civil', 'Business Administration', 'Arts', 'Science'
];

const seedData = async () => {
  try {
    await connectDB();

    // 1. Drop existing collections
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Student.deleteMany();
    await Course.deleteMany();
    await Grade.deleteMany();

    // 2. Create Users
    console.log('Creating users...');
    await User.create([
      { name: 'Admin User', email: 'admin@edutrack.com', password: 'Admin@123', role: 'admin' },
      { name: 'Civil Staff', email: 'staffce@edutrack.com', password: 'Staff@123', role: 'staff', department: 'Civil' },
      { name: 'CS Staff', email: 'staffcs@edutrack.com', password: 'Staff@123', role: 'staff', department: 'Computer Science' }
    ]);

    // 3. Create Courses
    console.log('Creating courses...');
    const courseData = [
      { courseCode: 'CS101', courseName: 'Data Structures', department: 'Computer Science', credits: 4, instructor: 'Dr. Sharma', semester: 1 },
      { courseCode: 'CS102', courseName: 'Algorithms', department: 'Computer Science', credits: 4, instructor: 'Dr. Gupta', semester: 2 },
      { courseCode: 'EC201', courseName: 'Digital Electronics', department: 'Electronics', credits: 3, instructor: 'Prof. Rao', semester: 3 },
      { courseCode: 'EC202', courseName: 'Signals and Systems', department: 'Electronics', credits: 4, instructor: 'Dr. Singh', semester: 4 },
      { courseCode: 'ME301', courseName: 'Thermodynamics', department: 'Mechanical', credits: 3, instructor: 'Dr. Patel', semester: 5 },
      { courseCode: 'ME302', courseName: 'Fluid Mechanics', department: 'Mechanical', credits: 4, instructor: 'Prof. Kumar', semester: 6 },
      { courseCode: 'BA101', courseName: 'Principles of Management', department: 'Business Administration', credits: 3, instructor: 'Dr. Joshi', semester: 1 },
      { courseCode: 'BA102', courseName: 'Financial Accounting', department: 'Business Administration', credits: 4, instructor: 'Prof. Desai', semester: 2 },
      { courseCode: 'CV201', courseName: 'Structural Analysis', department: 'Civil', credits: 4, instructor: 'Dr. Reddy', semester: 3 },
      { courseCode: 'CV202', courseName: 'Fluid Mechanics II', department: 'Civil', credits: 3, instructor: 'Prof. Iyer', semester: 4 },
    ];
    const createdCourses = await Course.insertMany(courseData);

    // 4. Create Students
    console.log('Creating students...');
    const studentsData = [];
    
    const getDeptCode = (dept) => {
        const map = {
            'Computer Science': 'CS', 'Electronics': 'EC', 'Mechanical': 'ME',
            'Civil': 'CE', 'Business Administration': 'BA', 'Arts': 'AR',
            'Science': 'SC', 'Other': 'OT'
        };
        return map[dept] || 'OT';
    };

    for (let i = 1; i <= 25; i++) {
      const dept = departments[i % departments.length];
      const matchingCourses = createdCourses.filter(c => c.department === dept);
      const enrolledCourses = matchingCourses.map(c => c._id);
      
      studentsData.push({
        studentId: `STU-${getDeptCode(dept)}-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`,
        firstName: `Student${i}`,
        lastName: `Name${i}`,
        email: `student${i}.name${i}@student.edutrack.com`,
        phone: `98765432${String(i).padStart(2, '0')}`,
        department: dept,
        program: dept === 'Business Administration' ? 'MBA' : 'B.Tech',
        year: (i % 4) + 1,
        semester: ((i % 4) + 1) * 2 - (i % 2),
        status: i % 5 === 0 ? 'Inactive' : 'Active',
        gender: i % 2 === 0 ? 'Female' : 'Male',
        enrolledCourses: enrolledCourses
      });
    }

    const createdStudents = await Student.create(studentsData);

    // 5. Create Grades
    console.log('Creating grades...');
    const gradesData = [];
    for (const student of createdStudents) {
      for (const courseId of student.enrolledCourses) {
        const course = createdCourses.find(c => c._id.equals(courseId));
        gradesData.push({
          student: student._id,
          course: courseId,
          marks: Math.floor(Math.random() * (98 - 45 + 1) + 45),
          semester: course.semester,
          academicYear: '2024-25',
          remarks: 'Good progress'
        });
      }
    }
    
    await Grade.create(gradesData);

    console.log(`Seeded 2 users, ${createdStudents.length} students, ${createdCourses.length} courses, ${gradesData.length} grades.`);
    mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
