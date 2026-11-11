const logger = require('../utils/logger');

/**
 * ==============================================================================
 * وسائط التحقق من صلاحيات المشرفين المتعددة (Granular Admin Role Verification)
 * 
 * المبدأ الأكاديمي المطبق (Least Privilege & Defense in Depth):
 * نقوم بتقسيم صلاحيات المشرفين إلى 3 مستويات مخصصة لمنع تداخل المسؤوليات وتأمين العمليات.
 * ==============================================================================
 */

// 1. حارس المشرف الأساسي (Super Admin Gatekeeper)
// يسمح فقط للمشرف الأساسي (Super_Admin) بإجراء التعديلات الكبرى وإدارة باقي المشرفين.
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'غير مصرح لك بالوصول، الرجاء تسجيل الدخول أولاً.' });
    }

    const { role, id } = req.user;

    if (role === 'Super_Admin') {
        next();
    } else {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        logger.warn(`🛑 محاولة وصول غير مصرح بها لـ Super_Admin من قبل (${id}) ذو الرتبة (${role}) من الـ IP: ${ip}`);
        res.status(403).json({ error: '⚠️ عذراً، هذا الإجراء متاح فقط للمشرف الأساسي العام للنظام.' });
    }
};

// 2. حارس شؤون الطلاب (Students affairs Gatekeeper)
// يسمح للمشرف الأساسي (Super_Admin) ومشرف شؤون الطلاب (Students_Admin) بإدارة بيانات الطلاب والحضور.
const requireStudentsAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'غير مصرح لك بالوصول، الرجاء تسجيل الدخول أولاً.' });
    }

    const { role, id } = req.user;

    if (role === 'Super_Admin' || role === 'Students_Admin') {
        next();
    } else {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        logger.warn(`🛑 محاولة وصول غير مصرح بها لشؤون الطلاب من قبل (${id}) ذو الرتبة (${role}) من الـ IP: ${ip}`);
        res.status(403).json({ error: '⚠️ عذراً، هذا الإجراء متاح فقط للمشرف الأساسي أو مشرف شؤون الطلاب.' });
    }
};

// 3. حارس شؤون المناهج والكورسات (Curriculum affairs Gatekeeper)
// يسمح للمشرف الأساسي (Super_Admin) ومشرف شؤون المناهج (Curriculum_Admin) بإدارة الكورسات والملفات.
const requireCurriculumAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'غير مصرح لك بالوصول، الرجاء تسجيل الدخول أولاً.' });
    }

    const { role, id } = req.user;

    if (role === 'Super_Admin' || role === 'Curriculum_Admin') {
        next();
    } else {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        logger.warn(`🛑 محاولة وصول غير مصرح بها لشؤون المناهج من قبل (${id}) ذو الرتبة (${role}) من الـ IP: ${ip}`);
        res.status(403).json({ error: '⚠️ عذراً، هذا الإجراء متاح فقط للمشرف الأساسي أو مشرف شؤون المناهج.' });
    }
};

// 4. الحارس المشترك القديم للتوافق البسيط (Legacy Admin Gatekeeper for compatibility)
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'غير مصرح لك بالوصول، الرجاء تسجيل الدخول أولاً.' });
    }

    const { role } = req.user;

    if (role === 'Super_Admin' || role === 'Students_Admin' || role === 'Curriculum_Admin' || role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: '⚠️ عذراً، هذا الإجراء متاح فقط لمشرفي النظام.' });
    }
};

module.exports = {
    requireSuperAdmin,
    requireStudentsAdmin,
    requireCurriculumAdmin,
    requireAdmin
};

