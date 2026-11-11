/**
 * translations.js — Dynamic Localization Engine (Arabic / English)
 * 
 * Responsibilities:
 *   1. Store localized text translations for homepage and profile drawer elements.
 *   2. Dynamically apply active language (text contents and input placeholders).
 *   3. Automatically adjust document layout direction (RTL / LTR) for Tailwind CSS.
 *   4. Persist user language preferences in LocalStorage.
 * 
 * Brand: حاضراكس | HaderaX — جامعة الحاضرة (University of Alhadera)
 */

const translations = {
    ar: {
        brand: "حاضراكس",
        brand_footer: "المنصة التقنية الرائدة لطلاب جامعة الحاضرة لتطوير المهارات البرمجية وبناء حلول رقمية متقدمة ومشاريع ريادية تخدم المجتمع.",
        university: "جامعة الحاضرة",
        nav_home: "الرئيسية",
        nav_courses: "الدورات",
        nav_about: "عن المنصة",
        nav_contact: "تواصل معنا",
        login_btn_text: "تسجيل الدخول",
        admin_portal_btn_text: "لوحة الإشراف",
        hero_tag: "جامعة الحاضرة — University of Alhadera",
        hero_welcome: "مرحباً بك في منصة حاضراكس",
        hero_desc: "نصنع المستقبل ونقود الابتكار الرقمي من خلال تمكين الطلاب بأحدث التقنيات ومهارات البرمجة المتقدمة في بيئة أكاديمية محفزة وتطبيق عملي مستمر.",
        latest_news: "آخر الأخبار والإعلانات",
        about_title: "رؤية حاضراكس ورسالتها",
        vision_title: "الرؤية",
        vision_desc: "أن تكون منصة وفريق HaderaX Devs الصرح الطلابي الرائد في مجال البرمجة التنافسية وتطوير البرمجيات على مستوى ليبيا والمنطقة، وأن نضع جامعة الحاضرة في صدارة التميز التقني.",
        mission_title: "الرسالة والهدف الأساسي",
        mission_desc: "بناء وتدريب فرق برمجية وتقنية على أعلى مستوى لتمثيل جامعة الحاضرة تحت راية HaderaX، وتحقيق الفوز في المسابقة الليبية للبرمجة (LCPC) والمنافسات الإقليمية والدولية وتطوير حلول حقيقية تخدم الوطن.",
        goals_title: "الأهداف الاستراتيجية",
        goal_1: "خلق مجتمع تقني ريادي وتعاوني لصقل مهارات الطلاب البرمجية.",
        goal_2: "تطوير مهارات حل المشكلات والتفكير الخوارزمي المتقدم لكافة الأعضاء.",
        goal_3: "بناء وتطوير مشاريع وأنظمة برمجية متكاملة تخدم الجامعة والمجتمع.",
        goal_4: "توفير مسارات تدريبية تطبيقية في الذكاء الاصطناعي، هندسة الويب وتطبيقات الهاتف.",
        courses_title: "الدورات والمسارات التدريبية المتاحة في حاضراكس",
        quick_links: "روابط سريعة",
        contact_info: "بيانات التواصل",
        university_location: "جامعة الحاضرة، طرابلس",
        copyright: "© 2026 منصة حاضراكس — جامعة الحاضرة. جميع الحقوق محفوظة.",
        quick_actions: "إجراءات سريعة",
        change_lang: "تغيير لغة العرض",
        change_password: "تغيير كلمة المرور",
        logout: "تسجيل الخروج من الحساب",
        old_password_label: "كلمة المرور القديمة",
        new_password_label: "كلمة المرور الجديدة",
        confirm_password_label: "تأكيد كلمة المرور",
        update_password_btn: "تحديث كلمة المرور",
        drawer_note: "ملاحظة: واجهت مشكلة؟ تواصل مع الدعم الفني لحاضراكس",
        loading_role: "تحميل الرتبة...",
        loading_name: "جاري التحميل...",
        student_id_prefix: "ID: ------",
        // placeholders
        old_password_placeholder: "••••••••",
        new_password_placeholder: "••••••••",
        confirm_password_placeholder: "••••••••",
    },
    en: {
        brand: "HaderaX",
        brand_footer: "The premier tech and coding platform for University of Alhadera students to master software engineering, build cutting-edge systems, and lead digital innovation.",
        university: "University of Alhadera",
        nav_home: "Home",
        nav_courses: "Courses",
        nav_about: "About HaderaX",
        nav_contact: "Contact Us",
        login_btn_text: "Sign In",
        admin_portal_btn_text: "Admin Panel",
        hero_tag: "University of Alhadera",
        hero_welcome: "Welcome to HaderaX Platform",
        hero_desc: "Empowering next-generation engineers with advanced coding mastery, algorithmic thinking, and modern software architecture in an inspiring academic ecosystem.",
        latest_news: "Latest Announcements",
        about_title: "HaderaX Vision & Mission",
        vision_title: "Our Vision",
        vision_desc: "To position HaderaX Devs as the leading competitive programming and software development powerhouse in Libya, placing University of Alhadera among elite global universities.",
        mission_title: "Our Mission & Core Goal",
        mission_desc: "Training high-caliber programming teams to represent University of Alhadera as HaderaX, conquer the Libyan Collegiate Programming Contest (LCPC), and advance to regional & international ACM/ICPC championships.",
        goals_title: "Strategic Objectives",
        goal_1: "Cultivate a dynamic, collaborative coding ecosystem to elevate student skills.",
        goal_2: "Foster advanced algorithmic thinking and competitive problem-solving capabilities.",
        goal_3: "Develop robust production-grade software solutions serving society and academia.",
        goal_4: "Deliver hands-on training tracks in Full-Stack development, AI, and Cloud engineering.",
        courses_title: "Available Training Courses on HaderaX",
        quick_links: "Quick Links",
        contact_info: "Contact Information",
        university_location: "University of Alhadera, Tripoli",
        copyright: "© 2026 HaderaX Platform — University of Alhadera. All rights reserved.",
        quick_actions: "Quick Actions",
        change_lang: "Change Display Language",
        change_password: "Change Password",
        logout: "Log Out of Account",
        old_password_label: "Old Password",
        new_password_label: "New Password",
        confirm_password_label: "Confirm Password",
        update_password_btn: "Update Password",
        drawer_note: "Note: Having trouble? Contact HaderaX Support",
        loading_role: "Loading role...",
        loading_name: "Loading...",
        student_id_prefix: "ID: ------",
        // placeholders
        old_password_placeholder: "••••••••",
        new_password_placeholder: "••••••••",
        confirm_password_placeholder: "••••••••",
    }
};

/**
 * دالة تطبيق اللغة على كامل واجهات الصفحة (Apply translations dynamically)
 */
function applyLanguage(lang) {
    // 1. تحديث اتجاه ولغة الصفحة
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // 2. تحديث كافة العناصر التي تحمل وسم data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // 3. تحديث التلميحات والإدخالات (Placeholders)
    const inputs = document.querySelectorAll('[data-i18n-placeholder]');
    inputs.forEach(input => {
        const key = input.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            input.setAttribute('placeholder', translations[lang][key]);
        }
    });
}

/**
 * دالة تبديل اللغة الحالية (Toggle between ar and en)
 */
function toggleLanguage() {
    const currentLang = localStorage.getItem('lang') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', newLang);
    applyLanguage(newLang);
    console.log(`🌐 Switched language to: ${newLang}`);
}

// تشغيل الفحص الفوري وتطبيق اللغة بمجرد تحميل شجرة DOM
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'ar';
    applyLanguage(savedLang);

    // ربط زر تغيير اللغة في القائمة الجانبية بحدث النقر
    const changeLangBtn = document.getElementById('change-lang-btn');
    if (changeLangBtn) {
        changeLangBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLanguage();
        });
    }
});
