/**
 * main.js — Shared & Student-Facing Logic
 * Extracted from: Public_dashboard.html
 * 
 * Responsibilities:
 *   1. Side Drawer (hamburger menu) open/close with backdrop
 *   2. Password Change Form accordion toggle with visual state
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ========================================================
       Section 1: Side Drawer — Open / Close
       ======================================================== */
    const menuButton = document.getElementById('menu-btn');
    const closeDrawerButton = document.getElementById('close-drawer');
    const sideDrawer = document.getElementById('side-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    function toggleDrawer() {
        const isClosed = sideDrawer.classList.contains('translate-x-full');

        if (isClosed) {
            sideDrawer.classList.remove('translate-x-full');
            sideDrawer.classList.add('translate-x-0');

            drawerBackdrop.classList.remove('pointer-events-none', 'opacity-0');
            drawerBackdrop.classList.add('opacity-100');

            document.body.style.overflow = 'hidden';
        } else {
            sideDrawer.classList.add('translate-x-full');
            sideDrawer.classList.remove('translate-x-0');

            drawerBackdrop.classList.remove('opacity-100');
            drawerBackdrop.classList.add('opacity-0', 'pointer-events-none');

            document.body.style.overflow = '';
        }
    }

    menuButton.addEventListener('click', toggleDrawer);
    closeDrawerButton.addEventListener('click', toggleDrawer);
    drawerBackdrop.addEventListener('click', toggleDrawer);


    /* ========================================================
       Section 2: Password Change Form — Accordion Toggle
       ======================================================== */
    const togglePasswordButton = document.getElementById('toggle-password-btn');
    const passwordFormSection = document.getElementById('password-form-section');
    const passwordChevronIcon = document.getElementById('password-chevron');
    const lockIcon = document.getElementById('lock-icon');

    togglePasswordButton.addEventListener('click', () => {
        passwordFormSection.classList.toggle('hidden');

        const isNowHidden = passwordFormSection.classList.contains('hidden');

        if (isNowHidden) {
            passwordChevronIcon.classList.remove('rotate-180');
            togglePasswordButton.className =
                "w-full flex items-center gap-3 p-4 rounded-xl border border-border-subtle " +
                "text-right text-on-surface hover:border-primary-container " +
                "hover:text-primary-container transition-all group";
            lockIcon.className =
                "material-symbols-outlined text-secondary " +
                "group-hover:text-primary-container transition-colors";
        } else {
            passwordChevronIcon.classList.add('rotate-180');
            togglePasswordButton.className =
                "w-full flex items-center gap-3 p-4 rounded-xl border border-primary-container " +
                "bg-crimson-muted text-right text-primary-container font-bold " +
                "transition-all shadow-sm";
            lockIcon.className =
                "material-symbols-outlined text-primary-container";
        }
    });

    /* ========================================================
       Section 3: Drawer Password Visibility Toggles
       ======================================================== */
    // متطلب تصميمي راقٍ وأكثر متانة: استخدام تفويض الأحداث لتفعيل أزرار كشف كلمة السر حتى عند استبدال عناصر النموذج ديناميكياً
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.visibility-toggle-btn');
        if (!btn) return;

        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (!targetInput) return;

        const isPassword = targetInput.getAttribute('type') === 'password';
        if (isPassword) {
            targetInput.setAttribute('type', 'text');
            btn.textContent = 'visibility'; // كشف النص
        } else {
            targetInput.setAttribute('type', 'password');
            btn.textContent = 'visibility_off'; // إخفاء النص
        }
    });

});
