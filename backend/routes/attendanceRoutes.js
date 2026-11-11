const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// استيراد بوابات الحماية (Gatekeepers)
const requireAuth = require('../middleware/authMiddleware');
const { requireStudentsAdmin } = require('../middleware/roleMiddleware');

/**
 * ==============================================================================
 * موجه مسارات الحضور بالـ QR (Modular Attendance Routing)
 * 
 * المبدأ الأكاديمي المطبق (Defense in Depth / RBAC):
 * نقوم بتأمين كافة مسارات إدارة جلسات الحضور بالكامل:
 * 1. مسارات المشرف (Admin routes): مؤمنة بشكل مزدوج بـ requireAuth و requireStudentsAdmin
 *    لتقتصر صلاحيات البث والتحكم على المشرف الأساسي أو مشرف الطلاب.
 * 2. مسارات الطالب (Student routes): مؤمنة بـ requireAuth فقط لتسجيل حضورهم الذاتي.
 * ==============================================================================
 */

// بدء جلسة حضور جديدة وتوليد رمز QR (POST /api/attendance/start)
router.post('/start', requireAuth, requireStudentsAdmin, attendanceController.startSession);

// إيقاف الجلسة النشطة (POST /api/attendance/stop/:sessionId)
router.post('/stop/:sessionId', requireAuth, requireStudentsAdmin, attendanceController.stopSession);

// جلب عدد الحضور المباشر للجلسة الحالية (GET /api/attendance/live-count/:sessionId)
router.get('/live-count/:sessionId', requireAuth, requireStudentsAdmin, attendanceController.getLiveCount);

// مسح رمز الـ QR وتسجيل حضور الطالب (GET /api/attendance/scan?token=xxx)
router.get('/scan', attendanceController.scanQR);

module.exports = router;
