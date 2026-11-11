const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * ==============================================================================
 * سكربت الاستيراد الجماعي التلقائي للطلاب (Automatic Student CSV Importer)
 * 
 * المفهوم الأكاديمي المطبق (Automated Provisioning & Mass Seeding):
 * في الأنظمة المؤسسية الكبرى، يفضل دائماً تجنب إدخال البيانات الضخمة يدوياً.
 * هذا السكربت يمثل أداة لتوفير الجهد (CLI Seeder) عن طريق قراءة ملف البيانات الخام
 * (CSV) وتحليلها، ثم تشفير كلمات مرورهم الافتراضية بشكل مستقل وحقنهم في قاعدة البيانات.
 * ==============================================================================
 */
async function importStudents() {
    try {
        console.log('🔄 جاري بدء قراءة وتحليل ملف الطلاب CSV...');

        // 1. تحديد مسار ملف CSV المستهدف بدقة مطلقة
        const csvPath = path.join(__dirname, '../../SHU_DevsClub - Sheet1.csv');

        // التحقق الوقائي من وجود الملف قبل البدء لتفادي الانهيار المفاجئ
        if (!fs.existsSync(csvPath)) {
            console.error(`❌ خطأ: لم يتم العثور على ملف CSV في المسار المخصص: ${csvPath}`);
            process.exit(1);
        }

        // 2. قراءة محتوى الملف وتحويله إلى نصوص مجزأة
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent.split(/\r?\n/); // تقسيم الأسطر بمرونة للعمل على جميع أنظمة التشغيل (Windows/Linux)

        if (lines.length <= 1) {
            console.log('⚠️ الملف فارغ أو لا يحتوي على بيانات صالحة للاستيراد.');
            process.exit(0);
        }

        // 3. توليد وتجهيز كلمة المرور الافتراضية الموحدة المشفرة
        // بدلاً من تشفير كلمة المرور بشكل مكرر ومكلف للسرعة والأداء داخل حلقة التكرار (Loop)،
        // نقوم بتشفير كلمة المرور الافتراضية الموحدة (مثل "123456") *مرة واحدة فقط* في الذاكرة
        // ثم تمرير الـ Hash الجاهز لجميع الطلاب لضمان أقصى كفاءة في الأداء (Maximum Performance).
        const defaultPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash(defaultPassword, salt);

        console.log(`📌 تم إعداد وتأمين كلمة المرور الافتراضية للطلاب: ${defaultPassword} (مشفرة)`);
        console.log('🚀 جاري بدء عملية الفحص والحقن الجماعي بأمان...');

        let successCount = 0;
        let skipCount = 0;

        // 4. المرور على أسطر ملف CSV وحقنها
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // أ. تخطي السطر الأول إذا كان يحتوي على رؤوس الأعمدة (Header row)
            if (i === 0 && line.toLowerCase().startsWith('id')) {
                continue;
            }

            // ب. تخطي الأسطر الفارغة تماماً
            if (line === '') {
                continue;
            }

            // ج. فصل البيانات بالاعتماد على الفاصلة (Comma Separator)
            const parts = line.split(',');
            if (parts.length < 2) {
                console.log(`⚠️ تخطي السطر [${i + 1}] بسبب بنية بيانات غير صالحة: ${line}`);
                skipCount++;
                continue;
            }

            const student_id = parts[0].trim();
            const Name = parts[1].trim();

            if (!student_id || !Name) {
                console.log(`⚠️ تخطي السطر [${i + 1}] بسبب حقول فارغة.`);
                skipCount++;
                continue;
            }

            try {
                // د. حقن البيانات بأمان تام ضد ثغرات SQLi باستخدام الاستعلامات المجهزة
                // سنة الميلاد (birth_year) ستُترك بقيمة NULL كما تم الاتفاق ليتم تعديلها لاحقاً
                const query = `
                    INSERT INTO Users (student_id, Name, birth_year, Password_hash, role) 
                    VALUES (?, ?, NULL, ?, 'student')
                `;
                
                await pool.query(query, [student_id, Name, defaultPasswordHash]);
                successCount++;

            } catch (insertError) {
                // هـ. الحماية من التكرار والتعامل المرن مع الأخطاء (Graceful Duplicate Handling):
                // نلتقط خطأ المفتاح المكرر (ER_DUP_ENTRY) لتخطي الطالب المسجل مسبقاً بدلاً من تعطل البرنامج
                if (insertError.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ تخطي الطالب: [${Name}] ذو القيد [${student_id}] لأنه مسجل مسبقاً بالنظام.`);
                    skipCount++;
                } else {
                    console.error(`❌ فشل حقن الطالب [${Name}] بسبب خطأ غير متوقع:`, insertError.message);
                    skipCount++;
                }
            }
        }

        // ==============================================================================
        // 5. تقرير التلخيص البرمجي النهائي للطرفية
        // ==============================================================================
        console.log('\n======================================================');
        console.log('🎉 تم الانتهاء من عملية الاستيراد الجماعي بنجاح!');
        console.log(`✅ إجمالي المقبولين والمضافين الجدد: ${successCount} طالب`);
        console.log(`⚠️ إجمالي المستبعدين أو المكررين مسبقاً: ${skipCount} طالب`);
        console.log('======================================================\n');

    } catch (error) {
        console.error('❌ حدث خطأ برمجي غير متوقع في سكربت الاستيراد:', error.message);
    } finally {
        // تنظيف وحفظ موارد قاعدة البيانات
        await pool.end();
        process.exit(0);
    }
}

// تشغيل السكربت تلقائياً
importStudents();
