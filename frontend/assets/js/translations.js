/**
 * translations.js — Dynamic Localization Engine (Arabic / English)
 * 
 * Responsibilities:
 *   1. Store localized text translations for homepage and profile drawer elements.
 *   2. Dynamically apply active language (text contents and input placeholders).
 *   3. Automatically adjust document layout direction (RTL / LTR) for Tailwind CSS.
 *   4. Persist user language preferences in LocalStorage.
 * 
 * Official Identity:
 *   - بالعربية: منصة الحاضرة للتعليم المستمر والتطوير التقني (حاضراكس | HaderaX)
 *   - بالإنجليزية: Al-Hadhira Tech Academy — University of Alhadera
 */

const translations = {
    ar: {
        brand: "حاضرإكس",
        brand_footer: "منصة الحاضرة للتعليم المستمر والتطوير التقني (Al-Hadhira Tech Academy) هي بيئة تدريب رقمية هجينة تابعة لجامعة الحاضرة لردم الفجوة بين التعليم الأكاديمي ومتطلبات سوق العمل في البرمجة والأمن السيبراني.",
        university: "جامعة الحاضرة",
        nav_home: "الرئيسية",
        nav_courses: "الدورات والمعسكرات",
        nav_about: "عن الأكاديمية",
        nav_contact: "تواصل معنا",
        login_btn_text: "تسجيل الدخول",
        admin_portal_btn_text: "لوحة الإشراف",
        hero_tag: "جامعة الحاضرة — Al-Hadhira Tech Academy",
        hero_welcome: "منصة الحاضرة للتعليم المستمر والتطوير التقني",
        hero_desc: "بيئة تدريب رقمية هجينة تابعة لجامعة الحاضرة، تهدف إلى ردم الفجوة بين المناهج الأكاديمية النظرية ومتطلبات سوق العمل البرمجي والأمن السيبراني، مع توثيق الحضور اللحظي المشفر بالـ QR Code.",
        latest_news: "آخر المعسكرات والورش التدريبية",
        about_title: "رؤية وأهداف أكاديمية الحاضرة التقنية",
        vision_title: "الرؤية الاستراتيجية",
        vision_desc: "ردم الفجوة بين التعليم الأكاديمي وسوق العمل البرمجي والأمن السيبراني، وإطلاق معسكرات متخصصة تجمع بين المحاضرات الرقمية والورش العملية داخل المختبرات.",
        mission_title: "الرسالة والغاية",
        mission_desc: "تمكين الطلاب والمتدربين عبر مسارات تطبيقية مكثفة، وتوثيق الالتزام الفعلي بالقاعات عبر تقنية الـ QR المشفرة، وفق معمارية برمجية محصنة وحوكمة للصلاحيات تتبع معايير أمان الويب (OWASP).",
        goals_title: "الأهداف الأكاديمية والمهنية",
        goal_1: "إطلاق معسكرات برمجية هجينة تجمع بين التعليم الرقمي والتدريب المعملي.",
        goal_2: "تأهيل الكفاءات الوطنية لتلبية الاحتياجات المتسارعة في هندسة البرمجيات والأمن السيبراني.",
        goal_3: "حوكمة الحضور الأكاديمي بنظام تشفير QR ديناميكي يضمن الشفافية والالتزام.",
        goal_4: "ربط المشاريع التخرجية والعملية بحلول حقيقية ومنظومات إنتاجية معتمدة.",
        courses_title: "المسارات والمعسكرات التدريبية المعتمدة",
        quick_links: "روابط سريعة",
        contact_info: "بيانات التواصل والاستفسار",
        university_location: "جامعة الحاضرة، طرابلس — ليبيا",
        copyright: "© 2026 منصة الحاضرة للتعليم المستمر والتطوير التقني — جامعة الحاضرة. جميع الحقوق محفوظة.",
        quick_actions: "إجراءات سريعة",
        change_lang: "تغيير لغة العرض",
        change_password: "تغيير كلمة المرور",
        logout: "تسجيل الخروج من الحساب",
        old_password_label: "كلمة المرور القديمة",
        new_password_label: "كلمة المرور الجديدة",
        confirm_password_label: "تأكيد كلمة المرور",
        update_password_btn: "تحديث كلمة المرور",
        drawer_note: "ملاحظة: واجهت مشكلة؟ تواصل مع إدارة التعليم المستمر والتطوير التقني",
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
        brand_footer: "Al-Hadhira Tech Academy is a hybrid digital training environment affiliated with University of Alhadera, bridging academic curricula and software engineering/cybersecurity industry demands.",
        university: "University of Alhadera",
        nav_home: "Home",
        nav_courses: "Bootcamps & Courses",
        nav_about: "About Academy",
        nav_contact: "Contact Us",
        login_btn_text: "Sign In",
        admin_portal_btn_text: "Admin Panel",
        hero_tag: "University of Alhadera — Tech Academy",
        hero_welcome: "Al-Hadhira Tech Academy & Continuous Learning",
        hero_desc: "A hybrid training ecosystem by University of Alhadera bridging the gap between theoretical academia and industry standards in software development and cybersecurity, powered by cryptographic QR attendance.",
        latest_news: "Latest Bootcamps & Workshops",
        about_title: "Vision & Objectives of Al-Hadhira Tech Academy",
        vision_title: "Strategic Vision",
        vision_desc: "Bridging the gap between theoretical academia and tech market requirements by launching specialized bootcamps combining digital lectures with intensive laboratory workshops.",
        mission_title: "Mission & Purpose",
        mission_desc: "Empowering students and professionals through immersive tracks, real-time QR attendance verification, and a hardened OWASP-compliant architecture.",
        goals_title: "Core Objectives",
        goal_1: "Launch specialized hybrid bootcamps combining digital content and hands-on lab sessions.",
        goal_2: "Equip national talents with industry-standard software engineering and cybersecurity skill sets.",
        goal_3: "Govern lab attendance via dynamic QR encryption for tamper-proof accountability.",
        goal_4: "Bridge practical coursework and capstone projects with enterprise production standards.",
        courses_title: "Accredited Training Tracks & Bootcamps",
        quick_links: "Quick Links",
        contact_info: "Contact & Admissions",
        university_location: "University of Alhadera, Tripoli — Libya",
        copyright: "© 2026 Al-Hadhira Tech Academy — University of Alhadera. All rights reserved.",
        quick_actions: "Quick Actions",
        change_lang: "Change Display Language",
        change_password: "Change Password",
        logout: "Log Out of Account",
        old_password_label: "Old Password",
        new_password_label: "New Password",
        confirm_password_label: "Confirm Password",
        update_password_btn: "Update Password",
        drawer_note: "Note: Having trouble? Contact Al-Hadhira Academy Support",
        loading_role: "Loading role...",
        loading_name: "Loading...",
        student_id_prefix: "ID: ------",
        old_password_placeholder: "••••••••",
        new_password_placeholder: "••••••••",
        confirm_password_placeholder: "••••••••",
    }
};

/**
 * دالة تطبيق اللغة المختارة فورياً على الصفحة
 */
function applyLanguage(lang) {
    const selectedLang = translations[lang] ? lang : 'ar';
    const dict = translations[selectedLang];

    document.documentElement.lang = selectedLang;
    document.documentElement.dir = selectedLang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (dict[key]) {
            element.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            element.placeholder = dict[key];
        }
    });

    localStorage.setItem('preferred_language', selectedLang);

    const toggleLangBtn = document.getElementById('change-lang-btn');
    if (toggleLangBtn) {
        toggleLangBtn.innerHTML = `
            <span class="material-symbols-outlined text-[20px]">language</span>
            <span>${selectedLang === 'ar' ? 'English' : 'العربية'}</span>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferred_language') || 'ar';
    applyLanguage(savedLang);

    const toggleLangBtn = document.getElementById('change-lang-btn');
    if (toggleLangBtn) {
        toggleLangBtn.addEventListener('click', () => {
            const currentLang = document.documentElement.lang || 'ar';
            const nextLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(nextLang);
        });
    }
});
