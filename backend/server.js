const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// تحميل المتغيرات البيئية بمسار مطلق لضمان عمل السيرفر من أي مسار تشغيل
require('dotenv').config({ path: path.join(__dirname, '.env') });

// استيراد مسارات المصادقة (Auth Routes) التي أنشأناها مسبقاً
const authRoutes = require('./routes/authRoutes');

// استيراد مسارات الكورسات (Course Routes)
const courseRoutes = require('./routes/courseRoutes');

// استيراد مسارات المواد التعليمية والمحاضرات (Material Routes)
const materialRoutes = require('./routes/materialRoutes');

// استيراد مسارات الطلاب (Student Routes)
const studentRoutes = require('./routes/studentRoutes');

// استيراد مسارات الحضور بالـ QR (Attendance Routes)
const attendanceRoutes = require('./routes/attendanceRoutes');

// استيراد مسارات الأخبار والإعلانات (News Routes)
const newsRoutes = require('./routes/newsRoutes');

// تهيئة تطبيق Express ليكون النقطة المركزية للخادم
const app = express();

// ==============================================================================
// 1. إعدادات الأمان والوسائط (Middleware Security & Configuration)
// ==============================================================================

// إعداد CORS (Cross-Origin Resource Sharing):
// لماذا؟ الخادم المحمي يرفض تلقائياً استقبال الطلبات من متصفحات تعمل على نطاق مختلف.
// نحن هنا نحدد بدقة النطاقات المسموح لها بالتخاطب مع الـ API (مثل سيرفر تطوير الواجهات).
// تم توسيع النطاق ليشمل جميع عناوين الآي بي المحلية (Local IPs) على الشبكة اللاسلكية 
// (192.168.X.X, 10.X.X.X, 172.16-31.X.X) لتمكين الطلاب والمشرفين من التفاعل بالهاتف.
// خيار "credentials: true" إلزامي هنا لأنه يسمح للواجهة الأمامية بإرسال واستقبال 
// ملفات تعريف الارتباط الآمنة (HttpOnly Cookies) لتمرير التوكن الخاص بالمصادقة.
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: function (origin, callback) {
        // السماح بالطلبات المحلية والتطوير وعبر الشبكة المحلية اللاسلكية (Wi-Fi Local Network IPs)
        if (!origin || 
            (!isProduction && (origin === 'null' || origin.startsWith('file://'))) ||
            origin.startsWith('http://localhost') || 
            origin.startsWith('http://127.0.0.1') ||
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
            /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            console.error(`🛑 CORS Blocked Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true 
}));

// إعداد محدّد معدل الطلبات لحماية صفحة تسجيل الدخول والمسارات الحساسة من هجمات القوة الضاربة (Brute Force Protection)
// متطلب أمني صارم: يتم تسجيله بعد CORS لكي ترفق ترويسات CORS بالاستجابات المحظورة (429) وتتمكن المتصفحات من قراءتها
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // بحد أقصى 5 محاولات من كل عنوان IP
    message: {
        error: '⚠️ عذراً، لقد تجاوزت الحد المسموح به من محاولات تسجيل الدخول. يرجى الانتظار لمدة 15 دقيقة قبل المحاولة مجدداً.'
    },
    standardHeaders: true, // إرجاع معلومات تحديد المعدل في ترويسات RateLimit-*
    legacyHeaders: false, // تعطيل ترويسات X-RateLimit-* القديمة
});

// تطبيق حظر التخمين على مسارات تسجيل الدخول واستعادة كلمة المرور فقط
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth/forgot-password', loginRateLimiter);

// إعداد Cookie Parser:
// لماذا؟ لكي يتمكن السيرفر من تحليل واستخراج التوكن (JWT) المخبأ داخل الكوكي (HttpOnly Cookie)
// من الطلبات المستقبلية الواردة من المستخدم بعد أن يقوم بتسجيل الدخول.
app.use(cookieParser());

// ==============================================================================
// 3. نظام التتبع ومراقبة الطلبات (System Auditing)
// نستخدم morgan لمراقبة وتسجيل كل طلب HTTP يدخل السيرفر، ونقوم بتوجيه 
// المخرجات (Stream) مباشرة إلى أداة Winston ليتم حفظها في ملف combined.log
// ==============================================================================
app.use(morgan('dev', { stream: { write: message => logger.info(message.trim()) } }));

// إعداد Express JSON:
// لماذا؟ لكي يتمكن السيرفر من قراءة جسم الطلبات (req.body) إذا كانت مرسلة بصيغة JSON
// (وهي الطريقة الحديثة والمفضلة لإرسال البيانات بين الـ Frontend والـ Backend).
app.use(express.json());

// استضافة ملفات المحاضرات المرفوعة بشكل ساكن (Static Hosting) لتسهيل تحميلها
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// استضافة ملفات الواجهة الأمامية بالكامل بشكل ساكن (Static Frontend Hosting):
// لماذا؟ لتمكين تصفح الموقع والصفحات التفاعلية (HTML/CSS/JS) بالكامل عبر الهاتف الذكي 
// المتصل بالشبكة المحلية مباشرة عبر منفذ السيرفر المشترك (Port 3000) دون الحاجة لخوادم خارجية.
app.use(express.static(path.join(__dirname, '../frontend')));


// ==============================================================================
// 2. توجيه المسارات المركزية (Routes Mounting)
// ==============================================================================

// تركيب مسارات المصادقة تحت بادئة موحدة (API Prefix)
// أي طلب يبدأ برابط "/api/auth" سيتم تحويله تلقائياً لملف authRoutes للتعامل معه.
app.use('/api/auth', authRoutes);

// تركيب مسارات الكورسات
app.use('/api/courses', courseRoutes);

// تركيب مسارات المواد التعليمية والمحاضرات (Materials Routes)
app.use('/api/materials', materialRoutes);

// تركيب مسارات إدارة الطلاب (Students Routes)
app.use('/api/students', studentRoutes);

// تركيب مسارات حضور الـ QR (Attendance Routes)
app.use('/api/attendance', attendanceRoutes);

// تركيب مسارات الأخبار والإعلانات (News Routes)
app.use('/api/news', newsRoutes);

// مسار افتراضي بسيط للتأكد من أن الخادم يعمل عند فحصه بالمتصفح
app.get('/', (req, res) => {
    res.send('✅ الخادم يعمل بشكل آمن والأنظمة جاهزة.');
});


// ==============================================================================
// 3. تشغيل الخادم (Starting the Server)
// ==============================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running securely on port ${PORT}`);
});
