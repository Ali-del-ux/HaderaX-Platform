const pool = require('../config/db');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * ==============================================================================
 * متحكم الجلسات التفاعلية والحضور بالـ QR (Attendance & QR Session Controller)
 * 
 * الفلسفة الأكاديمية (Interactive Real-time Engineering):
 * تم تصميم هذا المتحكم ليوفر قناة اتصال ديناميكية لتسجيل حضور الطلاب.
 * بدلاً من الطرق التقليدية، يقدم المتحكم نظام بث يعتمد على المعرفات التشفيرية المؤقتة (Tokens)،
 * لحماية الجلسة وتأكيد تسجيل الحضور وتحديث مستويات الطلاب لحظياً في قاعدة البيانات.
 * ==============================================================================
 */

// ==============================================================================
// 1. بدء جلسة حضور جديدة وتوليد الرمز التشفيري
// POST /api/attendance/start (Admin Protected)
// ==============================================================================
exports.startSession = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'يرجى كتابة عنوان الكورس أو الجلسة لبدء الحضور' });
        }

        // توليد رمز تشفيري عشوائي فريد ومؤقت للجلسة (Cryptography Secure Token)
        const sessionToken = crypto.randomBytes(16).toString('hex');

        // إدراج سجل الجلسة نشطاً في قاعدة البيانات
        const insertQuery = `
            INSERT INTO Attendance_Sessions (session_title, session_description, session_token, is_active)
            VALUES (?, ?, ?, TRUE)
        `;
        const [result] = await pool.query(insertQuery, [title.trim(), description ? description.trim() : '', sessionToken]);

        logger.info(`📡 تم بدء جلسة حضور QR جديدة باسم [${title}] بالمعرف [${result.insertId}]`);

        res.status(201).json({
            message: 'تم فتح جلسة الحضور بالـ QR بنجاح',
            sessionId: result.insertId,
            sessionToken: sessionToken,
            title: title,
            description: description
        });

    } catch (error) {
        console.error('Error starting attendance session:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء بدء جلسة الحضور' });
    }
};

// ==============================================================================
// 2. إيقاف وتعطيل جلسة حضور قائمة
// POST /api/attendance/stop/:sessionId (Admin Protected)
// ==============================================================================
exports.stopSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const updateQuery = 'UPDATE Attendance_Sessions SET is_active = FALSE WHERE session_id = ?';
        const [result] = await pool.query(updateQuery, [sessionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'لم يتم العثور على جلسة الحضور المطلوبة لإيقافها' });
        }

        logger.info(`🛑 تم إغلاق وتعطيل جلسة الحضور QR ذات المعرف [${sessionId}] بنجاح.`);
        res.status(200).json({ message: 'تم إيقاف الجلسة وتعطيل الكود التفاعلي بنجاح.' });

    } catch (error) {
        console.error('Error stopping session:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء إيقاف الجلسة' });
    }
};

// ==============================================================================
// 3. العداد اللحظي للطلاب الحاضرين في الجلسة المفتوحة
// GET /api/attendance/live-count/:sessionId (Admin Protected)
// ==============================================================================
exports.getLiveCount = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const countQuery = 'SELECT COUNT(*) AS count FROM Attendance WHERE session_id = ?';
        const [rows] = await pool.query(countQuery, [sessionId]);

        res.status(200).json({ count: rows[0].count });

    } catch (error) {
        console.error('Error getting live count:', error);
        res.status(500).json({ error: 'فشل استرجاع عداد الحضور اللحظي' });
    }
};

