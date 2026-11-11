const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// ==============================================================================
// إعداد محرك التخزين الآمن لصور الأخبار المرفوعة (Secure Multer Storage for News)
// ==============================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // تحديد مجلد الرفع المشترك /uploads
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // توليد اسم فريد لتفادي استبدال الصور
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, 'news-' + uniqueSuffix + fileExt);
    }
});

// ==============================================================================
// فلتر جدار حماية الصور (Image Only Security Filter)
// ==============================================================================
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('⚠️ يسمح برفع الصور فقط بالامتدادات الآمنة: PNG, JPG, JPEG, WEBP'), false);
    }
};

// تهيئة أداة الرفع مع حد 5 ميجابايت لغلاف الخبر لحفظ السعة التخزينية
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Megabytes Limit
}).single('image'); // حقل الصورة هو 'image'

// ==============================================================================
// 1. إضافة خبر جديد مع غلاف (Create News with Multer Upload)
// POST /api/news (Admin Protected)
// ==============================================================================
exports.addNews = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { title, content } = req.body;

            // 1. التحقق الوقائي من وجود البيانات النصية الأساسية للخبر
            if (!title || !content) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: 'يرجى كتابة عنوان الخبر وتفاصيله الكاملة' });
            }

            // 2. التحقق من وجود الصورة المرفوعة
            if (!req.file) {
                return res.status(400).json({ error: 'يرجى اختيار صورة غلاف مميزة للخبر' });
            }

            const imageUrl = `/uploads/${req.file.filename}`;

            // 3. الحفظ المجهز في قاعدة البيانات لصد حقن الاستعلامات (SQLi Protection)
            const insertQuery = `
                INSERT INTO News (title, content, image_path)
                VALUES (?, ?, ?)
            `;
            const [result] = await pool.query(insertQuery, [title.trim(), content.trim(), imageUrl]);

            logger.info(`📰 تم إضافة خبر جديد بعنوان [${title.trim()}] بواسطة المشرف.`);

            res.status(201).json({
                message: 'تم نشر وإضافة الخبر بنجاح في المنصة',
                newsId: result.insertId,
                imageUrl: imageUrl
            });

        } catch (error) {
            console.error('Error adding news:', error);
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch (e) {}
            }
            res.status(500).json({ error: 'حدث خطأ داخلي أثناء إضافة الخبر' });
        }
    });
};

// ==============================================================================
// 2. جلب كافة الأخبار المنشورة (Public Feed)
// GET /api/news (Public Route)
// ==============================================================================
exports.getAllNews = async (req, res) => {
    try {
        // ترتيب الأخبار من الأحدث للأقدم
        const [news] = await pool.query('SELECT * FROM News ORDER BY news_id DESC');
        res.status(200).json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'فشل جلب الأخبار من قاعدة البيانات' });
    }
};

// ==============================================================================
// 3. حذف خبر منشور ومسح صورته من السيرفر (Safe News Deletion & Cleanup)
// DELETE /api/news/:id (Admin Protected)
// ==============================================================================
exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. التحقق من وجود الخبر والحصول على رابط صورته لتطهير السيرفر
        const [newsList] = await pool.query('SELECT * FROM News WHERE news_id = ?', [id]);
        if (newsList.length === 0) {
            return res.status(404).json({ error: 'الخبر المطلوب حذفه غير موجود في النظام' });
        }

        const newsItem = newsList[0];

        // 2. حذف السجل من قاعدة البيانات
        await pool.query('DELETE FROM News WHERE news_id = ?', [id]);

        // 3. مسح الصورة الفعلية من المجلد لضمان نظافة السيرفر ومنع امتلاء القرص
        if (newsItem.image_path && newsItem.image_path.startsWith('/uploads/')) {
            const fileName = newsItem.image_path.replace('/uploads/', '');
            const filePath = path.join(__dirname, '../uploads', fileName);

            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('❌ فشل مسح غلاف الخبر من القرص:', unlinkErr);
                        else console.log(`✅ تم تنظيف السيرفر وحذف غلاف الخبر (${fileName}) بنجاح.`);
                    });
                }
            });
        }

        logger.info(`🗑️ تم حذف الخبر ذي المعرف [${id}] بنجاح من قاعدة البيانات.`);

        res.status(200).json({ message: 'تم حذف الخبر وتنظيف الملفات المرفقة بنجاح' });

    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء محاولة حذف الخبر' });
    }
};
