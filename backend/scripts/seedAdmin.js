const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * ==============================================================================
 * سكربت حقن مسؤولي النظام بالأدوار الثلاثة (Admin Roles Seeder Script)
 * 
 * المبدأ الأكاديمي المطبق (Automated Provisioning & RBAC Initialization):
 * يقوم هذا السكربت بحقن الحسابات الثلاثة للمشرفين بكلمات مرور مشفرة بـ bcrypt:
 * 1. admin -> Super_Admin
 * 2. admin_students -> Students_Admin
 * 3. admin_curriculum -> Curriculum_Admin
 * ==============================================================================
 */
async function seedAdmins() {
    try {
        console.log('🔄 جاري حقن حسابات المشرفين الثلاثة في النظام...');

        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash('123456', salt);

        const admins = [
            { id: 'admin', name: 'المشرف العام الأساسي', role: 'Super_Admin' },
            { id: 'admin_students', name: 'مشرف شؤون الطلاب', role: 'Students_Admin' },
            { id: 'admin_curriculum', name: 'مشرف شؤون المناهج', role: 'Curriculum_Admin' }
        ];

        const query = `
            INSERT INTO Users (student_id, Name, Password_hash, role) 
            VALUES (?, ?, ?, ?)
        `;

        for (const admin of admins) {
            try {
                await pool.query(query, [admin.id, admin.name, hashed_password, admin.role]);
                console.log(`✅ تم إنشاء وتأمين حساب: [${admin.name}] بنجاح!`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ حساب [${admin.name}] (${admin.id}) موجود مسبقاً.`);
                } else {
                    console.error(`❌ فشل إنشاء حساب [${admin.name}]:`, err.message);
                }
            }
        }

        console.log('🎉 اكتملت عملية التهيية وتأمين حسابات المشرفين بنجاح!');
        
    } catch (error) {
        console.error('❌ حدث خطأ غير متوقع أثناء تشغيل السكربت:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

// تنفيذ وظيفة الحقن
seedAdmins();

