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

// وسائل التصدير (Transports): أين يجب حفظ هذه السجلات؟
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const transports = [];

if (!isServerless) {
    try {
        transports.push(
            new winston.transports.File({ 
                filename: path.join(__dirname, '../logs/error.log'), 
                level: 'error' 
            }),
            new winston.transports.File({ 
                filename: path.join(__dirname, '../logs/combined.log') 
            })
        );
    } catch (e) {
        // Fallback to console if file system is read-only
    }
}

// إضافة Console دائماً للبيئات السحابية والتطوير
transports.push(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    )
}));

// إنشاء هيكل المراقبة
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports
});

module.exports = logger;
