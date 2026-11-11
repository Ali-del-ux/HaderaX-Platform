/**
 * admin.js — Admin Portal Logic
 * Extracted from: Admin_portal.html
 * 
 * Responsibilities:
 *   1. Zero Trust Session Verification (Security)
 *   2. Tab switching (Users / Course Files)
 *   3. Add Student modal (open, close, password generation)
 *   4. QR Attendance modal (open, close, QR generation, live polling)
 *   5. Course Builder (new course input, add content form, new section form)
 */

// ==============================================================================
// ثوابت تنسيق التبويبات والمظهر العام (Tab Classes & Style Constants)
// ==============================================================================
const ACTIVE_TAB_CLASSES = "px-8 py-2.5 rounded-md bg-primary-container text-white font-bold transition-all shadow-sm";
const INACTIVE_TAB_CLASSES = "px-8 py-2.5 rounded-md bg-white text-secondary hover:text-primary-container font-bold transition-all";
const DISABLED_TAB_CLASSES = "px-8 py-2.5 rounded-md bg-gray-100 text-slate-400 font-bold opacity-60 cursor-not-allowed";

function disableTab(tabBtn, originalText) {
    if (!tabBtn) return;
    tabBtn.disabled = true;
    tabBtn.className = DISABLED_TAB_CLASSES;
    tabBtn.innerHTML = `🔒 ${originalText}`;
    tabBtn.style.pointerEvents = 'none'; // منع الأحداث تماماً
}

// ==============================================================================
// نظام النوافذ والتنبيهات المخصصة الفاخرة (Custom Premium Dialogs & Toast System)
// ==============================================================================

/**
 * إظهار تنبيه منبثق سريع (Toast Notification)
 * @param {string} message - نص الرسالة المراد عرضها
 * @param {string} type - نوع التنبيه ('success', 'error', 'warning', 'info')
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // تحديد الألوان والأيقونات بناءً على نوع التنبيه
    let icon = 'info';
    let iconColor = 'text-blue-500';
    let borderClass = 'border-blue-500';

    if (type === 'success') {
        icon = 'check_circle';
        iconColor = 'text-green-500';
        borderClass = 'border-green-500';
    } else if (type === 'error') {
        icon = 'cancel';
        iconColor = 'text-red-500';
        borderClass = 'border-red-500';
    } else if (type === 'warning') {
        icon = 'warning';
        iconColor = 'text-yellow-500';
        borderClass = 'border-yellow-500';
    }

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-4 rounded-xl border-l-4 ${borderClass} shadow-lg bg-white pointer-events-auto transition-all duration-300 transform translate-x-[-20px] opacity-0 animate-scale-in max-w-sm w-full`;

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor} text-2xl flex-shrink-0">${icon}</span>
        <div class="text-on-surface text-sm font-bold flex-grow">${message}</div>
        <button class="text-secondary hover:text-on-surface transition-colors flex-shrink-0 ml-1">
            <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
    `;

    // معالجة النقر على زر الإغلاق يدوياً
    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.add('opacity-0', 'translate-y-[-10px]');
        setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    // حركات الدخول الانسيابية
    setTimeout(() => {
        toast.classList.remove('translate-x-[-20px]', 'opacity-0');
    }, 10);

    // تدمير ذاتي بعد 3 ثوانٍ
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('opacity-0', 'translate-y-[-10px]');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// تصدير الدالة لتكون عالمية
window.showToast = showToast;

/**
 * إظهار نافذة تأكيد مخصصة (Custom Elegant Confirm Modal)
 * @param {string} title - عنوان النافذة
 * @param {string} message - نص السؤال أو رسالة التحذير
 * @param {function} onConfirm - دالة الاستدعاء عند الموافقة (Yes)
 * @param {function} [onCancel] - دالة الاستدعاء عند الإلغاء (No)
 */
function showCustomConfirm(title, message, onConfirm, onCancel = null) {
    const modal = document.getElementById('custom-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-modal-confirm-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
    const backdrop = document.getElementById('confirm-modal-backdrop');

    if (!modal || !confirmBtn || !cancelBtn) return;

    // ملء النصوص
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    // عرض المودال ومنع تحريك الصفحة الخلفية
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // تنظيف مستمعي الأحداث القدامى لتفادي التكرار (Memory Leak & Double Execution prevention)
    const cleanup = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        // استنساخ الأزرار وإبدالها لتفريغ المستمعين
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newBackdrop = backdrop.cloneNode(true);

        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        backdrop.parentNode.replaceChild(newBackdrop, backdrop);
    };

    // مستمع النقر للموافقة
    confirmBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });

    // مستمع النقر للإلغاء
    const handleCancel = () => {
        cleanup();
        if (onCancel) onCancel();
    };

    cancelBtn.addEventListener('click', handleCancel);
    backdrop.addEventListener('click', handleCancel);
}

window.showCustomConfirm = showCustomConfirm;

/**
 * إظهار نافذة إدخال مخصصة (Custom Elegant Prompt Modal)
 * @param {string} title - عنوان النافذة
 * @param {string} label - مسمى الحقل
 * @param {string} defaultValue - القيمة الافتراضية المكتوبة
 * @param {function} onSubmit - دالة الاستدعاء عند حفظ المدخل
 */
function showCustomPrompt(title, label, defaultValue, onSubmit) {
    const modal = document.getElementById('custom-prompt-modal');
    const titleEl = document.getElementById('prompt-modal-title');
    const labelEl = document.getElementById('prompt-modal-label');
    const inputEl = document.getElementById('prompt-modal-input');
    const submitBtn = document.getElementById('prompt-modal-submit-btn');
    const cancelBtn = document.getElementById('prompt-modal-cancel-btn');
    const closeIcon = document.getElementById('close-prompt-modal-icon');
    const backdrop = document.getElementById('prompt-modal-backdrop');

    if (!modal || !submitBtn || !cancelBtn || !inputEl) return;

    // ملء النصوص والاسم القديم
    if (titleEl) titleEl.innerHTML = `<span class="material-symbols-outlined">edit</span> ${title}`;
    if (labelEl) labelEl.textContent = label;
    inputEl.value = defaultValue;

    // إظهار المودال ومنع حركة الخلفية
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    inputEl.focus();

    const cleanup = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        const newSubmitBtn = submitBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newCloseIcon = closeIcon.cloneNode(true);
        const newBackdrop = backdrop.cloneNode(true);

        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        closeIcon.parentNode.replaceChild(newCloseIcon, closeIcon);
        backdrop.parentNode.replaceChild(newBackdrop, backdrop);
    };

    submitBtn.addEventListener('click', () => {
        const val = inputEl.value.trim();
        cleanup();
        if (onSubmit) onSubmit(val);
    });

    const handleCancel = () => {
        cleanup();
    };

    cancelBtn.addEventListener('click', handleCancel);
    closeIcon.addEventListener('click', handleCancel);
    backdrop.addEventListener('click', handleCancel);

    // تفعيل ضغط مفتاح Enter كطريقة بديلة وسريعة للإرسال
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
}

window.showCustomPrompt = showCustomPrompt;

/**
 * إظهار نافذة اختيار منسدلة مخصصة وفخمة (Custom Elegant Dropdown Prompt Modal)
 * متطلب أكاديمي: تضمن هذه الدالة التفاعل الآمن عبر تفادي الإدخال العشوائي، وتتبع نمط البرمجة الوظيفية.
 * لمنع تسريب الذاكرة (Memory Leak Prevention)، نقوم باستنساخ أزرار التفاعل قبل إرفاق المستمعين في كل استدعاء.
 * 
 * @param {string} title - عنوان النافذة المنبثقة
 * @param {string} label - الوصف التوضيحي لحقل الاختيار
 * @param {Array<{value: string, text: string}>} options - الخيارات التي سيتم عرضها في القائمة
 * @param {string} defaultValue - القيمة المحددة تلقائياً عند الفتح
 * @param {function} onSubmit - الدالة المستدعاة عند الموافقة وحفظ القيمة
 */
function showCustomDropdownPrompt(title, label, options, defaultValue, onSubmit) {
    const modal = document.getElementById('custom-dropdown-prompt-modal');
    const titleEl = document.getElementById('dropdown-prompt-modal-title');
    const labelEl = document.getElementById('dropdown-prompt-modal-label');
    const selectEl = document.getElementById('dropdown-prompt-modal-select');
    const submitBtn = document.getElementById('dropdown-prompt-modal-submit-btn');
    const cancelBtn = document.getElementById('dropdown-prompt-modal-cancel-btn');
    const closeIcon = document.getElementById('close-dropdown-prompt-modal-icon');
    const backdrop = document.getElementById('dropdown-prompt-modal-backdrop');

    if (!modal || !submitBtn || !cancelBtn || !selectEl) return;

    // ملء نصوص العناوين والتلميحات ديناميكياً
    if (titleEl) titleEl.innerHTML = `<span class="material-symbols-outlined">edit</span> ${title}`;
    if (labelEl) labelEl.textContent = label;

    // حقن الخيارات في القائمة المنسدلة ديناميكياً لمنع التثبيت اليدوي وتسهيل التطوير المستقبلي
    selectEl.innerHTML = '';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        selectEl.appendChild(option);
    });

    // تعيين القيمة الافتراضية المحددة مسبقاً للحساب
    selectEl.value = defaultValue;

    // تفعيل ظهور النافذة ومنع انزلاق الصفحة الخلفية أثناء التفاعل
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    selectEl.focus();

    // دالة إغلاق المودال والتنظيف الشامل للمستمعين لتجنب تكرار التنفيذ (Event Propagation & Memory Cleanup)
    const cleanup = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        const newSubmitBtn = submitBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newCloseIcon = closeIcon.cloneNode(true);
        const newBackdrop = backdrop.cloneNode(true);

        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        closeIcon.parentNode.replaceChild(newCloseIcon, closeIcon);
        backdrop.parentNode.replaceChild(newBackdrop, backdrop);
    };

    // مستمع حدث الحفظ وتمرير القيمة المختارة
    submitBtn.addEventListener('click', () => {
        const val = selectEl.value;
        cleanup();
        if (onSubmit) onSubmit(val);
    });

    // مستمعي أحداث الإلغاء والإغلاق
    const handleCancel = () => {
        cleanup();
    };

    cancelBtn.addEventListener('click', handleCancel);
    closeIcon.addEventListener('click', handleCancel);
    backdrop.addEventListener('click', handleCancel);
}

window.showCustomDropdownPrompt = showCustomDropdownPrompt;

