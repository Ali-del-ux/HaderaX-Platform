const winston = require('winston');
const path = require('path');

// ==============================================================================
// أداة التتبع ومراجعة النظام (System Auditing & Error Tracking Logger)
// ==============================================================================
// متطلب أكاديمي (Academic Concept):
// في بيئات الإنتاج (Production)، الاعتماد على (console.log) يعتبر ممارسة سيئة لسببين:
// 1. الأداء (Thread Blocking): دالة console.log هي عملية متزامنة (Synchronous)، تعطل 
//    تنفيذ باقي الأكواد لأجزاء من الثانية مما يبطئ السيرفر تحت الضغط العالي.
// 2. الطب الشرعي الرقمي (Digital Forensics): السجلات على الشاشة تختفي بمجرد إغلاقها. 
//    لكن باستخدام مكتبة مثل (Winston)، نقوم بحفظ السجلات في ملفات دائمة (Persistent Files)، 
//    مما يتيح لنا تتبع الأخطاء أو محاولات الاختراق بدقة حتى بعد حدوثها بأيام.
// ==============================================================================

// إنشاء هيكل المراقبة
const logger = winston.createLogger({
    level: 'info', // تسجيل كل ما هو من مستوى info فما فوق (مثل: info, warn, error)
    // تنسيق السجل: نضيف طابعاً زمنياً (Timestamp) لمعرفة وقت الحدث بدقة
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    // وسائل التصدير (Transports): أين يجب حفظ هذه السجلات؟
    transports: [
        // 1. ملف للأخطاء الحرجة فقط (مهم جداً للمراجعة الأمنية وصيانة الخادم)
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        // 2. ملف يجمع كل السجلات (الأنشطة العامة، طلبات API، والأخطاء)
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        })
    ]
});

// 3. عرض السجلات في الشاشة أيضاً (أثناء فترة التطوير)
// بالرغم من الحفظ في الملفات الدائمة، نقوم بطباعة السجلات في الشاشة لتسهيل المتابعة أثناء كتابة الكود.
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(), // تلوين النصوص لتسهيل القراءة (أحمر للأخطاء، أخضر للنجاح)
            winston.format.simple()
        )
    }));
}

module.exports = logger;
