/**
 * home.js — Dynamic Student Homepage Renderer
 * 
 * Responsibilities:
 *   1. Fetch and render live courses in #courses-grid with elegant HSL gradients.
 *   2. Fetch and render live news feed in #news-carousel-container with image aspect ratios and overlays.
 */

// ==============================================================================
// 1. Dynamic API Base Resolver (Supports Localhost, Wi-Fi Dev & Cloud Vercel)
// ==============================================================================
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000'
    ? `http://${window.location.hostname}:3000`
    : '';

document.addEventListener('DOMContentLoaded', () => {
    // تشغيل جلب البيانات حياً من السيرفر بمجرد تحميل الصفحة
    loadHomeCourses();
    loadHomeNews();
    checkAdminAccess(); // الفحص الأمني الصامت لصلاحيات المشرف الموثقة
});

/**
 * ==============================================================================
 * 1. جلب وعرض الكورسات التدريبية حياً (Dynamic Course Grid Renderer)
 * ==============================================================================
 */
async function loadHomeCourses() {
    try {
        const grid = document.getElementById('courses-grid');
        if (!grid) return;

        // إظهار مؤشر تحميل أكاديمي وراقٍ
        grid.innerHTML = `
            <div class="col-span-full py-12 flex flex-col items-center justify-center text-secondary">
                <span class="material-symbols-outlined animate-spin text-primary-container text-4xl mb-2">progress_activity</span>
                <p class="font-bold text-sm">جاري تحميل الدورات التدريبية المتاحة في حاضراكس...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE}/api/courses`);
        if (!response.ok) throw new Error('فشل جلب الدورات من السيرفر');

        const courses = await response.json();

        if (courses.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center bg-white border border-border-subtle rounded-2xl text-center shadow-sm">
                    <span class="material-symbols-outlined text-secondary text-5xl mb-3">auto_stories</span>
                    <h4 class="font-bold text-lg text-on-surface mb-1">لا توجد دورات تدريبية حالياً</h4>
                    <p class="text-sm text-secondary">ترقبوا إطلاق دورات وكورسات جديدة ومثيرة قريباً جداً!</p>
                </div>
            `;
            return;
        }

        // تفريغ الحاوية قبل البناء
        grid.innerHTML = '';

        // عرض أحدث 4 دورات مميزة في الصفحة الرئيسية لمنع تراكم المحتوى
        const featuredCourses = courses.slice(0, 4);

        featuredCourses.forEach((course) => {
            let bannerGradient = 'bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900';
            let badgeText = 'مسار تدريبي معتمد';
            let badgeClass = 'bg-white/95 text-slate-800';
            let icon = 'terminal';
            let watermarkIcon = 'terminal';

            const lowerTitle = (course.course_title || '').toLowerCase();
            if (lowerTitle.includes('ذكاء') || lowerTitle.includes('آلة')) {
                bannerGradient = 'bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-900';
                badgeText = 'الذكاء الاصطناعي';
                badgeClass = 'bg-sky-500 text-white';
                icon = 'psychology';
                watermarkIcon = 'smart_toy';
            } else if (lowerTitle.includes('ويب') || lowerTitle.includes('full-stack')) {
                bannerGradient = 'bg-gradient-to-br from-blue-950 via-slate-900 to-teal-950';
                badgeText = 'تطوير الويب';
                badgeClass = 'bg-emerald-500 text-white';
                icon = 'language';
                watermarkIcon = 'code_blocks';
            } else if (lowerTitle.includes('بايثون')) {
                bannerGradient = 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900';
                badgeText = 'هندسة بايثون';
                badgeClass = 'bg-amber-500 text-white';
                icon = 'terminal';
                watermarkIcon = 'data_object';
            } else if (lowerTitle.includes('أمن')) {
                bannerGradient = 'bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900';
                badgeText = 'أمن سيبراني';
                badgeClass = 'bg-rose-500 text-white';
                icon = 'security';
                watermarkIcon = 'shield';
            }

            const a = document.createElement('a');
            a.href = `course-details.html?id=${course.course_id}`;
            a.className = "bg-white rounded-2xl border border-slate-200/90 hover:border-primary-container/60 hover:shadow-xl transition-all duration-300 group flex flex-col no-underline text-inherit shadow-sm overflow-hidden cursor-pointer animate-scale-in";

            a.innerHTML = `
                <!-- Visual Gradient Cover Banner (CourseBuilder Inspired) -->
                <div class="h-32 w-full ${bannerGradient} relative flex items-center justify-center overflow-hidden border-b border-slate-100 flex-shrink-0">
                    <div class="absolute top-3 right-3 z-10">
                        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badgeClass} shadow-xs">
                            ${badgeText}
                        </span>
                    </div>
                    <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <span class="material-symbols-outlined text-[32px]">${icon}</span>
                    </div>
                    <span class="material-symbols-outlined absolute -bottom-4 -left-3 text-7xl text-white/5 pointer-events-none">${watermarkIcon}</span>
                </div>

                <!-- Card Content Body -->
                <div class="p-5 flex-grow flex flex-col">
                    <h3 class="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-container transition-colors mb-2 text-right line-clamp-1" dir="auto">${course.course_title}</h3>
                    <p class="text-xs sm:text-sm text-slate-500 mb-5 flex-grow leading-relaxed line-clamp-2 text-right" dir="auto">
                        ${course.description || 'مسار تدريبي تخصصي في جامعة الحاضرة لصقل مهارات الطلاب البرمجية وتأهيل الكوادر لسوق العمل.'}
                    </p>

                    <div class="grid grid-cols-2 gap-2 py-3 border-t border-slate-100 text-xs text-slate-500 text-right">
                        <div class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-emerald-600">qr_code_2</span>
                            <span class="font-medium">حضور بـ QR</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-amber-600">verified</span>
                            <span class="font-medium">شهادة معتمدة</span>
                        </div>
                    </div>

                    <div class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-container">
                        <span>عرض تفاصيل ومقررات المسار</span>
                        <span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_left_alt</span>
                    </div>
                </div>
            `;
            grid.appendChild(a);
        });

    } catch (error) {
        console.error('Error loading courses:', error);
        const grid = document.getElementById('courses-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full py-10 flex flex-col items-center justify-center bg-red-50 border border-red-200 text-red-600 rounded-2xl">
                    <span class="material-symbols-outlined text-3xl mb-1">error</span>
                    <p class="font-bold">عذراً، فشل مزامنة الدورات مع السيرفر: ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * ==============================================================================
 * 2. جلب وعرض الأخبار والإعلانات حياً (Dynamic News Slider Feed)
 * ==============================================================================
 */
async function loadHomeNews() {
    try {
        const container = document.getElementById('news-carousel-container');
        if (!container) return;

        container.innerHTML = `
            <div class="w-full py-8 flex justify-center items-center gap-2 text-secondary">
                <span class="material-symbols-outlined animate-spin text-primary-container text-2xl">autorenew</span>
                <span class="font-bold text-xs">جاري سحب شريط الأخبار الحالية...</span>
            </div>
        `;

        const response = await fetch(`${API_BASE}/api/news`);
        if (!response.ok) throw new Error('فشل جلب الأخبار');

        const news = await response.json();

        if (news.length === 0) {
            container.innerHTML = `
                <div class="w-full py-8 text-center bg-white border border-border-subtle rounded-xl text-secondary font-medium text-sm">
                    <span class="material-symbols-outlined text-3xl mb-1 block text-slate-300">campaign</span>
                    لا توجد إعلانات أو أخبار عاجلة منشورة حالياً في منصة حاضراكس.
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        news.forEach(item => {
            const article = document.createElement('article');
            article.className = "min-w-[290px] md:min-w-[460px] max-w-[460px] bg-white rounded-xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all duration-150 overflow-hidden group flex flex-col animate-scale-in flex-shrink-0";

            const fullImgUrl = `${API_BASE}${item.image_path}`;

            article.innerHTML = `
                <div class="w-full h-48 md:h-52 relative overflow-hidden flex items-center justify-center bg-slate-100 border-b border-slate-200 flex-shrink-0">
                    <img src="${fullImgUrl}" alt="${item.title}" class="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-95" onerror="this.onerror=null; this.src='assets/branding/haderax-icon.svg'; this.className='w-20 h-20 object-contain p-4 opacity-40';">
                    <div class="absolute top-3 right-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-800 shadow-xs border border-slate-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                            إعلان رسمي
                        </span>
                    </div>
                </div>
                <div class="p-6 flex-grow flex flex-col gap-2 text-right">
                    <h3 class="font-bold text-base md:text-lg text-slate-900 group-hover:text-primary-container transition-colors leading-snug" dir="auto">${item.title}</h3>
                    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1 line-clamp-3 whitespace-pre-line" dir="auto">${item.content}</p>
                    <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span class="font-medium">جامعة الحاضرة • الشؤون الأكاديمية</span>
                        <span class="text-primary-container font-semibold">تفاصيل الإعلان</span>
                    </div>
                </div>
            `;
            container.appendChild(article);
        });

        // ربط أزرار التمرير الأفقي للأخبار بسلاسة
        const nextBtn = document.getElementById('news-scroll-right');
        const prevBtn = document.getElementById('news-scroll-left');
        if (nextBtn) {
            nextBtn.onclick = () => container.scrollBy({ left: 380, behavior: 'smooth' });
        }
        if (prevBtn) {
            prevBtn.onclick = () => container.scrollBy({ left: -380, behavior: 'smooth' });
        }

    } catch (error) {
        console.error('Error loading news:', error);
        const container = document.getElementById('news-carousel-container');
        if (container) {
            container.innerHTML = `
                <div class="w-full py-6 text-center text-red-600 font-bold text-xs bg-red-50 rounded-xl border border-red-200">
                    ❌ فشل جلب الأخبار الحالية: ${error.message}
                </div>
            `;
        }
    }
}

