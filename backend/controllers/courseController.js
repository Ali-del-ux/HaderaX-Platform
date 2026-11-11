const pool = require('../config/db');

// ==============================================================================
// وحدة التحكم الخاصة بالكورسات (Course Controller)
// نمط العمارة (Architectural Pattern): MVC (Model-View-Controller)
// ==============================================================================

// 1. استرجاع جميع الكورسات (Public Route)
exports.getAllCourses = async (req, res) => {
    try {
        // ==============================================================================
        // مبدأ (Separation of Concerns):
        // وحدة التحكم هنا وظيفتها فقط التخاطب مع قاعدة البيانات وإرجاع البيانات بصيغة JSON.
        // هي لا تهتم إطلاقاً بكيفية عرض هذه البيانات في الواجهة الأمامية، مما يجعل الكود نظيفاً، 
        // مستقلاً، وقابلاً لإعادة الاستخدام عبر منصات مختلفة (ويب، موبايل، الخ).
        // ==============================================================================
        const [courses] = await pool.query('SELECT * FROM Courses ORDER BY course_id DESC');
        
        // إرجاع كود 200 (OK) مع قائمة الكورسات
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء جلب الكورسات' });
    }
};

// 2. إضافة كورس جديد (Protected Route)
exports.addCourse = async (req, res) => {
    try {
        const { course_title, description, image_url } = req.body;

        // التحقق من صحة المدخلات (Input Validation) قبل استهلاك موارد السيرفر
        if (!course_title || !description) {
            return res.status(400).json({ error: 'عنوان الكورس ووصفه حقول إلزامية' });
        }

        // ==============================================================================
        // الأمان ضد هجمات الحقن (SQLi Prevention):
        // يتم تمرير المدخلات القادمة من واجهة المستخدم كمصفوفة (Array) إلى مكتبة mysql2، 
        // والتي تقوم بمعاملتها كمتغيرات آمنة (Parameterized Queries) باستخدام الرمز (?).
        // هذا يحبط تماماً أي محاولة لحقن كود SQL خبيث يهدف لحذف أو اختراق قاعدة البيانات.
        // ==============================================================================
        const query = `
            INSERT INTO Courses (course_title, description, image_url) 
            VALUES (?, ?, ?)
        `;
        const values = [course_title, description, image_url];

        // تنفيذ عملية الإضافة
        const [result] = await pool.query(query, values);

        // إرجاع كود 201 (Created) للدلالة بدقة على نجاح عملية الإنشاء وفقاً لمعايير (RESTful)
        res.status(201).json({ 
            message: 'تم إضافة الكورس بنجاح', 
            courseId: result.insertId 
        });

    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء إضافة الكورس' });
    }
};

// ==============================================================================
// 3. تحديث بيانات كورس قائم (PUT /api/courses/:id)
// نمط المعمارية (RESTful Architecture):
// نستخدم طريقة (PUT) للتعبير بدقة عن إجراء عملية التعديل/التحديث (Update) 
// على مورد قائم ومحدد بالمعرف الفريد (:id) الممرر في مسار الرابط (URL Parameter).
// ==============================================================================
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_title, description, image_url } = req.body;

        // التحقق من المدخلات قبل التعديل لضمان جودة وتكامل البيانات
        if (!course_title || !description) {
            return res.status(400).json({ error: 'عنوان الكورس ووصفه حقول إلزامية للتحديث' });
        }

        // الحماية من ثغرات SQLi عبر الاستعلامات المحضرة
        const query = `
            UPDATE Courses 
            SET course_title = ?, description = ?, image_url = ?
            WHERE course_id = ?
        `;
        const values = [course_title, description, image_url || '', id];

        const [result] = await pool.query(query, values);

        // التحقق مما إذا كان الكورس موجوداً بالفعل في قاعدة البيانات أم لا
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'الكورس المطلوب غير موجود لتعديله' });
        }

        res.status(200).json({ message: 'تم تحديث بيانات الكورس بنجاح' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تحديث الكورس' });
    }
};

// ==============================================================================
// 4. حذف كورس قائم بالكامل (DELETE /api/courses/:id)
// متطلب أكاديمي (Academic Concept - RDBMS Cascading Deletes):
// هنا تتجلى القوة الهندسية لقواعد البيانات العلائقية (Relational Databases).
// بما أننا قمنا بتهيئة جدول الأقسام (Course_Sections) بوجود مفتاح أجنبي (Foreign Key)
// يربطه بجدول الكورسات (Courses) ومقترن بشرط الحذف المتتالي (ON DELETE CASCADE)،
// فإن حذف الكورس الأب هنا سيقوم تلقائياً وبشكل متسلسل (Cascading Delete) بحذف كافة الأقسام 
// والملفات التابعة له من الجداول الأخرى في الخلفية دون أي تدخل يدوي!
// هذا يمنع تراكم البيانات اليتيمة (Orphaned Data) ويضمن سلامة ونظافة قاعدة البيانات (Referential Integrity).
// ==============================================================================
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // استعلام حذف الكورس الأب (سيقوم MySQL بحذف الأبناء تلقائياً بفضل Cascading)
        const query = 'DELETE FROM Courses WHERE course_id = ?';
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'الكورس المطلوب غير موجود لحذفه' });
        }

        res.status(200).json({ message: 'تم حذف الكورس وجميع الأقسام التابعة له تلقائياً بنجاح' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء حذف الكورس' });
    }
};

