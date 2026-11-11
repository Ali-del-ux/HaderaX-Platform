const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * ==============================================================================
 * متحكم إدارة الطلاب الأكاديمي (Student Management Controller)
 * 
 * لماذا صممنا هذا المتحكم؟ (Academic Architecture):
 * تطبيقاً لمبدأ SOLID وتحديداً المسؤولية الفردية (Single Responsibility Principle)، 
 * تم فصل جميع عمليات الطلاب في هذا الملف لتسهيل مراجعتها، تأمينها، ومراقبتها أمنياً.
 * ==============================================================================
 */

// ==============================================================================
// 1. جلب قائمة الطلاب وحساب نسبة الحضور ديناميكياً
// GET /api/students?search=xxx
// ==============================================================================
exports.getAllStudents = async (req, res) => {
    try {
        const search = req.query.search || '';
        const searchParam = `%${search}%`;
        const requesterRole = req.user.role;

        // استعلام SQL متقدم وعلائقي ديناميكي:
        // إذا كان السائل هو المشرف الأساسي (Super_Admin)، نرجح إرجاع جميع حسابات النظام لتوزيع المهام.
        // وإلا (مثل مشرف شؤون الطلاب)، نقتصر حتماً على جلب رتبة الطلاب العاديين (student) لحماية الخصوصية.
        let roleFilterClause = "u.role = 'student'";
        if (requesterRole === 'Super_Admin' || requesterRole === 'admin') {
            roleFilterClause = "1=1"; // لا يتم التصفية بناءً على الرتبة (يُعرض الجميع للمشرف العام)
        }

        const query = `
            SELECT 
                u.id, 
                u.student_id, 
                u.Name, 
                u.birth_year,
                u.role,
                COUNT(CASE WHEN a.status = 'حاضر' THEN 1 END) AS present_days,
                COUNT(a.attendance_id) AS total_days,
                IFNULL(ROUND((COUNT(CASE WHEN a.status = 'حاضر' THEN 1 END) / NULLIF(COUNT(a.attendance_id), 0)) * 100), 0) AS attendance_rate
            FROM Users u
            LEFT JOIN Attendance a ON u.id = a.user_id
            WHERE ${roleFilterClause} AND (u.Name LIKE ? OR u.student_id LIKE ?)
            GROUP BY u.id
            ORDER BY u.Name ASC
        `;

        const [students] = await pool.query(query, [searchParam, searchParam]);
        res.status(200).json(students);

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء جلب قائمة الطلاب' });
    }
};

