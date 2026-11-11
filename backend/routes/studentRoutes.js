const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// استيراد بوابات الحماية الثنائية (Gatekeepers)
const requireAuth = require('../middleware/authMiddleware');
const { requireStudentsAdmin } = require('../middleware/roleMiddleware');

/**
 * ==============================================================================
 * موجه مسارات إدارة الطلاب (Modular Student Routing)
 * 
 * المبدأ الأكاديمي المطبق (Defense in Depth / RBAC):
 * نقوم بتأمين كافة مسارات إدارة الطلاب بشكل صارم ومزدوج:
 * 1. requireAuth: يضمن أن المرسل هو مستخدم موثق لديه توكن نشط (Cookie-based JWT).
 * 2. requireStudentsAdmin: يضمن أن المستخدم المسجل لديه رتبة إشرافية (Super_Admin أو Students_Admin) تتيح له الإدارة.
 * ==============================================================================
 */

// جلب الطلاب والبحث (GET /api/students)
router.get('/', requireAuth, requireStudentsAdmin, studentController.getAllStudents);

// إضافة طالب جديد (POST /api/students)
router.post('/', requireAuth, requireStudentsAdmin, studentController.addStudent);

// تعديل بيانات طالب قائم (PUT /api/students/:id)
router.put('/:id', requireAuth, requireStudentsAdmin, studentController.updateStudent);

// حذف طالب من النظام (DELETE /api/students/:id)
router.delete('/:id', requireAuth, requireStudentsAdmin, studentController.deleteStudent);

module.exports = router;
