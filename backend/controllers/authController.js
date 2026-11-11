const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ==============================================================================
// وحدة التحكم الخاصة بتسجيل الدخول (Auth Controller)
// لماذا فصلنا هذا الكود؟ (Separation of Concerns): 
// فصل المنطق البرمجي (Controller) عن مسارات التوجيه (Routes) يجعل الكود نظيفاً، 
// قابلاً للاختبار بسهولة، ويسهل صيانته وتوسيع النظام مستقبلاً.
// ==============================================================================
exports.login = async (req, res) => {
    try {
        // استخراج البيانات من جسم الطلب
        // نستخدم التفكيك (Destructuring) للحصول على رقم القيد وكلمة المرور
        const { student_id, password } = req.body;

        // التحقق من وجود البيانات الأساسية لمنع إرسال طلبات غير مكتملة
        if (!student_id || !password) {
            return res.status(400).json({ error: 'الرجاء إدخال رقم القيد وكلمة المرور' });
        }

        // ==============================================================================
        // 1. الحماية من ثغرات الحقن (SQL Injection - SQLi):
        // نستخدم الاستعلامات المحضرة (Prepared Statements) بواسطة الرمز (?).
        // هذا يمنع المهاجم من التلاعب بقاعدة البيانات لأن محرك قاعدة البيانات يتعامل 
        // مع المدخلات كبيانات نصية فقط، وليس كأوامر برمجية قابلة للتنفيذ.
        // ==============================================================================
        const [rows] = await pool.query('SELECT * FROM Users WHERE student_id = ?', [student_id]);

        // ==============================================================================
        // 2. الحماية من تسريب المعلومات (Information Disclosure & User Enumeration):
        // إذا لم يتم العثور على المستخدم، نُرجع رسالة خطأ "عامة" تفيد بأن البيانات غير صحيحة.
        // لا نخبر المستخدم ما إذا كان "رقم القيد غير موجود" أو "كلمة المرور هي الخاطئة".
        // هذا يمنع المهاجمين من تجربة أرقام قيد عشوائية لمعرفة من هو المسجل في النظام.
        // ==============================================================================
        if (rows.length === 0) {
            return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        }

        const user = rows[0];

        // ==============================================================================
        // 3. التحقق من التشفير (Secure Password Verification):
        // نستخدم مكتبة bcrypt لمقارنة كلمة المرور المدخلة (النص الواضح) مع النسخة المشفرة (Hash) 
        // المخزنة في قاعدة البيانات. خوارزمية التشفير تمنع أي شخص (حتى مهندس قاعدة البيانات) 
        // من معرفة كلمة المرور الحقيقية للمستخدمين.
        // ==============================================================================
        const isMatch = await bcrypt.compare(password, user.Password_hash);

        if (!isMatch) {
            // نكرر نفس الرسالة العامة للحماية من تسريب المعلومات كما ذكرنا في النقطة 2
            return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        }

        // ==============================================================================
        // 4. الحماية من هجمات XSS (Cross-Site Scripting):
        // بدلاً من إرسال التوكن (JWT) كنص في استجابة الـ JSON ليتم تخزينه في الـ LocalStorage 
        // (حيث يمكن لأي سكربت خبيث قراءته وسرقته)، نقوم بإنشاء التوكن وإرساله داخل (Cookie) محمية.
        // ==============================================================================
        const payload = {
            id: user.id,
            role: user.role,
            name: user.Name,
            student_id: user.student_id // إضافة رقم القيد للتوكن لتمكين العميل من عرضه ديناميكياً
        };

        // توقيع التوكن بمفتاح سري (مخزن في بيئة الخادم) لضمان عدم التلاعب به
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_academic_key', { expiresIn: '1d' });

        // ==============================================================================
        // إرسال الكوكي (Secure Cookie Configuration):
        // - HttpOnly: يمنع بشكل قاطع قراءة التوكن عبر الجافاسكريبت (document.cookie) في المتصفح.
        // - sameSite='lax': (متطلب أكاديمي لمرونة التطوير مع الحفاظ على الأمان)
        //   الخيار 'strict' كان يمنع المتصفح من إرسال الكوكي إذا كانت الواجهة على (Port 5500) 
        //   والسيرفر على (Port 3000) لأنهما يعتبران نطاقات مختلفة.
        //   الخيار 'lax' هو التوازن المثالي: يسمح بنقل الكوكي عبر الروابط (Top-level) 
        //   على نفس الجهاز (Localhost)، ولكنه لا يزال يحميك تماماً من هجمات الاختراق (CSRF) 
        //   القادمة من مواقع خارجية.
        // ==============================================================================
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // يجب أن يعمل عبر HTTPS في بيئة الإنتاج فقط
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // مدة الصلاحية: 24 ساعة
        });

        // ==============================================================================
        // 5. إرجاع بيانات آمنة (Safe Payload Return):
        // نُرسل فقط البيانات الأساسية اللازمة للواجهة الأمامية لتوجيه المستخدم.
        // لا يتم إرسال التوكن، ولا يتم إرسال بيانات حساسة كالتشفير أو المعرف الداخلي (id).
        // ==============================================================================
        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                name: user.Name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        // إرجاع خطأ 500 دون تسريب تفاصيل الخطأ البرمجية (Stack Trace) للمستخدم
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
    }
};