// ==============================================================================
// البوابة الأمنية للواجهة الأمامية (Zero Trust Client Verification)
// ==============================================================================
// متطلب أكاديمي (Academic Concept):
// هذا السكربت يطبق مبدأ "الثقة المعدومة" (Zero Trust). الواجهة الأمامية هنا لا تحتفظ
// بأي توكن (Token) في الـ LocalStorage ولا تثق بوجوده ولا تقوم بفك تشفيره.
// بدلاً من ذلك، في كل مرة تُفتح فيها هذه الصفحة، ترسل الواجهة طلباً صامتاً للخادم.
// المتصفح يرفق الكوكي (HttpOnly Cookie) تلقائياً بفضل إعداد (credentials: 'include').
// الخادم فقط هو من يملك المفتاح السري ويقرر ما إذا كانت الجلسة صالحة أم لا. 
// إذا كانت الإجابة 401 أو 403، يتم طرد المستخدم فوراً لصفحة تسجيل الدخول، 
// مما يجعل تزوير الجلسات أو التلاعب بها من طرف العميل (Client-side tampering) أمراً مستحيلاً.
// ==============================================================================
async function verifySession() {
    try {
        // ==============================================================================
        // [متطلب أكاديمي: Development Environment Strategy]
        // الاستراتيجية الديناميكية للتطوير المحلي (Dynamic Hostname Strategy):
        // نستخدم (window.location.hostname) لتفادي حجب المتصفح للكوكي بسبب اختلاف 
        // مسار الواجهة (127.0.0.1) عن السيرفر (localhost).
        // في أنظمة الإنتاج (Production Environment)، يتم استبدال هذا النهج واعتماد 
        // خادم Nginx كوكيل عكسي (Reverse Proxy) لتوحيد النطاقات وإخفاء المنافذ لتعزيز الحماية.
        // ==============================================================================
        const backendUrl = `http://${window.location.hostname}:3000/api/auth/me`;
        const response = await fetch(backendUrl, {
            method: 'GET',
            credentials: 'include' // إرسال الكوكي الآمنة مع الطلب
        });

        if (!response.ok) {
            // إذا كان الرد 401 (Unauthorized) أو 403 (Forbidden)، اطرد المستخدم
            console.warn('⚠️ محاولة وصول غير مصرح بها أو جلسة منتهية. جاري التوجيه...');
            // نستخدم location.replace بدلاً من href لمنع المستخدم من العودة للصفحة عبر زر "الرجوع"
            window.location.replace('login.html');
            return;
        }

        // إذا نجح التحقق (200 OK)
        const data = await response.json();
        console.log('✅ الجلسة صالحة وموثقة من الخادم.');
        console.log(`مرحباً: ${data.user.role}`);
        window.currentUserRole = data.user.role; // تخزين الرتبة للاستخدام في النوافذ والمعالجات المشتركة

        // ==============================================================================
        // تطبيق حماية "الدفاع في العمق" (Defense in Depth / Role-Based Redirection):
        // حتى لو كان التوكن صالحاً وجلسة العمل نشطة، فليس كل مستخدم مشرفاً!
        // نتحقق هنا من أن دور المستخدم هو مشرف (Super_Admin أو admin).
        // إذا حاول طالب عادي أو زائر غير مصرح له الدخول يدوياً عبر الرابط،
        // نقوم بطرده فوراً إلى الصفحة الرئيسية للطلاب (index.html) لمنع تسريب
        // هيكل وأدوات لوحة التحكم.
        // ==============================================================================
        const allowedAdminRoles = ['Super_Admin', 'admin', 'Students_Admin', 'Curriculum_Admin'];
        if (!allowedAdminRoles.includes(data.user.role)) {
            console.warn(`🛑 محاولة تسلل غير مصرح بها! المستخدم (${data.user.name}) بالرتبة (${data.user.role}) حاول فتح لوحة المشرفين.`);
            window.location.replace('index.html');
            return;
        }

        // ==============================================================================
        // حل ثغرة تسابق الأحداث غير المتزامن (Asynchronous Race Condition Protection):
        // بما أن verifySession تقوم بطلب غير متزامن (Fetch)، فقد يكتمل الطلب بعد إطلاق 
        // حدث DOMContentLoaded بالفعل من قبل المتصفح.
        // للوقاية من ذلك، نتحقق من حالة تحميل الوثيقة (document.readyState)؛ 
        // فإذا كانت لا تزال قيد التحميل، نسجل مستمع الأحداث، وإلا نقوم بتنفيذ الوظيفة فوراً.
        // ==============================================================================
        const initDOM = () => {
            const adminNameElement = document.querySelector('header span.text-sm.text-on-surface');
            if (adminNameElement && data.user.name) {
                adminNameElement.textContent = `اسم المشرف: ${data.user.name}`;
            }

            // ==============================================================================
            // التخصيص الديناميكي للوحة المشرفين (Dynamic RBAC Frontend Customization):
            // نتحقق من دور المشرف المسجل ونقوم بإخفاء/إظهار التبويبات والأقسام ديناميكياً.
            // ==============================================================================
            const role = data.user.role;
            const tabUsersBtn = document.getElementById('tab-users-btn');
            const tabFilesBtn = document.getElementById('tab-files-btn');
            const tabNewsBtn = document.getElementById('tab-news-btn');

            const sectionUsers = document.getElementById('section-users');
            const sectionFiles = document.getElementById('section-files');
            const sectionNews = document.getElementById('section-news');

            const studentRoleContainer = document.getElementById('student-role-container');

            if (role === 'Super_Admin' || role === 'admin') {
                // 1. المشرف الأساسي: يملك كامل الصلاحيات ويظهر له تبويب توزيع الرتب الإدارية
                if (studentRoleContainer) studentRoleContainer.classList.remove('hidden');

                // تحميل كامل البيانات
                loadCourses();
                loadStudentsList();
            }
            else if (role === 'Students_Admin') {
                // 2. مشرف شؤون الطلاب: تعطيل تبويبات الكورسات والأخبار بالكامل وحظر اختيار الرتب
                disableTab(tabFilesBtn, 'إدارة الكورسات والملفات');
                disableTab(tabNewsBtn, 'إدارة الأخبار والإعلانات');
                if (studentRoleContainer) studentRoleContainer.classList.add('hidden');

                // توجيه العميل تلقائياً وبشكل مرئي لتبويب شؤون الطلاب فقط
                if (sectionUsers) {
                    sectionUsers.classList.remove('hidden');
                    sectionUsers.classList.add('flex');
                }
                if (sectionFiles) {
                    sectionFiles.classList.add('hidden');
                    sectionFiles.classList.remove('flex');
                }
                if (sectionNews) {
                    sectionNews.classList.add('hidden');
                    sectionNews.classList.remove('flex');
                }

                // تحميل قائمة الطلاب فقط
                loadStudentsList();
            }
            else if (role === 'Curriculum_Admin') {
                // 3. مشرف شؤون المناهج: تعطيل تبويب بيانات الطلاب والتحكم بالرتب بالكامل
                disableTab(tabUsersBtn, 'بيانات المستخدم');
                if (studentRoleContainer) studentRoleContainer.classList.add('hidden');

                // تحويل مشرف المناهج تلقائياً لتبويب الكورسات كخيار افتراضي نشط وملون
                if (tabFilesBtn) {
                    tabFilesBtn.className = ACTIVE_TAB_CLASSES;
                }

                if (sectionUsers) {
                    sectionUsers.classList.add('hidden');
                    sectionUsers.classList.remove('flex');
                }
                if (sectionFiles) {
                    sectionFiles.classList.remove('hidden');
                    sectionFiles.classList.add('flex');
                }
                if (sectionNews) {
                    sectionNews.classList.add('hidden');
                    sectionNews.classList.remove('flex');
                }

                // تحميل الكورسات فقط
                loadCourses();
            }

            // إظهار المحتوى الرئيسي بعد اكتمال التحقق الأمني وتوزيع الصلاحيات بنجاح
            const mainEl = document.querySelector('main');
            if (mainEl) mainEl.classList.remove('hidden');
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initDOM);
        } else {
            initDOM();
        }

    } catch (error) {
        console.error('❌ خطأ في الاتصال بالخادم أثناء التحقق من الجلسة:', error);
        // في حالة انقطاع الاتصال بالسيرفر، لدواعي أمنية نعتبر الجلسة غير صالحة ونمنع الوصول
        window.location.replace('login.html');
    }
}

// تنفيذ التحقق الأمني فوراً وبشكل متزامن قبل تحميل باقي وظائف الصفحة
verifySession();

// ==============================================================================
// 1. جلب البيانات ديناميكياً (Dynamic Data Binding)
// ==============================================================================
// متطلب أكاديمي (Academic Concept - SPA & Dynamic DOM Manipulation):
// في تطبيقات الصفحة الواحدة (Single Page Applications)، لا نعتمد على الخادم (Server)
// لإرسال صفحات HTML كاملة وجاهزة، بل يقوم المتصفح بإرسال طلب (AJAX/Fetch) غير متزامن 
// لجلب البيانات الخام بصيغة JSON عبر الـ (RESTful API).
// 
// بعد وصول البيانات، نستخدم الجافاسكريبت للتعامل المباشر مع شجرة عناصر الصفحة (DOM)
// لإنشاء عناصر جديدة (مثل <option>) وحقنها (Injecting) في الصفحة فوراً بدون إعادة تحميل 
// (No Page Reload). هذه المعمارية تجعل التطبيق فائق السرعة (Responsive) وتقلل من 
// استهلاك حزمة البيانات (Bandwidth) بشكل كبير جداً، وهو معيار الصناعة الاحترافي.
// ==============================================================================
async function loadCourses() {
    try {
        const courseSelect = document.getElementById('course-select');
        const qrCourseSelect = document.getElementById('qr-course-select');

        // جلب البيانات من الخادم عبر الرابط الديناميكي
        const backendUrl = `http://${window.location.hostname}:3000/api/courses`;
        const response = await fetch(backendUrl);

        if (!response.ok) throw new Error('فشل جلب قائمة الكورسات');

        const courses = await response.json();

        // ==============================================================================
        // التخزين المؤقت للبيانات من جانب العميل (Client-Side Caching Strategy):
        // نقوم بحفظ قائمة الكورسات المسترجعة في متغير عام (window.cachedCourses)
        // لتسهيل الوصول إليها عند تعديل بيانات الكورس دون الحاجة لطلبها من الخادم مجدداً.
        // ==============================================================================
        window.cachedCourses = courses;

        // 2. التلاعب الديناميكي بالـ DOM (Dynamic DOM Manipulation)
        // تفريغ القائمة القديمة باستثناء الخيارات الثابتة
        if (courseSelect) {
            courseSelect.innerHTML = `
                <option value="" disabled selected>اختر الكورس...</option>
                <option value="new" class="text-primary font-bold">+ إنشاء كورس جديد</option>
            `;
        }

        if (qrCourseSelect) {
            qrCourseSelect.innerHTML = '<option value="" disabled selected>اختر الكورس لفتح الجلسة...</option>';
        }

        // 3. ربط البيانات (Data Binding)
        // نمر عبر المصفوفة (Array) التي استلمناها، ونصنع عنصراً لكل كورس
        courses.forEach(course => {
            // إضافة الكورس لقائمة منشئ الكورسات (Course Builder)
            if (courseSelect) {
                const option1 = document.createElement('option');
                option1.value = course.course_id;
                option1.textContent = course.course_title;
                courseSelect.appendChild(option1);
            }

            // إضافة الكورس لقائمة تسجيل الحضور (Attendance QR)
            if (qrCourseSelect) {
                const option2 = document.createElement('option');
                option2.value = course.course_id;
                option2.textContent = course.course_title;
                qrCourseSelect.appendChild(option2);
            }
        });

        console.log(`✅ تم تحميل وربط ${courses.length} كورسات بنجاح في الواجهة (Data Binding Complete).`);

    } catch (error) {
        console.error('❌ خطأ أثناء جلب الكورسات وتحديث الـ DOM:', error);
    }
}