// ==============================================================================
// 2. تسجيل وإضافة طالب جديد في قاعدة البيانات
// POST /api/students
// ==============================================================================
exports.addStudent = async (req, res) => {
    try {
        const { student_id, Name, birth_year, password, role } = req.body;
        const requesterRole = req.user.role;

        // 1. التحقق من اكتمال البيانات المدخلة
        if (!student_id || !Name || !birth_year || !password) {
            return res.status(400).json({ error: 'جميع الحقول (رقم القيد، الاسم الكامل، سنة الميلاد، كلمة المرور) إلزامية' });
        }

        // 2. التحقق من الصلاحيات وتوزيع الرتب
        // فقط المشرف الأساسي (Super_Admin) هو من يملك الصلاحية لإضافة مستخدمين برتبة إدارية (إدارة الصلاحيات).
        // بقية المشرفين (مثل شؤون الطلاب) يقتصر عملهم حتماً على إضافة رتبة طالب (student) حماية للسياسة الأمنية.
        let targetRole = 'student';
        if ((requesterRole === 'Super_Admin' || requesterRole === 'admin') && role) {
            if (['student', 'Students_Admin', 'Curriculum_Admin', 'Super_Admin'].includes(role)) {
                targetRole = role;
            }
        }

        // 3. التحقق من أن رقم القيد فريد وغير مكرر
        const [existingUser] = await pool.query('SELECT id FROM Users WHERE student_id = ?', [student_id.trim()]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: '⚠️ رقم القيد هذا مسجل مسبقاً في النظام لمستخدم آخر!' });
        }

        // 4. تشفير كلمة المرور الافتراضية باستخدام Bcrypt (التحصين الأمني)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 5. حفظ البيانات بأمان عبر استعلامات مجهزة
        const insertQuery = `
            INSERT INTO Users (student_id, Name, birth_year, Password_hash, role) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(insertQuery, [
            student_id.trim(),
            Name.trim(),
            parseInt(birth_year),
            passwordHash,
            targetRole
        ]);

        res.status(201).json({
            message: 'تم تسجيل وإضافة الحساب بنجاح إلى قاعدة البيانات',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error adding student/admin:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء إضافة الحساب الجديد' });
    }
};

// ==============================================================================
// 3. تعديل بيانات طالب قائم
// PUT /api/students/:id
// ==============================================================================
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, Name, birth_year, password, role } = req.body;
        const requesterRole = req.user.role;

        // 1. التحقق من صحة المعطيات الأساسية
        if (!student_id || !Name || !birth_year) {
            return res.status(400).json({ error: 'الاسم، رقم القيد، وسنة الميلاد حقول إلزامية' });
        }

        // 2. التحقق من عدم تعارض رقم القيد المعدل مع مستخدم آخر
        const [conflictUser] = await pool.query(
            'SELECT id FROM Users WHERE student_id = ? AND id != ?', 
            [student_id.trim(), id]
        );
        if (conflictUser.length > 0) {
            return res.status(400).json({ error: '⚠️ رقم القيد هذا مأخوذ مسبقاً من مستخدم آخر في النظام' });
        }

        // 3. التحقق الأمني من الصلاحية (Role-Based Update Guard)
        // إذا كان المصدق هو شؤون الطلاب، فيُمنع تماماً من تعديل أي حساب ليس برتبة 'student'.
        // المشرف العام وحده هو من يملك الصلاحية لتغيير الأدوار أو تعديل بيانات المشرفين الآخرين.
        const [targetUser] = await pool.query('SELECT role FROM Users WHERE id = ?', [id]);
        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'المستخدم المطلوب تعديله غير موجود' });
        }

        if (requesterRole !== 'Super_Admin' && requesterRole !== 'admin' && targetUser[0].role !== 'student') {
            return res.status(403).json({ error: '⚠️ غير مصرح لك بتعديل بيانات هذا الحساب الإداري' });
        }

        let updateQuery = '';
        let queryParams = [];

        // بناء استعلام التعديل بناءً على الرتبة والصلاحيات المسموحة
        const hasPassword = password && password.trim() !== '';
        const isSuperAdmin = requesterRole === 'Super_Admin' || requesterRole === 'admin';

        if (isSuperAdmin) {
            // المشرف العام يستطيع تعديل رتبة الحساب
            const targetRole = role || targetUser[0].role;
            if (hasPassword) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);
                updateQuery = `
                    UPDATE Users 
                    SET student_id = ?, Name = ?, birth_year = ?, Password_hash = ?, role = ?
                    WHERE id = ?
                `;
                queryParams = [student_id.trim(), Name.trim(), parseInt(birth_year), passwordHash, targetRole, id];
            } else {
                updateQuery = `
                    UPDATE Users 
                    SET student_id = ?, Name = ?, birth_year = ?, role = ?
                    WHERE id = ?
                `;
                queryParams = [student_id.trim(), Name.trim(), parseInt(birth_year), targetRole, id];
            }
        } else {
            // بقية المشرفين يعدلون فقط بيانات الطلاب دون تغيير الأدوار
            if (hasPassword) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);
                updateQuery = `
                    UPDATE Users 
                    SET student_id = ?, Name = ?, birth_year = ?, Password_hash = ?
                    WHERE id = ? AND role = 'student'
                `;
                queryParams = [student_id.trim(), Name.trim(), parseInt(birth_year), passwordHash, id];
            } else {
                updateQuery = `
                    UPDATE Users 
                    SET student_id = ?, Name = ?, birth_year = ?
                    WHERE id = ? AND role = 'student'
                `;
                queryParams = [student_id.trim(), Name.trim(), parseInt(birth_year), id];
            }
        }

        const [result] = await pool.query(updateQuery, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'الحساب المطلوب تعديله غير موجود في النظام' });
        }

        res.status(200).json({ message: 'تم تحديث البيانات بنجاح' });

    } catch (error) {
        console.error('Error updating student/admin:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تحديث البيانات' });
    }
};

// ==============================================================================
// 4. حذف سجل طالب نهائياً من قاعدة البيانات
// DELETE /api/students/:id
// ==============================================================================
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterRole = req.user.role;
        const requesterId = req.user.id;

        // 1. التحقق من رتبة المستخدم المطلوب حذفه
        const [targetUser] = await pool.query('SELECT role FROM Users WHERE id = ?', [id]);
        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'لم يتم العثور على الحساب المطلوب حذفه' });
        }

        // 2. الحماية الأمنية من تصاعد الصلاحيات والحذف العشوائي
        // - شؤون الطلاب يستطيع فقط حذف رتبة 'student'.
        // - المشرف الأساسي يستطيع حذف أي مستخدم عدا نفسه لمنع التدمير الذاتي للنظام.
        if (requesterRole !== 'Super_Admin' && requesterRole !== 'admin') {
            if (targetUser[0].role !== 'student') {
                return res.status(403).json({ error: '⚠️ غير مصرح لك بحذف حسابات إدارية أخرى' });
            }
        } else {
            if (parseInt(id) === parseInt(requesterId)) {
                return res.status(400).json({ error: '🛑 لا يمكنك حذف حسابك الأساسي بنفسك!' });
            }
        }

        // 3. تنفيذ الحذف الآمن (ON DELETE CASCADE ستتكفل بمسح الحضور والدخول)
        const [result] = await pool.query("DELETE FROM Users WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'لم يتم العثور على الحساب المطلوب حذفه' });
        }

        res.status(200).json({ message: 'تم حذف الحساب وكافة بياناته المرتبطة بنجاح من النظام' });

    } catch (error) {
        console.error('Error deleting student/admin:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء حذف الحساب' });
    }
};