// ==============================================================================
// 1. دالة تغيير كلمة المرور القائمة (PUT /api/auth/change-password) - مسار محمي
// المبدأ الأكاديمي: حماية المصادقة والتأكيد قبل الاستبدال (Re-authentication)
// ==============================================================================
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        // 1. التحقق من اكتمال البيانات المدخلة
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'يرجى إدخال كلمة المرور القديمة والجديدة' });
        }

        if (newPassword.trim().length < 6) {
            return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 خانات' });
        }

        // 2. استعلام جلب كلمة المرور القديمة للمستخدم من قاعدة البيانات
        const [rows] = await pool.query('SELECT Password_hash FROM Users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم المطلوب غير موجود' });
        }

        const user = rows[0];

        // 3. مقارنة الكلمة القديمة المشفرة عبر Bcrypt
        const isMatch = await bcrypt.compare(oldPassword, user.Password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' });
        }

        // 4. تشفير وتمليح كلمة المرور الجديدة
        const salt = await bcrypt.genSalt(10);
        const hashedNew = await bcrypt.hash(newPassword.trim(), salt);

        // 5. تحديث وتثبيت كلمة المرور الجديدة في قاعدة البيانات
        await pool.query('UPDATE Users SET Password_hash = ? WHERE id = ?', [hashedNew, userId]);

        logger.info(`🔐 تم تغيير كلمة مرور الحساب [ID: ${userId}] بنجاح من لوحة التحكم.`);

        // 6. إخلاء الكوكي لإجبار المستخدم على تسجيل الدخول الفوري بالكلمة الجديدة
        res.clearCookie('token');
        res.json({ message: 'تم تغيير كلمة المرور بنجاح! جاري تسجيل الخروج لإعادة الدخول بالكلمة الجديدة...' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تغيير كلمة المرور' });
    }
};