// ==============================================================================
// مفهوم أكاديمي متقدم: تمويه العميل والربط الهرمي للبيانات (Client-Side Hydration & Hierarchical Data Binding)
// 
// في هذا القسم، نطبق إحدى أهم معايير الأداء والشبكات في تطوير تطبيقات الويب الحديثة (SPA):
// بدلاً من سحب كافة محتويات قاعدة البيانات مرة واحدة عند تحميل الصفحة (مما يتسبب في إهدار حزمة البيانات 
// وبطء كبير)، نعتمد على "الربط الهرمي". حيث لا نقوم بجلب الأقسام (Sections) التابعة لكورس معين 
// إلا عندما يقع هذا الكورس الأب في بؤرة التركيز (Parent in Focus).
//
// بمجرد اختيار الكورس، تقوم الدالة loadCourseSections بإرسال طلب fetch غير متزامن للمسار الفرعي 
// (GET /api/courses/:courseId/sections) وتقوم بـ "تمييه" (Hydrate) الواجهة الأمامية بالبيانات الحية، 
// مع تفريغ شجرة الـ DOM مسبقاً وتوفير رسالة "حالة فارغة" (Empty State) فخمة ومبهرة بجمالها 
// لجامعتك في حال عدم وجود أي محتوى مسبقاً.
// ==============================================================================
async function loadCourseSections(courseId) {
    try {
        const courseSectionsList = document.getElementById('course-sections-list');
        if (!courseSectionsList) return;

        // تفريغ المحتوى البصري القديم لتحضيره لتمييه البيانات الحية
        courseSectionsList.innerHTML = '';

        // جلب الأقسام من السيرفر بشكل ديناميكي
        const backendUrl = `http://${window.location.hostname}:3000/api/courses/${courseId}/sections`;
        const response = await fetch(backendUrl);

        if (!response.ok) throw new Error('فشل جلب أقسام الكورس من الخادم');

        const sections = await response.json();

        // في حال عدم وجود أقسام للكورس، نعرض تصميم الحالة الفارغة الفخم والمبهر
        if (sections.length === 0) {
            courseSectionsList.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 text-center bg-white border border-border-subtle rounded-2xl shadow-sm animate-scale-in">
                    <span class="material-symbols-outlined text-secondary text-5xl mb-3">folder_open</span>
                    <h4 class="font-bold text-lg text-on-surface mb-1">لا توجد أقسام في هذا الكورس حالياً</h4>
                    <p class="text-sm text-secondary">اضغط على زر "إضافة قسم جديد للكورس" بالأسفل لبدء بناء المحتوى التعليمي.</p>
                </div>
            `;
            return;
        }

        // جلب المواد الخاصة بكل قسم وتجميعها في بطاقات ديناميكية (Dynamic Materials Hydration)
        for (const section of sections) {
            // جلب المواد التعليمية الخاصة بالقسم
            const materialsUrl = `http://${window.location.hostname}:3000/api/materials/section/${section.id}`;
            const materialsRes = await fetch(materialsUrl);
            const materials = materialsRes.ok ? await materialsRes.json() : [];

            // بناء قائمة المواد بلغة HTML
            let materialsHtml = '';
            if (materials.length === 0) {
                materialsHtml = `
                    <div class="flex items-center gap-3 p-3 bg-surface-alt rounded-lg border border-border-subtle text-secondary text-sm">
                        <span class="material-symbols-outlined text-[18px]">info</span>
                        <span>لا توجد محاضرات أو ملفات في هذا القسم حالياً.</span>
                    </div>
                `;
            } else {
                materials.forEach(material => {
                    let icon = 'description';
                    let iconColor = 'text-primary-container';
                    let downloadUrl = material.url;

                    // تخصيص الأيقونات والألوان بناءً على نوع المادة أو امتداد الملف
                    if (material.type === 'link') {
                        icon = 'video_library';
                        iconColor = 'text-red-500';
                        if (material.url.includes('drive.google.com')) {
                            icon = 'cloud_queue';
                            iconColor = 'text-yellow-600';
                        }
                    } else {
                        // ملف مرفوع محلياً
                        downloadUrl = `http://${window.location.hostname}:3000${material.url}`;
                        if (material.url.toLowerCase().endsWith('.pdf')) {
                            icon = 'picture_as_pdf';
                            iconColor = 'text-red-650';
                        } else if (material.url.toLowerCase().endsWith('.mp4')) {
                            icon = 'play_circle';
                            iconColor = 'text-blue-500';
                        }
                    }

                    materialsHtml += `
                        <div class="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl border border-border-subtle group hover:bg-gray-50 transition-colors shadow-sm">
                            <a href="${downloadUrl}" target="_blank" class="flex items-center gap-3 flex-grow text-on-surface hover:text-primary-container transition-colors">
                                <span class="material-symbols-outlined ${iconColor} text-2xl">${icon}</span>
                                <div class="flex flex-col text-right">
                                    <span class="font-bold text-[14px]">${material.title}</span>
                                    ${material.type === 'link' ? '<span class="text-[9px] text-red-500 font-bold">رابط خارجي</span>' : '<span class="text-[9px] text-green-600 font-bold">ملف مرفوع</span>'}
                                </div>
                            </a>
                            <button onclick="deleteMaterial(${material.material_id})" class="text-secondary hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-1" title="مسح المادة">
                                <span class="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    `;
                });
            }

            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-sm animate-scale-in';
            sectionDiv.innerHTML = `
                <div class="bg-surface px-6 py-4 border-b border-border-subtle flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-secondary">drag_indicator</span> 
                        <h3 class="font-bold text-lg text-on-surface">القسم: ${section.title}</h3>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editSection(${section.id}, '${section.title.replace(/'/g, "\\'")}')" class="text-secondary hover:text-primary-container p-1" title="تعديل"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                        <button onclick="deleteSection(${section.id})" class="text-secondary hover:text-red-600 p-1" title="حذف"><span class="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                </div>
                
                <div class="p-6 flex flex-col gap-4">
                    <!-- قائمة المحاضرات والمواد المرفوعة -->
                    <div class="flex flex-col gap-2.5">
                        ${materialsHtml}
                    </div>
                    
                    <!-- زر تبديل إظهار نموذج الإضافة -->
                    <button id="toggle-add-content-${section.id}" onclick="showAddContentForm(${section.id})" class="w-full mt-2 py-3 border-2 border-dashed border-border-subtle rounded-xl text-secondary font-bold hover:border-primary-container hover:text-primary-container hover:bg-crimson-muted transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[20px]">add_circle</span>
                        إضافة ملف أو فيديو لهذا القسم
                    </button>
                    
                    <!-- نموذج الرفع التفاعلي الجديد المدمج بكل قسم -->
                    <div id="add-content-form-${section.id}" class="hidden bg-surface p-5 rounded-xl border border-border-subtle mt-2 flex flex-col gap-4 animate-scale-in shadow-inner text-right">
                        <h4 class="font-bold text-sm text-primary-container border-b border-border-subtle pb-2">إضافة محتوى جديد للقسم</h4>
                        
                        <div>
                            <label class="block text-xs font-bold text-secondary mb-1">نوع المحتوى</label>
                            <select id="content-type-${section.id}" onchange="toggleContentType(${section.id})" class="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm outline-none focus:border-primary-container transition-all cursor-pointer">
                                <option value="file">رفع ملف محلي (PDF, Office, Images)</option>
                                <option value="link">إضافة رابط خارجي (YouTube / Google Drive)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-secondary mb-1">عنوان المحاضرة / المحتوى</label>
                            <input type="text" id="content-title-${section.id}" placeholder="مثال: المحاضرة الأولى - مقدمة عامة" class="w-full px-4 py-2.5 rounded-lg border border-border-subtle text-sm outline-none focus:border-primary-container transition-all" required>
                        </div>

                        <!-- حقل الملف المحلي -->
                        <div id="file-input-wrapper-${section.id}" class="block">
                            <label class="block text-xs font-bold text-secondary mb-1">اختر الملف (Max 50MB)</label>
                            <input type="file" id="content-file-${section.id}" class="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-crimson-muted file:text-primary-container hover:file:bg-primary-container hover:file:text-white file:transition-all cursor-pointer">
                        </div>

                        <!-- حقل الرابط الخارجي -->
                        <div id="link-input-wrapper-${section.id}" class="hidden">
                            <label class="block text-xs font-bold text-secondary mb-1">الرابط الخارجي URL</label>
                            <input type="url" dir="ltr" id="content-link-${section.id}" placeholder="https://youtube.com/watch?v=..." class="w-full px-4 py-2.5 text-left rounded-lg border border-border-subtle text-sm outline-none focus:border-primary-container transition-all">
                        </div>

                        <div class="flex justify-end gap-2 mt-2">
                            <button type="button" onclick="hideAddContentForm(${section.id})" class="px-4 py-2 rounded-lg font-bold text-xs text-secondary border border-border-subtle hover:bg-gray-100 bg-white">إلغاء</button>
                            <button type="button" onclick="submitAddContent(${section.id})" class="px-5 py-2 rounded-lg font-bold text-xs text-white bg-primary-container hover:bg-primary shadow-sm flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px]">cloud_upload</span>
                                حفظ وإضافة
                            </button>
                        </div>
                    </div>
                </div>
            `;
            courseSectionsList.appendChild(sectionDiv);
        }

    } catch (error) {
        console.error('❌ خطأ أثناء تمييه الواجهة بالأقسام:', error);
        const courseSectionsList = document.getElementById('course-sections-list');
        if (courseSectionsList) {
            courseSectionsList.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center bg-white border border-red-200 text-red-600 rounded-2xl">
                    <span class="material-symbols-outlined text-4xl mb-2">error</span>
                    <p class="font-bold">فشل جلب وتحديث أقسام الكورس</p>
                    <p class="text-xs text-secondary mt-1">${error.message}</p>
                </div>
            `;
        }
    }
}

// ==============================================================================
// مفهوم أكاديمي متقدم: البرمجة الدفاعية والتصميم الموجه للمستخدم (Defensive Programming & User-Centric Design)
// 
// في هذا القسم، نقوم ببناء دالة الحذف الآمن للأقسام (deleteSection). 
// في هندسة البرمجيات، تصنف عمليات الحذف كعمليات مدمرة للبيانات (Data-Destructive Operations).
// 
// لتطبيق مبدأ "البرمجة الدفاعية"، نمنع وقوع الكوارث الناتجة عن النقرات غير المقصودة 
// (Accidental Clicks) من خلال تقديم خطوة تأكيد إلزامية عبر حوار مخصص للتأكيد (Confirm Modal). 
// لا نرسل طلب المسح إلا بعد تأكيد المشرف صراحة رغبته بالحذف، مما يحقق سلامة البيانات 
// ويوفر بيئة استخدام آمنة ومريحة للمشغل.
// 
// لتجاوز حدود نطاق السكربت المغلق (Module Scope) والتأكد من إمكانية استدعاء الدالة من 
// الحدث onclick الديناميكي بالكامل، نقوم بتعليق الدالة صراحة على الكائن العام `window`.
// ==============================================================================
async function deleteSection(sectionId) {
    const courseSelect = document.getElementById('course-select');
    const courseId = courseSelect ? courseSelect.value : null;

    if (!courseId) {
        showToast('❌ خطأ: لم يتم تحديد الكورس الأب بشكل صحيح.', 'error');
        return;
    }

    // 1. خطوة التأكيد الدفاعية المخصصة لمنع خسارة البيانات العرضية
    showCustomConfirm(
        '⚠️ تأكيد حذف القسم التعليمي',
        'هل أنت متأكد تماماً من رغبتك في حذف هذا القسم بجميع محتوياته نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
        async () => {
            try {
                // إرسال طلب DELETE الآمن إلى الخادم
                const backendUrl = `http://${window.location.hostname}:3000/api/courses/sections/${sectionId}`;
                const response = await fetch(backendUrl, {
                    method: 'DELETE',
                    credentials: 'include' // إرسال توكن الـ JWT في الكوكيز للعبور الآمن من جدار الحماية
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل حذف القسم من قاعدة البيانات');
                }

                console.log(`✅ تم حذف القسم ذي الرقم الفرعي (${sectionId}) بنجاح.`);
                showToast('🎉 تم حذف قسم الكورس بنجاح من قاعدة البيانات!', 'success');

                // إعادة تمييه الواجهة وإعادة جلب الأقسام تلقائياً في الوقت الحقيقي (Dynamic UI Hydration)
                await loadCourseSections(courseId);

            } catch (error) {
                console.error('❌ خطأ أثناء حذف القسم:', error);
                showToast(`❌ حدث خطأ أثناء الحذف: ${error.message}`, 'error');
            }
        }
    );
}