// ==============================================================================
// 5. استرجاع أقسام كورس محدد (GET /api/courses/:courseId/sections)
// متطلب أكاديمي (Academic Concept - RESTful Sub-Resource Routing):
// في تصميم واجهات الويب القياسية، نستخدم مسارات الموارد الفرعية (Sub-Resources) 
// للتعبير عن الهيكل الهرمي للمشروع. فالمسار (/api/courses/:courseId/sections)
// يوضح فوراً وبشكل صريح أن "الأقسام" (Sections) هي مورد فرعي يتبع للمورد الأب "الكورسات".
// هذا المسار مفتوح للجميع (Public Route) ليتمكن الطلاب والزوار من الاطلاع على محتويات الكورس.
// ==============================================================================
exports.getCourseSections = async (req, res) => {
    try {
        const { courseId } = req.params;

        // جلب الأقسام المرتبطة بالكورس الأب مرتبة تصاعدياً حسب تاريخ الإنشاء
        const query = 'SELECT * FROM Course_Sections WHERE course_id = ? ORDER BY id ASC';
        const [sections] = await pool.query(query, [courseId]);

        res.status(200).json(sections);
    } catch (error) {
        console.error('Error fetching course sections:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء جلب أقسام الكورس' });
    }
};

// ==============================================================================
// 6. إضافة قسم جديد لكورس محدد (POST /api/courses/:courseId/sections)
// مسار محمي ومؤمن بجدار حماية المشرفين (Protected Route via requireAuth):
// يتم تمرير معرّف الكورس الأب في الرابط، وعنوان القسم الجديد في جسم الطلب (Body JSON).
// ==============================================================================
exports.addCourseSection = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title } = req.body;

        // التحقق من المدخلات الأساسية قبل الحفظ
        if (!title) {
            return res.status(400).json({ error: 'عنوان القسم حقل إلزامي لإنشائه' });
        }

        // خطوة أمان إضافية: التحقق من وجود الكورس الأب في قاعدة البيانات لمنع إدخال أقسام لكورسات وهمية
        const [courses] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);
        if (courses.length === 0) {
            return res.status(404).json({ error: 'الكورس الأب غير موجود في النظام' });
        }

        // إدراج القسم الجديد وحفظه بأمان ضد ثغرات SQLi
        const query = 'INSERT INTO Course_Sections (course_id, title) VALUES (?, ?)';
        const [result] = await pool.query(query, [courseId, title]);

        res.status(201).json({
            message: 'تم إضافة القسم بنجاح في قاعدة البيانات',
            sectionId: result.insertId
        });
    } catch (error) {
        console.error('Error adding course section:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء إضافة قسم الكورس' });
    }
};

// ==============================================================================
// 7. حذف قسم كورس قائم بالكامل (DELETE /api/courses/sections/:sectionId)
// مسار محمي ومؤمن بجدار حماية المشرفين (Protected Route via requireAuth):
// يتم تمرير معرّف القسم الفرعي (:sectionId) في مسار الرابط للتعامل معه مباشرة.
// ==============================================================================
exports.deleteCourseSection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // استعلام حذف القسم آمن تماماً ضد ثغرات SQLi
        const query = 'DELETE FROM Course_Sections WHERE id = ?';
        const [result] = await pool.query(query, [sectionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'القسم المطلوب غير موجود لحذفه' });
        }

        res.status(200).json({ message: 'تم حذف قسم الكورس بنجاح من قاعدة البيانات' });
    } catch (error) {
        console.error('Error deleting course section:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء حذف قسم الكورس' });
    }
};

// ==============================================================================
// 8. تحديث عنوان قسم كورس قائم (PUT /api/courses/sections/:sectionId)
// مسار محمي ومؤمن بجدار حماية المشرفين (Protected Route via requireAuth):
// يتم تمرير معرّف القسم الفرعي (:sectionId) في مسار الرابط للتعامل معه مباشرة.
// وعنوان القسم الجديد في جسم الطلب (Body JSON).
// ==============================================================================
exports.updateCourseSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title } = req.body;

        // التحقق من المدخلات الأساسية قبل التعديل لضمان جودة وتكامل البيانات
        if (!title) {
            return res.status(400).json({ error: 'عنوان القسم حقل إلزامي للتحديث' });
        }

        // استعلام تحديث القسم آمن تماماً ضد ثغرات SQLi عبر الاستعلامات المحضرة
        const query = 'UPDATE Course_Sections SET title = ? WHERE id = ?';
        const [result] = await pool.query(query, [title, sectionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'القسم المطلوب غير موجود لتعديله' });
        }

        res.status(200).json({ message: 'تم تحديث قسم الكورس بنجاح في قاعدة البيانات' });
    } catch (error) {
        console.error('Error updating course section:', error);
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء تحديث قسم الكورس' });
    }
};
