const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// استيراد بوابات الحماية للتحقق من هوية وصلاحية المشرفين
const requireAuth = require('../middleware/authMiddleware');
const { requireCurriculumAdmin } = require('../middleware/roleMiddleware');

/**
 * ==============================================================================
 * موجه مسارات الأخبار والإعلانات (Modular News Routing Panel)
 * 
 * المعايير الأمنية والهندسية:
 * 1. مسار جلب الأخبار (GET): مسار عام لخدمة الصفحة الرئيسية للطلاب دون قيود.
 * 2. مسارات التعديل والحذف (POST / DELETE): مؤمنة بالكامل بجدار حماية مزدوج
 *    لمنع الاختراق أو حقن إعلانات خارجية غير معتمدة من الجامعة.
 * ==============================================================================
 */

// جلب جميع الأخبار (GET /api/news - Public Feed)
router.get('/', newsController.getAllNews);

// إضافة خبر جديد مع غلاف (POST /api/news - Admin Protected)
router.post('/', requireAuth, requireCurriculumAdmin, newsController.addNews);

// حذف خبر منشور وملفه (DELETE /api/news/:id - Admin Protected)
router.delete('/:id', requireAuth, requireCurriculumAdmin, newsController.deleteNews);

module.exports = router;