// ==============================================================================
// مفهوم أكاديمي متقدم: التحديث الصامت للواجهة (Client-Side Silent Hydration for Child Records)
// 
// في هذا القسم، نقوم ببناء دالة التعديل الآمن للأقسام (editSection). 
// عندما ينقر المستخدم على زر التعديل، نقوم بإظهار حوار سريع وآمن عبر مودال مخصص (Custom Prompt Modal) لتحديث العنوان.
// بمجرد إدخال العنوان الجديد والتحقق من صحته محلياً، نرسل طلب PUT المشفر والآمن إلى الخادم.
// 
// بدلاً من إعادة تحميل الصفحة بأكملها، نقوم بإعادة استدعاء دالة `loadCourseSections(courseId)`
// لتحديث قائمة الأقسام فقط بشكل صامت (Silent Update) دون إزعاج المستخدم أو التأثير على حالته الحالية.
// ==============================================================================
async function editSection(sectionId, currentTitle) {
    const courseSelect = document.getElementById('course-select');
    const courseId = courseSelect ? courseSelect.value : null;

    if (!courseId) {
        showToast('❌ خطأ: لم يتم تحديد الكورس الأب بشكل صحيح.', 'error');
        return;
    }

    // 1. استخدام المودال المنبثق لتعديل الاسم بشكل راقٍ
    showCustomPrompt(
        'تعديل اسم القسم التعليمي',
        'الاسم الجديد للقسم:',
        currentTitle,
        async (newTitle) => {
            const titleClean = newTitle.trim();

            // منع حفظ قيم فارغة أو مسافات فقط لضمان تكامل البيانات
            if (!titleClean) {
                showToast('⚠️ خطأ: لا يمكن أن يكون اسم القسم فارغاً!', 'error');
                return;
            }

            // إذا لم يطرأ أي تغيير على الاسم، نتجنب استهلاك موارد الشبكة بلا داعٍ
            if (titleClean === currentTitle) return;

            try {
                // إرسال طلب PUT الآمن للتحديث في قاعدة البيانات الخلفية
                const backendUrl = `http://${window.location.hostname}:3000/api/courses/sections/${sectionId}`;
                const response = await fetch(backendUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // تمرير التوكن الأمني JWT عبر المتصفح
                    body: JSON.stringify({ title: titleClean })
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل تعديل عنوان القسم في السيرفر');
                }

                console.log(`✅ تم تعديل القسم ذي المعرف (${sectionId}) بنجاح.`);
                showToast('🎉 تم تحديث اسم القسم بنجاح!', 'success');

                // إعادة تمييه الواجهة وإعادة جلب الأقسام تلقائياً في الوقت الحقيقي (Dynamic UI Hydration)
                await loadCourseSections(courseId);

            } catch (error) {
                console.error('❌ خطأ أثناء تعديل القسم:', error);
                showToast(`❌ حدث خطأ أثناء التعديل: ${error.message}`, 'error');
            }
        }
    );
}

// تصدير الدوال كمتغيرات عالمية لتتمكن أزرار الـ HTML الديناميكية من الوصول إليها بسلاسة
window.deleteSection = deleteSection;
window.editSection = editSection;

// ==============================================================================
// منطق إدارة ورفع المواد التعليمية ديناميكياً (Dynamic SPA Materials & Uploads Handler)
// ==============================================================================

/**
 * تبديل نوع المدخل (ملف محلي / رابط خارجي) ديناميكياً لكل قسم
 */
function toggleContentType(sectionId) {
    const typeSelect = document.getElementById(`content-type-${sectionId}`);
    const fileWrapper = document.getElementById(`file-input-wrapper-${sectionId}`);
    const linkWrapper = document.getElementById(`link-input-wrapper-${sectionId}`);

    if (typeSelect && fileWrapper && linkWrapper) {
        if (typeSelect.value === 'file') {
            fileWrapper.classList.remove('hidden');
            fileWrapper.classList.add('block');
            linkWrapper.classList.add('hidden');
            linkWrapper.classList.remove('block');
        } else {
            fileWrapper.classList.add('hidden');
            fileWrapper.classList.remove('block');
            linkWrapper.classList.remove('hidden');
            linkWrapper.classList.add('block');
        }
    }
}
window.toggleContentType = toggleContentType;

/**
 * إظهار نموذج الرفع الملحق بالقسم
 */
function showAddContentForm(sectionId) {
    const form = document.getElementById(`add-content-form-${sectionId}`);
    const toggleBtn = document.getElementById(`toggle-add-content-${sectionId}`);
    if (form && toggleBtn) {
        form.classList.remove('hidden');
        toggleBtn.classList.add('hidden');
    }
}
window.showAddContentForm = showAddContentForm;

/**
 * إخفاء وتنظيف نموذج الرفع الملحق بالقسم
 */
function hideAddContentForm(sectionId) {
    const form = document.getElementById(`add-content-form-${sectionId}`);
    const toggleBtn = document.getElementById(`toggle-add-content-${sectionId}`);
    if (form && toggleBtn) {
        form.classList.add('hidden');
        toggleBtn.classList.remove('hidden');

        // إعادة تهيئة الحقول
        const titleInput = document.getElementById(`content-title-${sectionId}`);
        const fileInput = document.getElementById(`content-file-${sectionId}`);
        const linkInput = document.getElementById(`content-link-${sectionId}`);
        const typeSelect = document.getElementById(`content-type-${sectionId}`);

        if (titleInput) titleInput.value = '';
        if (fileInput) fileInput.value = '';
        if (linkInput) linkInput.value = '';
        if (typeSelect) {
            typeSelect.value = 'file';
            toggleContentType(sectionId);
        }
    }
}
window.hideAddContentForm = hideAddContentForm;

/**
 * إرسال ورفع المادة التعليمية الجديدة إلى السيرفر
 */
async function submitAddContent(sectionId) {
    const titleInput = document.getElementById(`content-title-${sectionId}`);
    const typeSelect = document.getElementById(`content-type-${sectionId}`);
    const fileInput = document.getElementById(`content-file-${sectionId}`);
    const linkInput = document.getElementById(`content-link-${sectionId}`);

    if (!titleInput || !typeSelect) return;

    const title = titleInput.value.trim();
    const type = typeSelect.value;

    if (!title) {
        showToast('⚠️ يرجى كتابة عنوان للمادة التعليمية!', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);

    if (type === 'file') {
        if (!fileInput || fileInput.files.length === 0) {
            showToast('⚠️ يرجى اختيار ملف لرفعه أولاً!', 'warning');
            return;
        }
        formData.append('file', fileInput.files[0]);
    } else {
        if (!linkInput || !linkInput.value.trim()) {
            showToast('⚠️ يرجى إدخال الرابط الخارجي أولاً!', 'warning');
            return;
        }
        formData.append('url', linkInput.value.trim());
    }

    try {
        // إشعار المشرف ببدء الرفع
        showToast('⏳ جاري رفع المادة التعليمية إلى الخادم...', 'info');

        const courseSelect = document.getElementById('course-select');
        const courseId = courseSelect ? courseSelect.value : null;

        const backendUrl = `http://${window.location.hostname}:3000/api/materials/upload/${sectionId}`;
        const response = await fetch(backendUrl, {
            method: 'POST',
            credentials: 'include', // مصادقة JWT
            body: formData
        });

        if (response.status === 401 || response.status === 403) {
            showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
            setTimeout(() => window.location.replace('login.html'), 1500);
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'فشل رفع المادة التعليمية');
        }

        showToast('🎉 تم رفع وإضافة المادة التعليمية بنجاح!', 'success');
        hideAddContentForm(sectionId);

        // إعادة تمييه الأقسام لتحديث المحتويات حية في الواجهة
        if (courseId) {
            await loadCourseSections(courseId);
        }

    } catch (error) {
        console.error('❌ خطأ أثناء إضافة المادة:', error);
        showToast(`❌ حدث خطأ أثناء الرفع: ${error.message}`, 'error');
    }
}
window.submitAddContent = submitAddContent;

/**
 * حذف المادة التعليمية وملفها من السيرفر بشكل نهائي
 */
