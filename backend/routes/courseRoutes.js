const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// استيراد بوابات الحماية (Gatekeepers)
const requireAuth = require('../middleware/authMiddleware');
const { requireCurriculumAdmin } = require('../middleware/roleMiddleware');

/**
 * ==============================================================================
 * معمارية الواجهات البرمجية للكورسات (RESTful Course & Sections RBAC Routing)
 * 
 * المبدأ الأكاديمي المطبق (Defense in Depth / RBAC):
 * 1. مسار جلب الكورسات وأقسامها مفتوح للجميع (GET) لتسهيل التصفح للزوار والطلاب.
 * 2. عمليات الإضافة والتعديل والحذف مقيدة بجدار الحماية المزدوج:
 *    - requireAuth: للتأكد من تسجيل الدخول.
 *    - requireCurriculumAdmin: للتأكد من أن المستخدم مشرف عام أو مشرف شؤون مناهج.
 * ==============================================================================
 */

// 1. مسار جلب الكورسات (GET /)
router.get('/', courseController.getAllCourses);

// 2. مسار إضافة كورس (POST /)
router.post('/', requireAuth, requireCurriculumAdmin, courseController.addCourse);

// 3. مسار تحديث كورس (PUT /:id)
router.put('/:id', requireAuth, requireCurriculumAdmin, courseController.updateCourse);

// 4. مسار حذف كورس (DELETE /:id)
router.delete('/:id', requireAuth, requireCurriculumAdmin, courseController.deleteCourse);

// 5. مسار جلب أقسام كورس محدد (GET /:courseId/sections)
router.get('/:courseId/sections', courseController.getCourseSections);

// 6. مسار إضافة قسم جديد لكورس محدد (POST /:courseId/sections)
router.post('/:courseId/sections', requireAuth, requireCurriculumAdmin, courseController.addCourseSection);

// 7. مسار حذف قسم كورس قائم بالكامل (DELETE /sections/:sectionId)
router.delete('/sections/:sectionId', requireAuth, requireCurriculumAdmin, courseController.deleteCourseSection);

// 8. مسار تحديث عنوان قسم كورس قائم (PUT /sections/:sectionId)
router.put('/sections/:sectionId', requireAuth, requireCurriculumAdmin, courseController.updateCourseSection);

module.exports = router;