// ==============================================================================
// 2. دالة طلب رابط استعادة كلمة المرور عبر البريد الجامعي (POST /api/auth/forgot-password)
// المبدأ الأكاديمي: تشفير التوكن (Token Hashing) وتفادي هجوم استكشاف الهويات (No User Enumeration)
// ==============================================================================
exports.forgotPassword = async (req, res) => {
    try {
        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({ error: 'يرجى إدخال رقم القيد الأكاديمي الخاص بك' });
        }

        // 1. الاستعلام عن وجود الحساب في جدول المستخدمين
        const [rows] = await pool.query('SELECT Name, role FROM Users WHERE student_id = ?', [student_id.trim()]);
        
        // الحماية من هجوم استكشاف الهويات (User Enumeration Defense):
        // إذا لم يكن رقم القيد مسجلاً، نرجع استجابة "ناجحة" وهمية ومبهمة لحماية سرية حسابات الطلاب.
        const safeMessage = 'إذا كان رقم القيد مسجلاً لدينا، فسيتم إرسال رابط استعادة أمني إلى بريدك الأكاديمي الرسمي خلال دقائق.';

        if (rows.length === 0) {
            console.log(`🛡️ [Forgot Password Auditing]: student_id [${student_id}] not found (returned dummy success response).`);
            return res.json({ message: safeMessage });
        }

        const user = rows[0];
        const email = `${student_id.trim()}@haderax.edu.ly`;

        // 2. توليد معرف تشفيري عشوائي ومؤقت (Crypto Secure Reset Token)
        const rawToken = crypto.randomBytes(32).toString('hex');

        // تطبيق معيار OWASP الأمني: نقوم بتشفير التوكن بـ SHA-256 قبل حفظه لضمان الأمان المطلق
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        // تعيين وقت انتهاء الصلاحية بعد ساعة واحدة (60 دقيقة)
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        // 3. تخزين التوكن المشفر وتاريخ انتهائه في قاعدة البيانات
        await pool.query('UPDATE Users SET reset_token = ?, reset_token_expires = ? WHERE student_id = ?', [
            hashedToken,
            expires,
            student_id.trim()
        ]);

        // 4. بناء الرابط الأكاديمي لإعادة التعيين
        // الرابط يوجه إلى صفحة reset-password.html التفاعلية الجديدة.
        // متطلب أكاديمي وأمني هام: نستخدم (req.get('host')) بدلاً من (window.location.hostname)
        // لأن كائن (window) خاص بمتصفح العميل وغير معرّف في بيئة الخادم Node.js.
        // هذا التعديل يضمن استخلاص الاستضافة والمنفذ ديناميكياً من طلب العميل
        // مما يجعل الكود قابلاً للعمل في البيئة المحلية وعبر الشبكة المحلية اللاسلكية بنجاح.
        const resetUrl = `http://${req.get('host')}/reset-password.html?token=${rawToken}`;

        // 5. إعداد وسيط بريدي Nodemailer للاستعلام والتوصيل
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

        if (!isSmtpConfigured) {
            // محاكاة الإرسال الأكاديمي لبيئة التطوير المحلية (Simulated Fallback Logger)
            console.log('=============================================================================');
            console.log('✉️ [محاكاة بريد جامعي] - تم طلب رابط استعادة كلمة مرور لـ: ' + email);
            console.log('🔗 رابط الاستعادة التفاعلي: ' + resetUrl);
            console.log('=============================================================================');

            logger.warn(`✉️ [Forgot Password Link Emulated] For Student ID: [${student_id}]. Link: ${resetUrl}`);
            
            return res.json({ message: safeMessage });
        }

        // إرسال البريد الحقيقي الفخم والمبهر
        const mailOptions = {
            from: `"منصة حاضراكس - جامعة الحاضرة" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🔐 استعادة كلمة المرور — منصة حاضراكس',
            html: `
            <div dir="rtl" style="font-family: 'Alexandria', 'Cairo', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                <h2 style="color: #F59E0B; text-align: center; border-bottom: 2px solid #FEF3C7; padding-bottom: 15px; font-weight: 800;">استعادة كلمة المرور</h2>
                <p style="font-size: 16px; color: #0f172a; line-height: 1.6; font-weight: 600;">مرحباً ${user.Name}،</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة حاضراكس لجامعة الحاضرة. يرجى الضغط على الزر بالأسفل لتعيين كلمة مرور جديدة:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" style="background-color: #F59E0B; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.35);">إعادة تعيين كلمة المرور</a>
                </div>
                <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">هذا الرابط صالح للاستخدام **لمرة واحدة فقط** وينتهي مفعوله تلقائياً بعد مرور ساعة واحدة (60 دقيقة) من إصداره.</p>
                <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذا البريد الإلكتروني بأمان وسيظل حسابك محمياً دون أي تغيير.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
                <footer style="text-align: center; font-size: 12px; color: #64748b; font-weight: 700;">
                    جامعة الحاضرة — منصة حاضراكس (HaderaX Platform)
                </footer>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`✉️ [Forgot Password Link Sent] Email successfully dispatched to: [${email}]`);

        res.json({ message: safeMessage });

    } catch (error) {
        console.error('Error in forgot password request:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء معالجة طلب استعادة كلمة المرور' });
    }
};

// ==============================================================================
// 3. دالة تنفيذ استبدال كلمة المرور بالتوكن (POST /api/auth/reset-password)
// المبدأ الأكاديمي: معالجة التوكنات لمرة واحدة (Single-use Token Expiry)
// ==============================================================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'يرجى إرسال رمز الاستعادة التفاعلي وكلمة المرور الجديدة' });
        }

        if (newPassword.trim().length < 6) {
            return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 خانات' });
        }

        // 1. تشفير التوكن الممرر لمقارنته بالنسخة المشفرة في قاعدة البيانات
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. البحث عن مستخدم يمتلك هذا التوكن المشفر ولديه صلاحية لم تنتهِ بعد (reset_token_expires > NOW())
        const [users] = await pool.query(
            'SELECT id, Name FROM Users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: '⚠️ رمز استعادة كلمة المرور غير صالح أو انتهت صلاحيته كلياً.' });
        }

        const user = users[0];

        // 3. تشفير وتمليح كلمة المرور الجديدة بأمان
        const salt = await bcrypt.genSalt(10);
        const hashedNew = await bcrypt.hash(newPassword.trim(), salt);

        // 4. تحديث كلمة المرور في قاعدة البيانات وتصفير وإبطال حقول الاستعادة لضمان عدم استخدامه مجدداً
        await pool.query(
            'UPDATE Users SET Password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedNew, user.id]
        );

        logger.info(`🎉 تم بنجاح استرجاع وتعديل كلمة مرور حساب الطالب [${user.Name}] بالتوكن الأمني.`);

        res.json({ message: '🎉 تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' });

    } catch (error) {
        console.error('Error in reset password execution:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تعيين كلمة المرور الجديدة' });
    }
};

// ==============================================================================
// 4. دالة تسجيل الخروج الآمن (POST /api/auth/logout)
// المبدأ الأكاديمي: إخلاء الكوكي الآمنة HttpOnly من العميل بشكل نهائي.
// ==============================================================================
exports.logout = (req, res) => {
    try {
        res.clearCookie('token');
        logger.info('👤 تم تسجيل خروج المستخدم وإخلاء التوكن بنجاح.');
        res.json({ message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تسجيل الخروج' });
    }
};
