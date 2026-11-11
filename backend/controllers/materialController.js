const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==============================================================================
// إعداد محرك التخزين الآمن للملفات المرفوعة (Secure Multer Storage Engine)
// ==============================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // تحديد مجلد الرفع المخصص
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // نمط تسمية آمن وتشفيري لمنع تكرار الملفات أو استبدالها (File Collision prevention)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, 'lecture-' + uniqueSuffix + fileExt);
    }
});

// ==============================================================================
// جدار الحماية وامتدادات الملفات المسموح بها (Upload Security File Filter)
// لمنع هجمات رفع الملفات الخبيثة (Malicious File Upload Vulnerability / Remote Shell Execution)
// ==============================================================================
const fileFilter = (req, file, cb) => {
    // الامتدادات الآمنة والمصرح برفعها فقط للمنصة الأكاديمية
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true); // السماح بالرفع
    } else {
        cb(new Error('⚠️ الامتداد غير مسموح به! يسمح فقط بملفات PDF والـ Office والوسائط الآمنة.'), false); // رفض الرفع
    }
};

// تهيئة أداة الرفع Multer مع تحديد الحد الأقصى للحجم (50 ميجابايت) لحماية خادم الويب
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 Megabytes Limit
}).single('file'); // نتوقع ملفاً واحداً تحت مفتاح 'file'


// ==============================================================================
// 1. إضافة مادة تعليمية جديدة (ملف مرفوع أو رابط خارجي)
// POST /api/materials/upload/:sectionId
// ==============================================================================
exports.addMaterial = (req, res) => {
    // تشغيل نظام الرفع الآمن
    upload(req, res, async (err) => {
        if (err) {
            // التعامل مع تجاوز الحجم أو الامتدادات المرفوضة
            return res.status(400).json({ error: err.message });
        }

        try {
            const { sectionId } = req.params;
            const { title, type, url: externalUrl } = req.body;

            // 1. التحقق من المدخلات الأساسية
            if (!title || !type) {
                // خطوة وقائية: مسح الملف المرفوع إذا فشل التحقق من الحقول الأخرى لمنع تراكم الملفات اليتيمة
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: 'عنوان المادة ونوعها حقول إلزامية' });
            }

            // 2. خطوة أمان إضافية: التحقق من وجود قسم الكورس الأب في النظام
            const [sections] = await pool.query('SELECT * FROM Course_Sections WHERE id = ?', [sectionId]);
            if (sections.length === 0) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({ error: 'القسم التعليمي غير موجود في النظام' });
            }

            let finalUrl = '';

            // 3. معالجة نوع المادة
            if (type === 'file') {
                if (!req.file) {
                    return res.status(400).json({ error: 'يرجى اختيار الملف المراد رفعه' });
                }
                // بناء رابط التحميل الديناميكي باستخدام عنوان السيرفر والمنفذ
                finalUrl = `/uploads/${req.file.filename}`;
            } else if (type === 'link') {
                if (!externalUrl) {
                    return res.status(400).json({ error: 'يرجى كتابة الرابط الخارجي (مثل يوتيوب أو درايف)' });
                }
                finalUrl = externalUrl.trim();
            } else {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: 'نوع المادة غير صالح' });
            }

            // 4. الحفظ في قاعدة البيانات بأمان ضد هجمات SQLi
            const query = `
                INSERT INTO Materials (section_id, title, type, url) 
                VALUES (?, ?, ?, ?)
            `;
            const [result] = await pool.query(query, [sectionId, title.trim(), type, finalUrl]);

            res.status(201).json({
                message: 'تم إضافة المادة التعليمية بنجاح',
                materialId: result.insertId,
                url: finalUrl
            });

        } catch (error) {
            console.error('Error adding material:', error);
            // تطهير مجلد الرفع في حال حدوث خطأ برمجي غير متوقع
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch (e) {}
            }
            res.status(500).json({ error: 'حدث خطأ داخلي أثناء إضافة المادة التعليمية' });
        }
    });
};

// ==============================================================================
// 2. جلب جميع المواد التعليمية لقسم محدد (Public Route)
// GET /api/materials/section/:sectionId
// ==============================================================================
exports.getSectionMaterials = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // جلب المواد التعليمية مرتبة تصاعدياً حسب تاريخ الإضافة
        const query = 'SELECT * FROM Materials WHERE section_id = ? ORDER BY material_id ASC';
        const [materials] = await pool.query(query, [sectionId]);

        res.status(200).json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء جلب المواد التعليمية' });
    }
};

// ==============================================================================
// 3. حذف مادة تعليمية بالكامل مع ملفها الفعلي (Safe Deletion with File Cleanup)
// DELETE /api/materials/:materialId
// ==============================================================================
exports.deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;

        // 1. جلب بيانات المادة أولاً للتحقق من وجودها ومعرفة رابط ملفها الفعلي
        const [materials] = await pool.query('SELECT * FROM Materials WHERE material_id = ?', [materialId]);
        if (materials.length === 0) {
            return res.status(404).json({ error: 'المادة التعليمية المطلوبة غير موجودة لحذفها' });
        }

        const material = materials[0];

        // 2. حذف السجل من قاعدة البيانات
        const deleteQuery = 'DELETE FROM Materials WHERE material_id = ?';
        await pool.query(deleteQuery, [materialId]);

        // 3. خطوة حيوية: إذا كانت المادة ملفاً مرفوعاً محلياً، نقوم بمسحه من القرص الصلب (Preventing Orphaned Files)
        if (material.type === 'file' && material.url.startsWith('/uploads/')) {
            const fileName = material.url.replace('/uploads/', '');
            const filePath = path.join(__dirname, '../uploads', fileName);

            // التحقق الدفاعي من وجود الملف الفعلي قبل حذفه لتجنب انهيار التطبيق
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('❌ فشل مسح الملف من القرص الصلب:', unlinkErr);
                        else console.log(`✅ تم مسح الملف الفعلي (${fileName}) من السيرفر بنجاح.`);
                    });
                }
            });
        }

        res.status(200).json({ message: 'تم حذف المادة التعليمية وملفها التابع بنجاح من النظام' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء حذف المادة التعليمية' });
    }
};