/**
 * ==============================================================================
 * 3. فحص الجلسة والربط الديناميكي للملف الشخصي (Profile Drawer & Dynamic Auth Binding)
 * ==============================================================================
 * المبدأ الأكاديمي والعملي:
 * نقوم بالتحقق من الجلسة الأمنية للمستخدم في الخلفية. 
 * - إذا كان المستخدم مسجلاً: نُظهر أيقونة الملف الشخصي، ونقوم بملء بياناته حياً بخصوصية تامة.
 * - إذا كان زائراً: نُخفي أيقونة الملف الشخصي ونُظهر زر "تسجيل الدخول" المباشر.
 * - يتم تفعيل أزرار تسجيل الخروج وتعديل كلمة المرور تفاعلياً بشكل كامل.
 */
async function checkAdminAccess() {
    const menuBtn = document.getElementById('menu-btn');
    const loginBtn = document.getElementById('login-btn');
    const adminBtn = document.getElementById('admin-portal-btn');
    
    const drawerRole = document.getElementById('drawer-user-role');
    const drawerName = document.getElementById('drawer-user-name');
    const drawerId = document.getElementById('drawer-user-id');
    const logoutBtn = document.getElementById('drawer-logout-btn');

    try {
        const backendUrl = `${API_BASE}/api/auth/me`;
        const response = await fetch(backendUrl, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            console.log(`👤 تم التحقق من الجلسة النشطة لـ: ${user.name} (${user.role})`);

            // 1. إدارة إظهار عناصر التحكم في الهيدر
            if (menuBtn) menuBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');

            // إظهار زر لوحة الإشراف للمشرفين بكافة رتبهم
            const adminRoles = ['Super_Admin', 'admin', 'Students_Admin', 'Curriculum_Admin'];
            if (adminBtn && adminRoles.includes(user.role)) {
                adminBtn.classList.remove('hidden');
            }

            // 2. تحديث وتعبئة بيانات القائمة الجانبية (Drawer Profile) حياً
            if (drawerName) drawerName.textContent = user.name || 'مستخدم مسجل';
            if (drawerId) drawerId.textContent = user.student_id ? `رقم القيد: ${user.student_id}` : 'رقم القيد: غير متوفر';

            // ترجمة رتبة الحساب بصيغة عربية أكاديمية أنيقة
            if (drawerRole) {
                let roleText = 'طالب بالمنصة';
                let roleBg = 'bg-[#ae0038]'; // لون الماتيريال 3 الافتراضي للمنصة

                if (user.role === 'Super_Admin') {
                    roleText = 'مدير النظام العام';
                    roleBg = 'bg-primary-container';
                } else if (user.role === 'admin') {
                    roleText = 'مشرف النظام';
                    roleBg = 'bg-slate-700';
                } else if (user.role === 'Students_Admin') {
                    roleText = 'مشرف شؤون الطلاب';
                    roleBg = 'bg-emerald-600';
                } else if (user.role === 'Curriculum_Admin') {
                    roleText = 'مشرف المناهج الدراسية';
                    roleBg = 'bg-blue-600';
                }
                
                drawerRole.textContent = roleText;
                drawerRole.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${roleBg}`;
            }

            // 3. ربط حدث تسجيل الخروج التفاعلي
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        const logoutUrl = `${API_BASE}/api/auth/logout`;
                        const logoutRes = await fetch(logoutUrl, {
                            method: 'POST',
                            credentials: 'include'
                        });

                        if (logoutRes.ok) {
                            console.log('✅ تم تسجيل الخروج بنجاح.');
                            window.location.reload(); // إعادة تحميل الصفحة لتحديث الواجهة لنمط الزائر
                        } else {
                            alert('⚠️ فشل تسجيل الخروج، يرجى المحاولة لاحقاً.');
                        }
                    } catch (err) {
                        console.error('Logout error:', err);
                    }
                });
            }

            // 4. ربط حدث تعديل كلمة المرور داخل القائمة الجانبية
            const changePwdForm = document.getElementById('drawer-change-password-form');
            const msgEl = document.getElementById('drawer-password-message');

            if (changePwdForm && msgEl) {
                changePwdForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const oldPassword = document.getElementById('old_password').value;
                    const newPassword = document.getElementById('new_password').value;
                    const confirmPassword = document.getElementById('confirm_password').value;

                    // إخفاء التنبيه السابق
                    msgEl.classList.add('hidden');
                    msgEl.className = 'hidden text-xs text-right font-bold p-3 rounded-lg border';

                    // التحقق المحلي
                    if (newPassword !== confirmPassword) {
                        msgEl.textContent = '⚠️ كلمتا المرور الجديدتان غير متطابقتين!';
                        msgEl.className = 'block text-xs text-right font-bold p-3 rounded-lg border border-yellow-500/20 bg-yellow-50 text-yellow-900 animate-scale-in';
                        msgEl.classList.remove('hidden');
                        return;
                    }

                    if (newPassword.length < 6) {
                        msgEl.textContent = '⚠️ يجب ألا تقل كلمة المرور الجديدة عن 6 خانات!';
                        msgEl.className = 'block text-xs text-right font-bold p-3 rounded-lg border border-yellow-500/20 bg-yellow-50 text-yellow-900 animate-scale-in';
                        msgEl.classList.remove('hidden');
                        return;
                    }

                    try {
                        const pwdUrl = `${API_BASE}/api/auth/change-password`;
                        const pwdRes = await fetch(pwdUrl, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({ oldPassword, newPassword })
                        });

                        const pwdData = await pwdRes.json();

                        if (!pwdRes.ok) {
                            throw new Error(pwdData.error || 'فشل تعديل كلمة المرور');
                        }

                        msgEl.textContent = '🎉 تم تعديل كلمة المرور بنجاح! جاري تسجيل الخروج الفوري...';
                        msgEl.className = 'block text-xs text-right font-bold p-3 rounded-lg border border-emerald-500/20 bg-emerald-50 text-emerald-900 animate-scale-in';
                        msgEl.classList.remove('hidden');
                        
                        changePwdForm.reset();

                        setTimeout(() => {
                            window.location.replace('login.html');
                        }, 1500);

                    } catch (pwdErr) {
                        console.error('Password change error:', pwdErr);
                        msgEl.textContent = `❌ فشل الإجراء: ${pwdErr.message}`;
                        msgEl.className = 'block text-xs text-right font-bold p-3 rounded-lg border border-red-500/20 bg-red-50 text-red-900 animate-scale-in';
                        msgEl.classList.remove('hidden');
                    }
                });
            }

        } else {
            // الجلسة غير صالحة أو غير مسجل (Visitor Mode)
            if (menuBtn) menuBtn.classList.add('hidden');
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (adminBtn) adminBtn.classList.add('hidden');
        }
    } catch (error) {
        // خطأ اتصال أو خادم متوقف (Visitor Mode Fallback)
        console.debug('Session validation completed (Guest mode active).');
        if (menuBtn) menuBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (adminBtn) adminBtn.classList.add('hidden');
    }
}

/**
 * ==============================================================================
 * 4. البحث الأكاديمي الفوري من شريط الهيرو (Hero Academic Search Handler)
 * ==============================================================================
 */
function handleHeroSearch() {
    const input = document.getElementById('hero-search-input');
    const query = input ? input.value.trim() : '';
    if (query) {
        window.location.href = `courses.html?q=${encodeURIComponent(query)}`;
    } else {
        window.location.href = 'courses.html';
    }
}
window.handleHeroSearch = handleHeroSearch;

