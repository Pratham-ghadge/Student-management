const express = require('express');
const router = express.Router();
const {
  getStudentGrades,
  getGradeReport,
  createOrUpdateGrade,
  updateGrade,
  deleteGrade
} = require('../controllers/gradeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/student/:studentId', getStudentGrades);
router.get('/report/:studentId', getGradeReport);
router.post('/', createOrUpdateGrade);
router.put('/:id', updateGrade);
router.delete('/:id', adminOnly, deleteGrade);

module.exports = router;