async function deleteMaterial(materialId) {
    showCustomConfirm(
        '⚠️ تأكيد حذف المادة التعليمية',
        'هل أنت متأكد تماماً من رغبتك في حذف هذه المادة التعليمية نهائياً من قاعدة البيانات والسيرفر؟ لا يمكن التراجع عن هذا الإجراء.',
        async () => {
            try {
                const courseSelect = document.getElementById('course-select');
                const courseId = courseSelect ? courseSelect.value : null;

                const backendUrl = `http://${window.location.hostname}:3000/api/materials/${materialId}`;
                const response = await fetch(backendUrl, {
                    method: 'DELETE',
                    credentials: 'include' // إرسال مصادقة JWT
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل حذف المادة من قاعدة البيانات');
                }

                showToast('🎉 تم حذف المادة التعليمية بنجاح من النظام!', 'success');

                // إعادة تمييه الأقسام حياً في الـ SPA
                if (courseId) {
                    await loadCourseSections(courseId);
                }

            } catch (error) {
                console.error('❌ خطأ أثناء حذف المادة:', error);
                showToast(`❌ حدث خطأ أثناء الحذف: ${error.message}`, 'error');
            }
        }
    );
}
window.deleteMaterial = deleteMaterial;

// ==============================================================================
// 1. تصفح وتمييه قائمة الطلاب ديناميكياً (SPA Student List Hydration & Caching)
// ==============================================================================
let cachedStudents = []; // الذاكرة المؤقتة للطلاب في الواجهة
let currentStudentPage = 1;
const studentsPerPage = 5;

async function loadStudentsList(searchQuery = '') {
    try {
        const tableBody = document.getElementById('student-table-body');
        if (!tableBody) return;

        // استعراض مؤشر التحميل الذكي والأكاديمي
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-secondary">
                    <div class="flex justify-center items-center gap-2">
                        <span class="material-symbols-outlined animate-spin text-primary-container text-3xl">autorenew</span>
                        <span class="font-bold text-sm">جاري جلب ومزامنة الطلاب مع قاعدة البيانات...</span>
                    </div>
                </td>
            </tr>
        `;

        const backendUrl = `http://${window.location.hostname}:3000/api/students?search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(backendUrl, { credentials: 'include' });

        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ جلسة المشرف منتهية أو غير موثقة.');
            showToast('⚠️ جلستك منتهية، يرجى تسجيل الدخول مجدداً.', 'warning');
            setTimeout(() => window.location.replace('login.html'), 1500);
            return;
        }

        if (!response.ok) throw new Error('فشل استيراد سجلات الطلاب من الخادم');

        const students = await response.json();
        cachedStudents = students;

        renderStudentTable();

    } catch (error) {
        console.error('❌ خطأ أثناء تحميل الطلاب:', error);
        const tableBody = document.getElementById('student-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-red-650 font-bold text-sm">
                        ❌ فشل تحميل البيانات: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}
window.loadStudentsList = loadStudentsList;

// ==============================================================================
// 2. معالجة وتصيير جدول الطلاب وترقيمه ديناميكياً (Student Table & Pagination Renderer)
// ==============================================================================
function renderStudentTable() {
    const tableBody = document.getElementById('student-table-body');
    const statsEl = document.getElementById('student-pagination-stats');
    const prevBtn = document.getElementById('student-prev-btn');
    const nextBtn = document.getElementById('student-next-btn');
    const pageNumEl = document.getElementById('student-page-num');

    if (!tableBody) return;

    if (cachedStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-12 text-center text-secondary">
                    <span class="material-symbols-outlined text-4xl mb-2">person_off</span>
                    <p class="font-bold text-sm">لا يوجد أي طلاب مسجلين حالياً يطابقون تصفية البحث.</p>
                </td>
            </tr>
        `;
        if (statsEl) statsEl.textContent = "عرض 0 إلى 0 من 0 طالب";
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    const totalStudents = cachedStudents.length;
    const totalPages = Math.ceil(totalStudents / studentsPerPage);

    if (currentStudentPage > totalPages) currentStudentPage = totalPages;
    if (currentStudentPage < 1) currentStudentPage = 1;

    const startIndex = (currentStudentPage - 1) * studentsPerPage;
    const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
    const paginatedStudents = cachedStudents.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    paginatedStudents.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-border-subtle hover:bg-gray-50 transition-colors";

        let rateBadgeClass = "bg-primary-container text-white";
        let rateLabel = "ممتاز";
        const rate = student.attendance_rate;

        if (rate >= 85) {
            rateBadgeClass = "bg-green-600 text-white";
            rateLabel = "ممتاز";
        } else if (rate >= 75) {
            rateBadgeClass = "bg-blue-500 text-white";
            rateLabel = "جيد جداً";
        } else if (rate >= 50) {
            rateBadgeClass = "bg-yellow-600 text-white";
            rateLabel = "مقبول";
        } else {
            rateBadgeClass = "bg-red-600 text-white"; // ترقية اللون للنسق القياسي المتناسق
            rateLabel = "ضعيف";
        }

        const role = student.role || 'student';
        let roleText = 'طالب عادي';
        let roleBullet = 'bg-slate-450';

        if (role === 'Super_Admin') {
            roleText = 'مشرف عام أساسي';
            roleBullet = 'bg-purple-600';
        } else if (role === 'Students_Admin') {
            roleText = 'مشرف شؤون الطلاب';
            roleBullet = 'bg-blue-500';
        } else if (role === 'Curriculum_Admin') {
            roleText = 'مشرف شؤون المناهج';
            roleBullet = 'bg-amber-500';
        } else {
            roleText = 'طالب عادي';
            roleBullet = 'bg-slate-400';
        }

        tr.innerHTML = `
            <td class="py-4 px-6 text-right">
                <div class="font-bold text-on-surface">${student.Name}</div>
                <div class="text-[11px] font-normal text-secondary mt-1 flex items-center gap-1.5">
                    <span class="inline-block w-1.5 h-1.5 rounded-full ${roleBullet}"></span>
                    <span>${roleText}</span>
                </div>
            </td>
            <td class="py-4 px-6 font-code-snippet text-secondary text-right">${student.student_id}</td>
            <td class="py-4 px-6 text-secondary text-right">${student.birth_year || '---'}</td>
            <td class="py-4 px-6 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${rateBadgeClass}">
                    ${rateLabel} (${rate}%)
                </span>
            </td>
            <td class="py-4 px-6 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="resetStudentPassword(${student.id}, '${student.Name}')" class="w-8 h-8 rounded border border-border-subtle text-secondary hover:bg-gray-100 hover:text-primary-container transition-colors animate-scale-in" title="مفتاح السري (تغيير كلمة المرور)">
                        <span class="material-symbols-outlined text-[18px]">key</span>
                    </button>
                    <button onclick="editStudentDetails(${student.id})" class="w-8 h-8 rounded border border-border-subtle text-secondary hover:bg-gray-100 hover:text-primary-container transition-colors animate-scale-in" title="تعديل البيانات">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onclick="deleteStudent(${student.id}, '${student.Name}')" class="w-8 h-8 rounded bg-red-600 text-white hover:bg-red-700 transition-colors animate-scale-in" title="حذف ملف الطالب">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if (statsEl) statsEl.textContent = `عرض ${startIndex + 1} إلى ${endIndex} من ${totalStudents} طالب`;
    if (pageNumEl) pageNumEl.textContent = currentStudentPage;

    // تهيئة مظهر أزرار الترقيم
    if (prevBtn) {
        prevBtn.disabled = currentStudentPage === 1;
        if (currentStudentPage === 1) prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
        else prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (nextBtn) {
        nextBtn.disabled = currentStudentPage === totalPages;
        if (currentStudentPage === totalPages) nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        else nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.renderStudentTable = renderStudentTable;

// ==============================================================================
// 3. حذف ملف طالب من قاعدة البيانات (SPA Cascade Delete Action)
// ==============================================================================
async function deleteStudent(studentId, studentName) {
    showCustomConfirm(
        '⚠️ تأكيد حذف سجل الطالب',
        `هل أنت متأكد تماماً من رغبتك في حذف الطالب "${studentName}" نهائياً من قاعدة البيانات؟ سيؤدي ذلك لمسح كافة بياناته وحضوره وسجلاته المتتالية من النظام بشكل كامل.`,
        async () => {
            try {
                const response = await fetch(`http://${window.location.hostname}:3000/api/students/${studentId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ جلستك الأمنية منتهية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل حذف الطالب من قاعدة البيانات');
                }

                showToast(`🎉 تم حذف الطالب "${studentName}" وإسقاط سجلاته بنجاح من النظام!`, 'success');
                await loadStudentsList(); // تحديث الجدول صامتاً

            } catch (error) {
                console.error('Error deleting student:', error);
                showToast(`❌ فشل حذف السجل: ${error.message}`, 'error');
            }
        }
    );
}
window.deleteStudent = deleteStudent;

// ==============================================================================
// 4. إعادة تعيين كلمة المرور الافتراضية للطالب (Reset Password Custom Wizard)
// ==============================================================================
async function resetStudentPassword(studentId, studentName) {
    const student = (cachedStudents || []).find(s => s.id == studentId);
    if (!student) return;

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let suggested = "";
    for (let i = 0; i < 8; i++) suggested += chars[Math.floor(Math.random() * chars.length)];

    showCustomPrompt(
        'إعادة تعيين كلمة المرور',
        `أدخل كلمة المرور الجديدة للطالب "${studentName}":`,
        suggested,
        async (newPassword) => {
            if (!newPassword || newPassword.trim() === '') {
                showToast('⚠️ تم إلغاء العملية! كلمة المرور لا يمكن أن تكون فارغة.', 'warning');
                return;
            }

            try {
                const response = await fetch(`http://${window.location.hostname}:3000/api/students/${studentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        student_id: student.student_id,
                        Name: student.Name,
                        birth_year: student.birth_year,
                        password: newPassword.trim()
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل تغيير كلمة المرور');
                }

                showToast(`🎉 تم تغيير كلمة مرور الطالب "${studentName}" بنجاح!`, 'success');

            } catch (error) {
                console.error('Error resetting password:', error);
                showToast(`❌ فشل التغيير: ${error.message}`, 'error');
            }
        }
    );
}
window.resetStudentPassword = resetStudentPassword;

// ==============================================================================
// 5. تعديل سجل الطالب بالمعالج المتسلسل الفريد (SPA Student Edit Wizard)
// ==============================================================================
async function editStudentDetails(studentId) {
    const student = (cachedStudents || []).find(s => s.id == studentId);
    if (!student) return;

    showCustomPrompt('تعديل الاسم الكامل', 'أدخل الاسم الجديد للمستخدم:', student.Name, async (newName) => {
        if (!newName || newName.trim() === '') return;

        showCustomPrompt('تعديل المعرف / رقم القيد', 'أدخل المعرف (ID) الجديد للمستخدم:', student.student_id, async (newId) => {
            if (!newId || newId.trim() === '') return;

            showCustomPrompt('تعديل سنة الميلاد', 'أدخل سنة الميلاد الجديدة:', student.birth_year ? student.birth_year.toString() : '2005', async (newBirthYear) => {
                if (!newBirthYear || newBirthYear.trim() === '') return;

                // دالة المزامنة والإرسال للخادم الفرعي
                const submitUpdates = async (targetRole = null) => {
                    try {
                        const bodyData = {
                            student_id: newId.trim(),
                            Name: newName.trim(),
                            birth_year: parseInt(newBirthYear)
                        };
                        if (targetRole) bodyData.role = targetRole;

                        const response = await fetch(`http://${window.location.hostname}:3000/api/students/${studentId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(bodyData)
                        });

                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.error || 'فشل تحديث بيانات الحساب');
                        }

                        showToast('🎉 تم تحديث بيانات المستخدم وتعديل السجلات بنجاح!', 'success');
                        await loadStudentsList(); // إعادة تمييه الواجهة

                    } catch (error) {
                        console.error('Error editing user details:', error);
                        showToast(`❌ فشل تعديل بيانات الحساب: ${error.message}`, 'error');
                    }
                };

                // إذا كان المستخدم الحالي هو المشرف الأساسي (Super_Admin) أو المشرف العام التوافقي (admin)، نعرض له مودال الاختيار المنسدل الجديد لتعديل الصلاحيات بأمان.
                if (window.currentUserRole === 'Super_Admin' || window.currentUserRole === 'admin') {
                    const roleOptions = [
                        { value: 'student', text: 'طالب عادي' },
                        { value: 'Students_Admin', text: 'مشرف شؤون الطلاب (الحضور و QR)' },
                        { value: 'Curriculum_Admin', text: 'مشرف شؤون المناهج (الكورسات والملفات)' },
                        { value: 'Super_Admin', text: 'مشرف عام أساسي (كامل الصلاحيات)' }
                    ];
                    showCustomDropdownPrompt(
                        'تعديل رتبة الحساب',
                        'اختر الرتبة الجديدة للمشرف/الطالب من القائمة:',
                        roleOptions,
                        student.role || 'student',
                        async (newRole) => {
                            if (!newRole) return;
                            await submitUpdates(newRole);
                        }
                    );
                } else {
                    await submitUpdates();
                }
            });
        });
    });
}
window.editStudentDetails = editStudentDetails;

// ==============================================================================
// 6. إدارة الأخبار والإعلانات ديناميكياً (Dynamic News CMS Handlers)
// ==============================================================================
async function loadNewsList() {
    try {
        const tableBody = document.getElementById('news-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="py-6 text-center text-secondary">
                    <div class="flex justify-center items-center gap-2">
                        <span class="material-symbols-outlined animate-spin text-primary-container text-2xl">autorenew</span>
                        <span class="font-bold text-xs">جاري جلب ومزامنة الأخبار...</span>
                    </div>
                </td>
            </tr>
        `;

        const response = await fetch(`http://${window.location.hostname}:3000/api/news`);
        if (!response.ok) throw new Error('فشل جلب قائمة الأخبار');

        const news = await response.json();

        if (news.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="py-8 text-center text-secondary font-medium text-sm">
                        <span class="material-symbols-outlined text-3xl mb-1 block text-slate-300">feed</span>
                        لا توجد أخبار منشورة حالياً في المنصة.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';
        news.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-border-subtle hover:bg-gray-50 transition-colors";

            const fullImgUrl = `http://${window.location.hostname}:3000${item.image_path}`;

            tr.innerHTML = `
                <td class="py-3 px-4 text-right">
                    <div class="w-12 h-12 rounded-lg border border-border-subtle bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
                        <img src="${fullImgUrl}" alt="غلاف الخبر" class="w-full h-full object-cover">
                    </div>
                </td>
                <td class="py-3 px-4 font-bold text-on-surface text-[14px] text-right max-w-[220px] truncate" title="${item.title}">${item.title}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="deleteNews(${item.news_id}, '${item.title.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded bg-red-600 text-white hover:bg-red-750 transition-colors inline-flex items-center justify-center shadow-sm" title="حذف الخبر">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading news:', error);
        const tableBody = document.getElementById('news-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="py-6 text-center text-red-650 font-bold text-xs">
                        ❌ فشل تحميل الأخبار: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

async function deleteNews(newsId, newsTitle) {
    showCustomConfirm(
        '⚠️ تأكيد حذف الخبر المنشور',
        `هل أنت متأكد تماماً من رغبتك في حذف خبر "${newsTitle}" نهائياً من قاعدة البيانات والسيرفر؟ لا يمكن التراجع عن هذا الإجراء.`,
        async () => {
            try {
                const response = await fetch(`http://${window.location.hostname}:3000/api/news/${newsId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل حذف الخبر من قاعدة البيانات');
                }

                showToast('🎉 تم حذف وإزالة الخبر وصورته بنجاح من النظام!', 'success');
                await loadNewsList(); // تحديث الجدول

            } catch (error) {
                console.error('Error deleting news:', error);
                showToast(`❌ حدث خطأ أثناء حذف الخبر: ${error.message}`, 'error');
            }
        }
    );
}

window.loadNewsList = loadNewsList;
window.deleteNews = deleteNews;

document.addEventListener('DOMContentLoaded', () => {

    /* ========================================================
       1: Tab Switching — Users vs. Course Files vs. News CMS
       ======================================================== */
    const tabUsersButton = document.getElementById('tab-users-btn');
    const tabFilesButton = document.getElementById('tab-files-btn');
    const tabNewsButton = document.getElementById('tab-news-btn');

    const sectionUsers = document.getElementById('section-users');
    const sectionFiles = document.getElementById('section-files');
    const sectionNews = document.getElementById('section-news');

    function updateTabStyles(activeBtn) {
        const tabs = [
            { btn: tabUsersButton, section: sectionUsers },
            { btn: tabFilesButton, section: sectionFiles },
            { btn: tabNewsButton, section: sectionNews }
        ];

        tabs.forEach(tab => {
            if (!tab.btn) return;
            if (tab.btn.disabled) {
                tab.btn.className = DISABLED_TAB_CLASSES;
                if (tab.section) {
                    tab.section.classList.add('hidden');
                    tab.section.classList.remove('flex');
                }
            } else if (tab.btn === activeBtn) {
                tab.btn.className = ACTIVE_TAB_CLASSES;
                if (tab.section) {
                    tab.section.classList.remove('hidden');
                    tab.section.classList.add('flex');
                }
            } else {
                tab.btn.className = INACTIVE_TAB_CLASSES;
                if (tab.section) {
                    tab.section.classList.add('hidden');
                    tab.section.classList.remove('flex');
                }
            }
        });
    }

    if (tabUsersButton) {
        tabUsersButton.addEventListener('click', () => {
            updateTabStyles(tabUsersButton);
            loadStudentsList();
        });
    }

    if (tabFilesButton) {
        tabFilesButton.addEventListener('click', () => {
            updateTabStyles(tabFilesButton);
        });
    }

    if (tabNewsButton) {
        tabNewsButton.addEventListener('click', () => {
            updateTabStyles(tabNewsButton);
            loadNewsList();
        });
    }

    /* ========================================================
       1.5: News CMS Add Form Submit Listener
       ======================================================== */
    const addNewsForm = document.getElementById('add-news-form');
    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newsTitleInput = document.getElementById('news-title');
            const newsContentInput = document.getElementById('news-content');
            const newsImageFile = document.getElementById('news-image-file');

            if (!newsTitleInput || !newsContentInput || !newsImageFile) return;

            const title = newsTitleInput.value.trim();
            const content = newsContentInput.value.trim();

            if (!title || !content) {
                showToast('⚠️ يرجى تعبئة عنوان الخبر وتفاصيله الكاملة!', 'warning');
                return;
            }

            if (newsImageFile.files.length === 0) {
                showToast('⚠️ يرجى اختيار ملف صورة غلاف مميزة للخبر!', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('image', newsImageFile.files[0]);

            try {
                showToast('⏳ جاري رفع غلاف الخبر ونشره في المنصة...', 'info');

                const response = await fetch(`http://${window.location.hostname}:3000/api/news`, {
                    method: 'POST',
                    credentials: 'include', // مصادقة JWT
                    body: formData
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل نشر الخبر');
                }

                showToast('🎉 تم نشر وإضافة الخبر الجديد حياً بقاعدة البيانات والموقع!', 'success');

                // تصفير وإعادة تعيين الحقول
                addNewsForm.reset();

                // إعادة مزامنة وعرض قائمة الأخبار حياً
                await loadNewsList();

            } catch (err) {
                console.error('Error posting news:', err);
                showToast(`❌ فشل نشر وإضافة الخبر: ${err.message}`, 'error');
            }
        });
    }


    /* ========================================================
       2: Add Student Modal
       ======================================================== */
    const studentModal = document.getElementById('add-student-modal');
    const openStudentButton = document.getElementById('open-add-student-modal');

    function toggleStudentModal() {
        studentModal.classList.toggle('hidden');
        document.body.style.overflow = studentModal.classList.contains('hidden') ? '' : 'hidden';

        // توليد كلمة مرور عشوائية افتراضية بمجرد فتح النافذة ليسهل الإضافة الفورية الفخمة
        if (!studentModal.classList.contains('hidden')) {
            const generateBtn = document.getElementById('generate-pwd-btn');
            if (generateBtn) generateBtn.click();
        }
    }

    if (openStudentButton) openStudentButton.addEventListener('click', toggleStudentModal);
    document.getElementById('close-student-icon').addEventListener('click', toggleStudentModal);
    document.getElementById('cancel-student-btn').addEventListener('click', toggleStudentModal);
    document.getElementById('modal-backdrop-student').addEventListener('click', toggleStudentModal);

    /* Password Generator */
    const PASSWORD_CHARSET =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    const PASSWORD_LENGTH = 8;

    const generatePwdBtn = document.getElementById('generate-pwd-btn');
    if (generatePwdBtn) {
        generatePwdBtn.addEventListener('click', () => {
            let generatedPassword = "";
            for (let i = 0; i < PASSWORD_LENGTH; i++) {
                generatedPassword += PASSWORD_CHARSET[Math.floor(Math.random() * PASSWORD_CHARSET.length)];
            }
            document.getElementById('generated-password').value = generatedPassword;
        });
    }

    // ==============================================================================
    // 3. ربط مستمع نموذج إضافة طالب (Add Student Form Submit Listener)
    // ==============================================================================
    const addStudentForm = document.getElementById('add-student-form');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('student-name');
            const idInput = document.getElementById('student-id-field');
            const birthYearSelect = document.getElementById('student-birth-year');
            const passwordInput = document.getElementById('generated-password');
            const roleSelect = document.getElementById('student-role');

            if (!nameInput || !idInput || !birthYearSelect || !passwordInput) return;

            const Name = nameInput.value.trim();
            const student_id = idInput.value.trim();
            const birth_year = birthYearSelect.value;
            const password = passwordInput.value.trim();
            const role = roleSelect ? roleSelect.value : 'student';

            try {
                const response = await fetch(`http://${window.location.hostname}:3000/api/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ Name, student_id, birth_year, password, role })
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ جلستك منتهية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل إضافة الطالب');
                }

                showToast('🎉 تم تسجيل وإضافة الطالب الجديد بنجاح بقاعدة البيانات!', 'success');

                // إعادة تصفير النموذج وإغلاق النافذة
                addStudentForm.reset();
                toggleStudentModal();

                // مزامنة قائمة الطلاب حياً
                await loadStudentsList();

            } catch (err) {
                console.error('Error adding student:', err);
                showToast(`❌ فشل إضافة الطالب: ${err.message}`, 'error');
            }
        });
    }

    // ==============================================================================
    // 4. ربط تصفية البحث للطلاب (Debounced Search Input Listener)
    // ==============================================================================
    let searchTimeout;
    const searchInput = document.getElementById('student-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentStudentPage = 1; // تصفير الصفحة للبدء من الأولى في التصفية
                loadStudentsList(e.target.value.trim());
            }, 300);
        });
    }

    // ==============================================================================
    // 5. ربط أزرار الترقيم للطلاب (Pagination Button Click Listeners)
    // ==============================================================================
    const studentPrevBtn = document.getElementById('student-prev-btn');
    const studentNextBtn = document.getElementById('student-next-btn');

    if (studentPrevBtn) {
        studentPrevBtn.addEventListener('click', () => {
            if (currentStudentPage > 1) {
                currentStudentPage--;
                renderStudentTable();
            }
        });
    }

    if (studentNextBtn) {
        studentNextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(cachedStudents.length / studentsPerPage);
            if (currentStudentPage < totalPages) {
                currentStudentPage++;
                renderStudentTable();
            }
        });
    }


    /* ========================================================
       3: QR Attendance Modal + Real-Time Active Sessions & Live Polling
       ======================================================== */
    const qrModal = document.getElementById('qr-attendance-modal');
    const openQrModalButton = document.getElementById('open-qr-modal-btn');
    const closeQrIconButton = document.getElementById('close-qr-icon');
    const cancelQrButton = document.getElementById('cancel-qr-btn');
    const qrBackdrop = document.getElementById('qr-backdrop');

    const generateQrActionButton = document.getElementById('generate-qr-action-btn');
    const qrPreviewZone = document.getElementById('qr-preview-zone');
    const qrImagePlaceholder = document.getElementById('qr-image-placeholder');
    const qrLoadingSpinner = document.getElementById('qr-loading-spinner');
    const liveAttendanceCount = document.getElementById('live-attendance-count');

    let pollingInterval;
    let activeSessionId = null; // المعرف النشط للجلسة الحالية

    async function toggleQrModal() {
        qrModal.classList.toggle('hidden');

        if (qrModal.classList.contains('hidden')) {
            // تنظيف الحقول والعدادات والذاكرة المؤقتة عند إغلاق المودال
            qrPreviewZone.classList.add('hidden');
            qrImagePlaceholder.classList.add('hidden');
            qrLoadingSpinner.classList.remove('hidden');
            clearInterval(pollingInterval);
            liveAttendanceCount.innerText = "0";
            generateQrActionButton.classList.remove('hidden');

            const titleInput = document.getElementById('qr-session-title');
            const detailsInput = document.getElementById('qr-session-details');
            if (titleInput) titleInput.value = '';
            if (detailsInput) detailsInput.value = '';

            // خطوة أمان هامة: إرسال إشعار للخادم لإيقاف وتعطيل الجلسة النشطة لمنع استغلال الـ QR
            if (activeSessionId) {
                try {
                    const stopUrl = `http://${window.location.hostname}:3000/api/attendance/stop/${activeSessionId}`;
                    await fetch(stopUrl, { method: 'POST', credentials: 'include' });
                } catch (e) {
                    console.error('Error stopping active session:', e);
                }
                activeSessionId = null;
            }

            // تحديث قائمة الطلاب صامتاً، لأن نسب حضورهم قد تكون تغيرت لحظياً بعد الجلسة!
            loadStudentsList();
        }
        document.body.style.overflow = qrModal.classList.contains('hidden') ? '' : 'hidden';
    }

    if (openQrModalButton) openQrModalButton.addEventListener('click', toggleQrModal);
    if (closeQrIconButton) closeQrIconButton.addEventListener('click', toggleQrModal);
    if (cancelQrButton) cancelQrButton.addEventListener('click', toggleQrModal);
    if (qrBackdrop) qrBackdrop.addEventListener('click', toggleQrModal);

    if (generateQrActionButton) {
        generateQrActionButton.addEventListener('click', async () => {
            const titleInput = document.getElementById('qr-session-title');
            const detailsInput = document.getElementById('qr-session-details');

            if (!titleInput || !detailsInput) return;

            const title = titleInput.value.trim();
            const description = detailsInput.value.trim();

            if (!title) {
                showToast('⚠️ يرجى كتابة اسم الكورس / الجلسة أولاً!', 'warning');
                return;
            }

            qrPreviewZone.classList.remove('hidden');
            qrPreviewZone.classList.add('flex');
            generateQrActionButton.classList.add('hidden');

            try {
                // 1. إرسال طلب بدء الجلسة للخادم الخلفي
                const startUrl = `http://${window.location.hostname}:3000/api/attendance/start`;
                const response = await fetch(startUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title, description })
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'فشل فتح جلسة الحضور');
                }

                const data = await response.json();
                activeSessionId = data.sessionId;

                // 2. توليد رابط مسح الحضور الفعلي وتمريره لمولد الـ QR Code
                const scanUrl = `http://${window.location.hostname}:3000/api/attendance/scan?token=${data.sessionToken}`;

                qrImagePlaceholder.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;

                qrImagePlaceholder.onload = () => {
                    qrLoadingSpinner.classList.add('hidden');
                    qrImagePlaceholder.classList.remove('hidden');
                };

                showToast('🎉 تم فتح الجلسة وبث كود الـ QR بنجاح!', 'success');

                // 3. تفعيل العداد اللحظي التفاعلي للطلاب
                startLivePolling(data.sessionId);

            } catch (err) {
                console.error('Error starting QR session:', err);
                showToast(`❌ تعذر تشغيل جلسة الحضور: ${err.message}`, 'error');
                toggleQrModal(); // إغلاق المودال في حال الفشل
            }
        });
    }

    function startLivePolling(sessionId) {
        let lastCount = 0;
        clearInterval(pollingInterval);

        pollingInterval = setInterval(async () => {
            if (!sessionId) return;

            try {
                const countUrl = `http://${window.location.hostname}:3000/api/attendance/live-count/${sessionId}`;
                const response = await fetch(countUrl, { credentials: 'include' });

                if (!response.ok) return;

                const data = await response.json();
                const currentCount = data.count;

                liveAttendanceCount.innerText = currentCount;

                // إطلاق تأثير نبض وتكبير بصري فخم ومبهر عند دخول طالب جديد (Live Pulse Animation)
                if (currentCount > lastCount) {
                    liveAttendanceCount.classList.add('scale-125', 'text-tertiary-container');
                    setTimeout(() => {
                        liveAttendanceCount.classList.remove('scale-125', 'text-tertiary-container');
                    }, 300);
                    lastCount = currentCount;
                }

            } catch (e) {
                console.error('Error polling live count:', e);
            }
        }, 3000); // تحديث التتبع كل 3 ثوانٍ
    }


    /* ==============================================================================
       مفهوم أكاديمي متقدم: إدارة الحالة والتفاعلية ثنائية الأبعاد في تطبيقات الـ SPA
       (State Management & UI Reactivity using a Finite State Machine - FSM)

       في هذا القسم، نقوم بإدارة حالات ظهور عناصر لوحة التحكم الخاصة بمنشئ الكورسات.
       في هندسة برمجيات الويب الحديثة، لا يتم التحكم بالواجهة ككتلة صماء، بل يتم نمذجتها 
       على شكل "آلة حالة محدودة" (Finite State Machine - FSM) تتنقل بين ثلاث حالات (States) 
       رئيسية بناءً على خيار قائمة الاختيار (Select element) وبدون الحاجة لإعادة تحميل الصفحة:

       1. الحالة الافتراضية (Empty / Idle State - value=""):
          * المدخلات: المشرف لم يحدد كورس ولم يختر إنشاء جديد.
          * الحالة البرمجية: إخفاء نموذج الإضافة وإخفاء حاوية التفاصيل لتنظيف الشاشة (Focused UI Workspace).
          
       2. حالة إضافة كورس جديد (Creation State - value="new"):
          * المدخلات: اختيار "+ إضافة كورس جديد".
          * الحالة البرمجية: إظهار نموذج الإضافة (`add-course-form` -> flex) وإخفاء حاوية تفاصيل الكورس.
          
       3. حالة عرض كورس موجود (Display State - value="Course_ID"):
          * المدخلات: تحديد كورس مسجل فعلياً قادم من قاعدة البيانات.
          * الحالة البرمجية: إخفاء نموذج الإضافة وإظهار حاوية تفاصيل وأقسام الكورس (`course-details-container` -> remove hidden).
          
       يضمن هذا النهج المعماري تفاعل الواجهة اللحظي (UI Reactivity)، حيث تترابط عناصر الـ DOM 
       وتتغير هيئتها فوراً استجابة للتغير في الحالة المحلية (Local State) لتجربة مستخدم مثالية.
       ============================================================================== */
    const courseSelect = document.getElementById('course-select');
    const addCourseForm = document.getElementById('add-course-form');
    const courseDetailsContainer = document.getElementById('course-details-container');
    const courseSectionsList = document.getElementById('course-sections-list');
    const courseActionsBar = document.getElementById('course-actions-bar');

    if (courseSelect && addCourseForm && courseDetailsContainer) {
        courseSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;

            if (selectedValue === 'new') {
                // الحالة الثانية: إظهار نموذج الإضافة وإخفاء تفاصيل الكورس وشريط الإجراءات
                addCourseForm.classList.remove('hidden');
                addCourseForm.classList.add('flex');
                courseDetailsContainer.classList.add('hidden');
                if (courseActionsBar) {
                    courseActionsBar.classList.add('hidden');
                    courseActionsBar.classList.remove('flex');
                }
            } else if (selectedValue !== '') {
                // الحالة الثالثة: إخفاء نموذج الإضافة وإظهار تفاصيل الكورس المختار وشريط الإجراءات
                addCourseForm.classList.add('hidden');
                addCourseForm.classList.remove('flex');
                courseDetailsContainer.classList.remove('hidden');
                if (courseActionsBar) {
                    courseActionsBar.classList.remove('hidden');
                    courseActionsBar.classList.add('flex');
                }

                // استدعاء دالة جلب الأقسام وتحديث شجرة الـ DOM بالبيانات الحية القادمة من السيرفر
                loadCourseSections(selectedValue);
            } else {
                // الحالة الأولى (الافتراضية): إخفاء الجميع لإبقاء الواجهة نظيفة
                addCourseForm.classList.add('hidden');
                addCourseForm.classList.remove('flex');
                courseDetailsContainer.classList.add('hidden');
                if (courseActionsBar) {
                    courseActionsBar.classList.add('hidden');
                    courseActionsBar.classList.remove('flex');
                }
            }
        });
    }

    /* ==============================================================================
       منطق تعديل وحذف الكورس (Edit & Delete Course Logic)
       ============================================================================== */
    const editCourseModal = document.getElementById('edit-course-modal');
    const editCourseForm = document.getElementById('edit-course-form');
    const editCourseTitleInput = document.getElementById('edit-course-title');
    const editCourseDescriptionInput = document.getElementById('edit-course-description');

    function toggleEditCourseModal() {
        if (!editCourseModal) return;
        editCourseModal.classList.toggle('hidden');
        document.body.style.overflow = editCourseModal.classList.contains('hidden') ? '' : 'hidden';
    }

    if (editCourseModal) {
        document.getElementById('close-edit-course-icon').addEventListener('click', toggleEditCourseModal);
        document.getElementById('cancel-edit-course-btn').addEventListener('click', toggleEditCourseModal);
        document.getElementById('modal-backdrop-edit-course').addEventListener('click', toggleEditCourseModal);
    }

    const editCourseBtn = document.getElementById('edit-course-btn');
    if (editCourseBtn) {
        editCourseBtn.addEventListener('click', () => {
            const courseId = courseSelect.value;
            if (!courseId) return;

            // البحث عن الكورس في الذاكرة المؤقتة المجلوبة مسبقاً
            const course = (window.cachedCourses || []).find(c => c.course_id == courseId);
            if (!course) {
                showToast('❌ خطأ: تعذر العثور على الكورس المحدد في الذاكرة المؤقتة للواجهة.', 'error');
                return;
            }

            // تعبئة البيانات الافتراضية
            if (editCourseTitleInput) editCourseTitleInput.value = course.course_title;
            if (editCourseDescriptionInput) editCourseDescriptionInput.value = course.description;

            // فتح المودال
            toggleEditCourseModal();
        });
    }

    if (editCourseForm) {
        editCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const courseId = courseSelect.value;
            const course_title = editCourseTitleInput.value.trim();
            const description = editCourseDescriptionInput.value.trim();

            if (!courseId || !course_title || !description) return;

            try {
                const backendUrl = `http://${window.location.hostname}:3000/api/courses/${courseId}`;
                const response = await fetch(backendUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        course_title,
                        description,
                        image_url: ''
                    })
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل تحديث بيانات الكورس');
                }

                showToast('🎉 تم تحديث بيانات الكورس بنجاح!', 'success');
                toggleEditCourseModal();

                // إعادة تحميل القائمة والحفاظ على الكورس المختار
                await loadCourses();
                courseSelect.value = courseId;
                courseSelect.dispatchEvent(new Event('change'));

            } catch (error) {
                console.error('❌ خطأ أثناء تحديث الكورس:', error);
                showToast(`❌ حدث خطأ أثناء التحديث: ${error.message}`, 'error');
            }
        });
    }

    const deleteCourseBtn = document.getElementById('delete-course-btn');
    if (deleteCourseBtn) {
        deleteCourseBtn.addEventListener('click', async () => {
            const courseId = courseSelect.value;
            if (!courseId) return;

            const course = (window.cachedCourses || []).find(c => c.course_id == courseId);
            const courseName = course ? course.course_title : 'هذا الكورس';

            showCustomConfirm(
                '⚠️ تحذير أمني مدمر للبيانات!',
                `هل أنت متأكد تماماً من رغبتك في حذف الكورس "${courseName}" بجميع محتوياته؟ سيقوم هذا الإجراء بحذف الكورس وكافة الأقسام والمواد التابعة له نهائياً من قاعدة البيانات (Cascading Delete).`,
                async () => {
                    try {
                        const backendUrl = `http://${window.location.hostname}:3000/api/courses/${courseId}`;
                        const response = await fetch(backendUrl, {
                            method: 'DELETE',
                            credentials: 'include'
                        });

                        if (response.status === 401 || response.status === 403) {
                            showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                            setTimeout(() => window.location.replace('login.html'), 1500);
                            return;
                        }

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'فشل حذف الكورس من قاعدة البيانات');
                        }

                        showToast('🎉 تم حذف الكورس بجميع ملحقاته بنجاح من قاعدة البيانات!', 'success');

                        // إعادة تحميل الكورسات وتصفير الاختيار
                        await loadCourses();
                        courseSelect.value = '';
                        courseSelect.dispatchEvent(new Event('change'));

                    } catch (error) {
                        console.error('❌ خطأ أثناء حذف الكورس:', error);
                        showToast(`❌ حدث خطأ أثناء الحذف: ${error.message}`, 'error');
                    }
                }
            );
        });
    }

    /* ==============================================================================
       مفهوم أكاديمي متقدم: دورة التكامل الآمنة ثنائية الأطراف في تطبيقات SPA
       (End-to-End Secure Integration in Single Page Applications)

       في هذا القسم، نقوم بربط نموذج "إنشاء كورس جديد" بالخادم الخلفي (Backend)
       بشكل ديناميكي وآمن بالكامل. هنا يتكامل دور الجبهة الأمامية للعميل الذكي 
       مع جدار الحماية الأمني للخادم (AuthMiddleware Firewall) المعتمد على "مبدأ الثقة المعدومة":
       
       1. اعتراض إرسال النموذج (Intercepting Form Submission):
          نستخدم `e.preventDefault()` لمنع التحديث التلقائي للصفحة (Synchronous Reload)
          للحفاظ على حالة التطبيق وتجربة المستخدم السلسة للـ SPA.
          
       2. تخطي جدار الحماية بأمان تلقائي (Passing the Auth Firewall):
          المفتاح السري هنا هو الخيار `credentials: 'include'`. عند تفعيل هذا الخيار في الـ Fetch،
          يقوم المتصفح تلقائياً وبتوجيه أمني صارم بإرفاق كوكي الجلسة المشفرة والآمنة 
          (`HttpOnly JWT Cookie`) الممنوحة مسبقاً للمشرف في عملية تسجيل الدخول.
          بدونها، يرفض جدار حماية الخادم الطلب فوراً برمز 401.
          
       3. تكامل الثقة المعدومة (Zero Trust Client Architecture):
          الجزء الأمامي (العميل) لا يرى التوكن ولا يقرأه ولا يعلم محتواه (XSS Immune). المتصفح فقط
          هو من يتكفل بنقله بأمان، ويقوم الـ AuthMiddleware في الخادم بفك التشفير، والتحقق 
          من التوقيع ومستوى الصلاحيات (Super_Admin)، ثم السماح أو الرفض استناداً لنتائج التحقق.
          في حال انتهاء الجلسة (401 أو 403)، يتم طرد المشرف فوراً وإعادة توجيهه إلى `login.html`.
       ============================================================================== */
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const courseTitleInput = document.getElementById('course-title');
            const courseDescriptionInput = document.getElementById('course-description');

            if (!courseTitleInput || !courseDescriptionInput) return;

            const course_title = courseTitleInput.value.trim();
            const description = courseDescriptionInput.value.trim();

            // التحقق من صحة البيانات في الواجهة قبل الإرسال (Client-Side Validation)
            if (!course_title || !description) {
                showToast('⚠️ يرجى ملء حقل اسم الكورس ووصفه أولاً!', 'warning');
                return;
            }

            try {
                // إرسال الطلب الآمن للخادم عبر المنفذ والمسار المحدد ديناميكياً
                const backendUrl = `http://${window.location.hostname}:3000/api/courses`;
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // إرسال كوكي الـ JWT الآمنة لتخطي جدار الحماية
                    body: JSON.stringify({
                        course_title,
                        description,
                        image_url: '' // تمرير قيمة افتراضية فارغة لرابط الصورة
                    })
                });

                if (response.status === 401 || response.status === 403) {
                    console.warn('⚠️ جلسة المشرف منتهية أو غير صالحة. جاري التوجيه لتسجيل الدخول...');
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل إضافة الكورس الجديد');
                }

                const result = await response.json();
                console.log('✅ تم إضافة الكورس الجديد بنجاح في قاعدة البيانات:', result);

                // إشعار المشرف بنجاح العملية
                showToast('🎉 تم إنشاء وإضافة الكورس الجديد بنجاح!', 'success');

                // تنظيف النموذج وإعادة إخفائه
                addCourseForm.reset();
                addCourseForm.classList.add('hidden');
                addCourseForm.classList.remove('flex');

                // إعادة خيار الاختيار للوضع الافتراضي
                if (courseSelect) {
                    courseSelect.value = '';
                }

                // تحديث القائمة ديناميكياً بدون تحديث الصفحة (Dynamic Data Re-binding)
                await loadCourses();

            } catch (error) {
                console.error('❌ خطأ أثناء إرسال الكورس الجديد:', error);
                showToast(`❌ حدث خطأ أثناء الحفظ: ${error.message}`, 'error');
            }
        });
    }

    /* Add Content Form Toggle (Section 1) */
    const toggleAddContentButton = document.getElementById('toggle-add-content-1');
    const addContentForm = document.getElementById('add-content-form-1');
    const cancelAddContentButton = document.getElementById('cancel-add-content-1');

    if (toggleAddContentButton) {
        toggleAddContentButton.addEventListener('click', () => {
            addContentForm.classList.remove('hidden');
            toggleAddContentButton.classList.add('hidden');
        });
        cancelAddContentButton.addEventListener('click', () => {
            addContentForm.classList.add('hidden');
            toggleAddContentButton.classList.remove('hidden');
        });
    }

    /* New Section Form Toggle & Secure Submission */
    const toggleNewSectionButton = document.getElementById('toggle-new-section-btn');
    const addSectionForm = document.getElementById('add-section-form');
    const cancelNewSectionButton = document.getElementById('cancel-new-section-btn');

    if (toggleNewSectionButton && addSectionForm) {
        toggleNewSectionButton.addEventListener('click', () => {
            addSectionForm.classList.remove('hidden');
            toggleNewSectionButton.classList.add('hidden');
        });

        if (cancelNewSectionButton) {
            cancelNewSectionButton.addEventListener('click', () => {
                addSectionForm.classList.add('hidden');
                addSectionForm.reset();
                toggleNewSectionButton.classList.remove('hidden');
            });
        }

        // معالجة حدث إرسال نموذج القسم الجديد وتكامل البيانات
        addSectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const courseId = courseSelect.value;
            const newSectionTitleInput = document.getElementById('new-section-title');

            if (!courseId || !newSectionTitleInput) return;

            const title = newSectionTitleInput.value.trim();

            if (!title) {
                showToast('⚠️ يرجى كتابة عنوان القسم أولاً!', 'warning');
                return;
            }

            try {
                // إرسال طلب POST آمن إلى الخادم الفرعي التابع للكورس الأب
                const backendUrl = `http://${window.location.hostname}:3000/api/courses/${courseId}/sections`;
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // إرسال توكن الـ JWT الآمن في الكوكيز لتخطي جدار الحماية
                    body: JSON.stringify({ title })
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('⚠️ انتهت جلستك الأمنية، يرجى تسجيل الدخول مجدداً.', 'warning');
                    setTimeout(() => window.location.replace('login.html'), 1500);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل إضافة القسم الجديد');
                }

                const result = await response.json();
                console.log('✅ تم إضافة القسم الجديد بنجاح:', result);

                // إشعار المشرف بنجاح العملية
                showToast('🎉 تم إنشاء وإضافة القسم الجديد بنجاح!', 'success');

                // تنظيف النموذج وإعادة إخفائه
                addSectionForm.reset();
                addSectionForm.classList.add('hidden');
                toggleNewSectionButton.classList.remove('hidden');

                // إعادة تمييه الواجهة وإعادة جلب الأقسام تلقائياً في الوقت الحقيقي (Dynamic UI Hydration)
                await loadCourseSections(courseId);

            } catch (error) {
                console.error('❌ خطأ أثناء إضافة القسم الجديد:', error);
                showToast(`❌ حدث خطأ أثناء الحفظ: ${error.message}`, 'error');
            }
        });
    }

    // ==============================================================================
    // نظام تغيير كلمة المرور للمشرفين (Change Password Interactive Controller)
    // ==============================================================================
    // متطلب أكاديمي وأمني: نتحقق من وجود الحقول للتأكد من توافق الواجهات التفاعلية (SPA).
    // يتم التخاطب مباشرة مع الخادم المحمي بـ PUT /api/auth/change-password مع تمرير 
    // الكوكيز الأمنية HttpOnly لإخلاء التوكن وجلسة العمل الحالية فور النجاح.
    // ==============================================================================
    const openChangePwdBtn = document.getElementById('open-change-password-btn');
    const changePwdModal = document.getElementById('change-password-modal');
    const closeChangePwdIcon = document.getElementById('close-change-password-modal-icon');
    const cancelChangePwdBtn = document.getElementById('change-password-modal-cancel-btn');
    const changePwdForm = document.getElementById('change-password-form');
    const changePwdBackdrop = document.getElementById('change-password-modal-backdrop');

    if (openChangePwdBtn && changePwdModal) {
        // مستمع حدث فتح نافذة تغيير كلمة المرور وتجميد تمرير الصفحة الخلفية
        openChangePwdBtn.addEventListener('click', () => {
            changePwdModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            const oldPwdInput = document.getElementById('old-password');
            if (oldPwdInput) oldPwdInput.focus();
        });

        // دالة تنظيف الحقول وإغلاق المودال بنعومة
        const closeChangePwdModal = () => {
            changePwdModal.classList.add('hidden');
            document.body.style.overflow = '';
            if (changePwdForm) changePwdForm.reset();
        };

        // تعيين مستمعي الإغلاق والإلغاء
        if (closeChangePwdIcon) closeChangePwdIcon.addEventListener('click', closeChangePwdModal);
        if (cancelChangePwdBtn) cancelChangePwdBtn.addEventListener('click', closeChangePwdModal);
        if (changePwdBackdrop) changePwdBackdrop.addEventListener('click', closeChangePwdModal);

        // مستمع إرسال النموذج ومعالجة الطلبات غير المتزامنة
        if (changePwdForm) {
            changePwdForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const oldPassword = document.getElementById('old-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmNewPassword = document.getElementById('confirm-new-password').value;

                // التحقق من تطابق كلمتي المرور محلياً قبل التخاطب مع السيرفر لتقليص استهلاك الموارد
                if (newPassword !== confirmNewPassword) {
                    showToast('⚠️ كلمتا المرور الجديدتان غير متطابقتين!', 'warning');
                    return;
                }

                if (newPassword.length < 6) {
                    showToast('⚠️ يجب ألا تقل كلمة المرور الجديدة عن 6 خانات!', 'warning');
                    return;
                }

                try {
                    const backendUrl = `http://${window.location.hostname}:3000/api/auth/change-password`;
                    const response = await fetch(backendUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include', // إرسال كوكي المصادقة لتثبيت التوثيق الإشرافي
                        body: JSON.stringify({ oldPassword, newPassword })
                    });

                    if (response.status === 401 || response.status === 403) {
                        showToast('⚠️ غير مصرح لك بهذه العملية أو انتهت جلستك الأمنية.', 'error');
                        setTimeout(() => window.location.replace('login.html'), 1500);
                        return;
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'فشل تعديل كلمة المرور');
                    }

                    // إشعار بالنجاح وتوجيه العميل للتسجيل مجدداً
                    showToast('🎉 تم تغيير كلمة المرور بنجاح! جاري تسجيل الخروج...', 'success');
                    closeChangePwdModal();

                    setTimeout(() => {
                        window.location.replace('login.html');
                    }, 1500);

                } catch (error) {
                    console.error('❌ خطأ أثناء تغيير كلمة المرور:', error);
                    showToast(`❌ فشل الإجراء: ${error.message}`, 'error');
                }
            });
        }
    }

});
