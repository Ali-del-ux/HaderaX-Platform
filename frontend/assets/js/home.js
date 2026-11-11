/**
 * home.js — Dynamic Student Homepage Renderer
 * 
 * Responsibilities:
 *   1. Fetch and render live courses in #courses-grid with elegant HSL gradients.
 *   2. Fetch and render live news feed in #news-carousel-container with image aspect ratios and overlays.
 */

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

        const hostname = window.location.hostname || 'localhost';
        const response = await fetch(`http://${hostname}:3000/api/courses`);
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

        // تدرجات لونية مميزة وراقية للكورسات (Curated HSL Gradients)
        const gradients = [
            'from-primary-container/10 to-crimson-muted/40 border-primary-container/30',
            'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
            'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
            'from-amber-500/10 to-orange-500/10 border-amber-500/20'
        ];

        courses.forEach((course, index) => {
            const gradClass = gradients[index % gradients.length];
            const a = document.createElement('a');
            a.href = `course-details.html?id=${course.course_id}`;
            a.className = `bg-white rounded-2xl p-6 border ${gradClass} hover:-translate-y-1.5 transition-all duration-300 group flex flex-col no-underline text-inherit shadow-sm hover:shadow-md cursor-pointer animate-scale-in`;

            a.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-extrabold text-on-surface font-inter truncate flex-grow text-right" dir="auto">${course.course_title}</h3>
                    <span class="material-symbols-outlined text-primary-container text-2xl group-hover:rotate-12 transition-transform">menu_book</span>
                </div>
                <p class="text-sm text-secondary mt-1 mb-6 flex-grow leading-relaxed line-clamp-3 text-right" dir="auto">
                    ${course.description || 'لم يتم إضافة وصف كورس تفصيلي بعد.'}
                </p>
                
                <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-primary-container group-hover:underline">عرض الفصول والمواد</span>
                    <span class="material-symbols-outlined text-sm text-secondary group-hover:translate-x-[-4px] transition-transform">arrow_back</span>
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

        const hostname = window.location.hostname || 'localhost';
        const response = await fetch(`http://${hostname}:3000/api/news`);
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
            // كرت عريض جداً وسينمائي (الصورة في الأعلى بكامل العرض متبوعة بكامل نص الخبر بالأسفل)
            article.className = "min-w-[290px] md:min-w-[500px] max-w-[500px] bg-white rounded-xl shadow-sm border border-border-subtle hover:border-primary-container/40 transition-all duration-300 overflow-hidden group flex flex-col hover:-translate-y-1 animate-scale-in";

            const fullImgUrl = `http://${hostname}:3000${item.image_path}`;

            article.innerHTML = `
                <div class="w-full h-48 md:h-60 relative overflow-hidden flex items-center justify-center bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <img src="${fullImgUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div class="p-6 flex-grow flex flex-col gap-2 text-right">
                    <h3 class="font-bold text-lg text-primary-container leading-snug" dir="auto">${item.title}</h3>
                    <p class="text-sm text-secondary leading-relaxed mt-1 whitespace-pre-line" dir="auto">${item.content}</p>
                </div>
            `;
            container.appendChild(article);
        });

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
        const hostname = window.location.hostname || 'localhost';
        const backendUrl = `http://${hostname}:3000/api/auth/me`;
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
                    roleBg = 'bg-emerald-650';
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
                        const logoutUrl = `http://${hostname}:3000/api/auth/logout`;
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
                        const pwdUrl = `http://${hostname}:3000/api/auth/change-password`;
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

