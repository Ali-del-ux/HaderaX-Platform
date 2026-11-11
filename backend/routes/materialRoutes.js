const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// استيراد بوابات الحماية (Gatekeepers)
const requireAuth = require('../middleware/authMiddleware');
const { requireCurriculumAdmin } = require('../middleware/roleMiddleware');

/**
 * ==============================================================================
 * معمارية مسارات المواد والملفات التعليمية (RESTful Materials RBAC Routing)
 * 
 * المبدأ الأكاديمي المطبق (Defense in Depth / RBAC):
 * 1. مسار جلب المواد التعليمية لقسم محدد مفتوح للجميع (GET) لتسهيل تصفح الطلاب.
 * 2. عمليات رفع الملفات أو الحذف مقيدة بجدار الحماية المزدوج:
 *    - requireAuth: للتأكد من تسجيل الدخول.
 *    - requireCurriculumAdmin: للتأكد من أن المشرف هو مشرف عام أو مشرف مناهج.
 * ==============================================================================
 */

// 1. مسار جلب المواد التعليمية لقسم محدد (GET /section/:sectionId)
router.get('/section/:sectionId', materialController.getSectionMaterials);

// 2. مسار رفع وإضافة مادة تعليمية جديدة (POST /upload/:sectionId)
router.post('/upload/:sectionId', requireAuth, requireCurriculumAdmin, materialController.addMaterial);

// 3. مسار حذف مادة تعليمية قائم (DELETE /:materialId)
router.delete('/:materialId', requireAuth, requireCurriculumAdmin, materialController.deleteMaterial);

module.exports = router;
