const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentStats,
  exportStudentsCSV,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollCourse,
  unenrollCourse
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getStudents);
router.post('/', createStudent);
router.get('/stats/overview', getStudentStats);
router.get('/export/csv', adminOnly, exportStudentsCSV);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.delete('/:id', adminOnly, deleteStudent);
router.post('/:id/enroll/:courseId', enrollCourse);
router.delete('/:id/enroll/:courseId', unenrollCourse);

module.exports = router;