// ==============================================================================
// 4. معالجة وتثبيت حضور الطلاب الفعليين عند مسح الكود (scan)
// GET /api/attendance/scan?token=xxx (Student Endpoint)
// ==============================================================================
exports.scanQR = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.send(renderHtmlMessage('⚠️ خطأ أمني', 'الرمز التشفيري للجلسة مفقود وغير صالح.', 'error'));
        }

        // 1. الفحص والتحقق من صلاحية ونشاط الجلسة في قاعدة البيانات
        const [sessions] = await pool.query('SELECT * FROM Attendance_Sessions WHERE session_token = ?', [token]);
        
        if (sessions.length === 0) {
            return res.send(renderHtmlMessage('⚠️ جلسة غير مسجلة', 'رمز الجلسة مجهول أو لم يتم إنشاؤه مسبقاً في السيرفر.', 'error'));
        }

        const session = sessions[0];

        if (!session.is_active) {
            return res.send(renderHtmlMessage('🔒 الجلسة مغلقة', `عذراً، جلسة الحضور الخاصة بـ [${session.session_title}] تم إغلاقها من قبل مشرف القاعة.`, 'warning'));
        }

        // 2. التحقق من هوية الطالب المسجل (Auth Verification Check):
        // بما أن الطالب يمسح الكود بكاميرا هاتفه، نتحقق من وجود توكن تسجيل دخوله في الكوكيز.
        // إذا كان غير مسجل الدخول، نقوم بتحويله تلقائياً لصفحة تسجيل الدخول، وبعد تسجيل دخوله
        // يتم إعادته وتوجيهه تلقائياً لهذا الرابط لإكمال تسجيل الحضور بمرونة تامة (UX Redirect flow).
        const userToken = req.cookies.token;
        if (!userToken) {
            const redirectUrl = `/login.html?redirect=${encodeURIComponent(req.originalUrl)}`;
            return res.redirect(redirectUrl);
        }

        // فك تشفير توكن الطالب واستخراج هويته
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(userToken, process.env.JWT_SECRET || 'super_secret_academic_key');
        } catch (jwtErr) {
            // التوكن تالف أو منتهي
            const redirectUrl = `/login.html?redirect=${encodeURIComponent(req.originalUrl)}`;
            return res.redirect(redirectUrl);
        }

        const studentId = decoded.id;

        // جلب اسم الطالب الكامل لقاعدة السجلات البصرية الفخمة
        const [users] = await pool.query('SELECT Name, role FROM Users WHERE id = ?', [studentId]);
        if (users.length === 0) {
            return res.send(renderHtmlMessage('⚠️ حساب غير موثق', 'لم يتم العثور على حسابك في قاعدة بيانات الجامعة.', 'error'));
        }

        const student = users[0];

        if (student.role !== 'student') {
            return res.send(renderHtmlMessage('ℹ️ صلاحية مشرف', `مرحباً بك يا مشرف النظام [${student.Name}]. حساب المشرف لا يتم تسجيله في كشوفات حضور الطلاب.`, 'info'));
        }

        // 3. التحقق الوقائي من تسجيل الحضور المسبق في نفس الجلسة
        const [existingAttendance] = await pool.query(
            'SELECT attendance_id FROM Attendance WHERE user_id = ? AND session_id = ?',
            [studentId, session.session_id]
        );

        if (existingAttendance.length > 0) {
            return res.send(renderHtmlMessage('✅ مسجل حضور بالفعل', `مرحباً ${student.Name}، لقد قمت بتسجيل حضورك مسبقاً في جلسة [${session.session_title}].`, 'success'));
        }

        // 4. إدراج الحضور الفعلي وتثبيته في قاعدة البيانات
        const insertQuery = `
            INSERT INTO Attendance (user_id, session_id, date, status)
            VALUES (?, ?, CURDATE(), 'حاضر')
        `;
        await pool.query(insertQuery, [studentId, session.session_id]);

        logger.info(`✅ تم تسجيل حضور الطالب [${student.Name}] بنجاح في الجلسة: [${session.session_title}]`);

        // عرض صفحة النجاح البصرية المذهلة والمتجاوبة على هاتف الطالب
        return res.send(renderHtmlMessage(
            '🎉 تم تسجيل حضورك بنجاح!',
            `عزيزي الطالب **${student.Name}**، تم تسجيل حضورك بنجاح لـ **${session.session_title}** (${session.session_description || 'محاضرة تفاعلية'}).`,
            'success'
        ));

    } catch (error) {
        console.error('Error scanning QR attendance:', error);
        res.send(renderHtmlMessage('❌ خطأ داخلي', 'حدث خطأ غير متوقع أثناء معالجة تسجيل الحضور. يرجى المحاولة لاحقاً.', 'error'));
    }
};

/**
 * ==============================================================================
 * بناء صفحة النجاح والخطأ التفاعلية المذهلة على الهواتف الذكية (Dynamic Mobile UX Wrapper)
 * ==============================================================================
 */
function renderHtmlMessage(title, message, type) {
    let icon = 'check_circle';
    let colorClass = 'text-green-500';
    let gradientClass = 'from-green-500/10 to-emerald-500/10';
    let borderClass = 'border-green-500/30';
    let shadowColor = 'rgba(34, 197, 94, 0.2)';

    if (type === 'error') {
        icon = 'cancel';
        colorClass = 'text-red-500';
        gradientClass = 'from-red-500/10 to-rose-500/10';
        borderClass = 'border-red-500/30';
        shadowColor = 'rgba(239, 68, 68, 0.2)';
    } else if (type === 'warning') {
        icon = 'lock';
        colorClass = 'text-amber-500';
        gradientClass = 'from-amber-500/10 to-yellow-500/10';
        borderClass = 'border-amber-500/30';
        shadowColor = 'rgba(245, 158, 11, 0.2)';
    } else if (type === 'info') {
        icon = 'info';
        colorClass = 'text-blue-500';
        gradientClass = 'from-blue-500/10 to-cyan-500/10';
        borderClass = 'border-blue-500/30';
        shadowColor = 'rgba(59, 130, 246, 0.2)';
    }

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - منصة الحضور الذكي</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Cairo', sans-serif;
            }
            .animate-scale-up {
                animation: scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            @keyframes scaleUp {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        </style>
    </head>
    <body class="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
        
        <div class="w-full max-w-[420px] bg-white rounded-[32px] border ${borderClass} shadow-2xl p-8 flex flex-col items-center text-center animate-scale-up relative overflow-hidden" style="box-shadow: 0 20px 40px -15px ${shadowColor};">
            
            <!-- خلفية انسيابية متوهجة -->
            <div class="absolute inset-0 bg-gradient-to-b ${gradientClass} pointer-events-none -z-10"></div>
            
            <header class="w-full flex justify-center mb-6">
                <div class="bg-white/95 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border ${borderClass}">
                    <span class="material-symbols-outlined text-[36px] ${colorClass} font-bold">${icon}</span>
                </div>
            </header>

            <main class="flex flex-col gap-3">
                <h1 class="text-2xl font-extrabold text-slate-800 leading-tight">${title}</h1>
                <div class="text-slate-600 text-[15px] font-medium leading-relaxed px-2">${message}</div>
            </main>

            <footer class="w-full mt-8 border-t border-slate-100 pt-6 flex flex-col gap-3">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">جامعة الحاضرة — منصة حاضراكس (HaderaX)</div>
                <div class="text-[10px] text-slate-300 font-mono">حماية أمنية مشددة وربط لحظي بالشبكة</div>
            </footer>
        </div>

    </body>
    </html>
    `;
}
