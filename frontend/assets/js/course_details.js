/**
 * course_details.js — Dynamic Student Course Chapters & Materials Renderer
 * 
 * Responsibilities:
 *   1. Retrieve course ID from URL query parameters.
 *   2. Fetch course title/description and sections dynamically.
 *   3. Hydrate the DOM with dynamic chapter titles and downloadable materials.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. استخراج معرف الكورس من الـ URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        console.warn('⚠️ معرف الكورس مفقود. جاري إعادة التوجيه للرئيسية...');
        window.location.replace('index.html');
        return;
    }

    // 2. التحقق من المصادقة (Zero-Trust Session Guard):
    // متطلب أمني صارم: نمنع الزوار العامة من الدخول لصفحة تفاصيل الكورس أو تصفح المحتويات.
    // يظهر محتوى الدورات فقط للمستخدمين المسجلين (طلاب ومشرفين).
    try {
        const hostname = window.location.hostname || 'localhost';
        const verifyUrl = `http://${hostname}:3000/api/auth/me`;
        const response = await fetch(verifyUrl, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            // إذا كان المستخدم زائراً غير مصرح له، نطرده فوراً لصفحة تسجيل الدخول
            console.warn('⚠️ محاولة وصول غير مصرح بها. يرجى تسجيل الدخول أولاً للوصول للمواد التعليمية.');
            window.location.replace('login.html');
            return;
        }

        // إذا كان الحساب مسجلاً بنجاح، يتم تحميل وعرض محتويات الفصول حياً
        loadCourseDetails(courseId);

    } catch (error) {
        console.error('❌ خطأ أثناء فحص الجلسة الأمنية:', error);
        window.location.replace('login.html');
    }
});

/**
 * ==============================================================================
 * جلب تفاصيل الكورس وأقسامه ومحاضراته وتصييرها (Hydrate Course Details)
 * ==============================================================================
 */
async function loadCourseDetails(courseId) {
    try {
        const titleHeader = document.getElementById('course-title-header');
        const descParagraph = document.getElementById('course-desc-paragraph');
        const sectionsGrid = document.getElementById('course-sections-grid');

        if (!titleHeader || !descParagraph || !sectionsGrid) return;

        const hostname = window.location.hostname || 'localhost';

        // جلب قائمة الكورسات للبحث عن الكورس المحدد
        const coursesResponse = await fetch(`http://${hostname}:3000/api/courses`);
        if (!coursesResponse.ok) throw new Error('فشل جلب الكورس من السيرفر');

        const courses = await coursesResponse.json();
        const course = courses.find(c => c.course_id == courseId);

        if (!course) {
            titleHeader.innerText = '⚠️ كورس غير مسجل';
            descParagraph.innerText = 'عذراً، لم يتم العثور على الكورس المطلوب في قاعدة بيانات حاضراكس.';
            return;
        }

        // تمييه تفاصيل الكورس الأب
        titleHeader.innerText = course.course_title;
        descParagraph.innerText = course.description || 'لا يوجد وصف تفصيلي متوفر حالياً لهذه الدورة.';

        // 3. جلب الأقسام والفصول التابعة للكورس
        sectionsGrid.innerHTML = `
            <div class="py-12 flex flex-col items-center justify-center text-secondary">
                <span class="material-symbols-outlined animate-spin text-primary-container text-4xl mb-2">progress_activity</span>
                <p class="font-bold text-sm">جاري جلب الفصول والمواد الملحقة بالدورة...</p>
            </div>
        `;

        const sectionsResponse = await fetch(`http://${hostname}:3000/api/courses/${courseId}/sections`);
        if (!sectionsResponse.ok) throw new Error('فشل جلب الأقسام');

        const sections = await sectionsResponse.json();

        if (sections.length === 0) {
            sectionsGrid.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 text-center bg-white border border-border-subtle rounded-2xl shadow-sm animate-scale-in">
                    <span class="material-symbols-outlined text-secondary text-5xl mb-3">folder_open</span>
                    <h4 class="font-bold text-lg text-on-surface mb-1">لا توجد محتويات تعليمية حالياً</h4>
                    <p class="text-sm text-secondary">لم يتم إضافة فصول أو محاضرات تعليمية لهذا الكورس بعد من قبل المشرفين.</p>
                </div>
            `;
            return;
        }

        sectionsGrid.innerHTML = '';

        // 4. المرور الهرمي لجلب المواد الملحقة بكل قسم
        for (const section of sections) {
            const materialsResponse = await fetch(`http://${hostname}:3000/api/materials/section/${section.id}`);
            const materials = materialsResponse.ok ? await materialsResponse.json() : [];

            let materialsHtml = '';

            if (materials.length === 0) {
                materialsHtml = `
                    <div class="col-span-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-border-subtle text-secondary text-sm">
                        <span class="material-symbols-outlined text-[18px]">info</span>
                        <span>لا توجد شيتات أو محاضرات مرفوعة في هذا القسم حالياً.</span>
                    </div>
                `;
            } else {
                materials.forEach(material => {
                    let isVideo = false;
                    let icon = 'description';
                    let iconBg = 'bg-primary-container/10 text-primary-container';
                    let downloadUrl = material.url;

                    if (material.type === 'link') {
                        downloadUrl = material.url;
                        if (material.url.includes('youtube.com') || material.url.includes('youtu.be')) {
                            isVideo = true;
                            icon = 'play_circle';
                            iconBg = 'bg-red-500/10 text-red-500';
                        } else {
                            icon = 'cloud_queue';
                            iconBg = 'bg-yellow-500/10 text-yellow-600';
                        }
                    } else {
                        // ملف مرفوع محلياً
                        downloadUrl = `http://${hostname}:3000${material.url}`;
                        if (material.url.toLowerCase().endsWith('.pdf')) {
                            icon = 'picture_as_pdf';
                            iconBg = 'bg-red-650/10 text-red-650';
                        } else if (material.url.toLowerCase().endsWith('.mp4')) {
                            isVideo = true;
                            icon = 'play_circle';
                            iconBg = 'bg-blue-500/10 text-blue-500';
                        }
                    }

                    if (isVideo) {
                        // كرت الفيديو ذو المظهر البصري المتألق
                        materialsHtml += `
                            <div class="bg-white rounded-xl border border-border-subtle card-shadow overflow-hidden interactive-card group cursor-pointer flex flex-col animate-scale-in">
                                <div class="relative w-full aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <div class="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/35 transition-colors z-10">
                                        <span class="material-symbols-outlined text-white text-5xl opacity-90 group-hover:scale-110 transition-transform drop-shadow-md" style="font-variation-settings: 'FILL' 1;">play_circle</span>
                                    </div>
                                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container/10 to-crimson-muted/40 text-primary-container text-4xl">
                                        <span class="material-symbols-outlined text-[48px]">videocam</span>
                                    </div>
                                </div>
                                <div class="p-4 flex items-center justify-between flex-grow bg-white border-t border-slate-50">
                                    <h4 class="font-bold text-on-surface line-clamp-1 text-[14px] text-right flex-grow" dir="auto">${material.title}</h4>
                                    <a href="${downloadUrl}" target="_blank" class="text-secondary hover:text-primary-container transition-all p-2 rounded-full hover:bg-slate-50 flex-shrink-0" title="مشاهدة الدرس">
                                        <span class="material-symbols-outlined text-[20px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                        `;
                    } else {
                        // كرت الملف/الرابط ثنائي الأبعاد المنسق بـ Flexbox
                        materialsHtml += `
                            <div class="bg-white rounded-xl border border-border-subtle card-shadow p-4 flex items-center justify-between interactive-card group h-20 animate-scale-in">
                                <div class="flex items-center gap-3.5 w-full text-right">
                                    <div class="w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                                    </div>
                                    <div class="flex-grow min-w-0">
                                        <h4 class="font-bold text-on-surface line-clamp-1 text-[14px]" dir="auto">${material.title}</h4>
                                        <p class="text-secondary font-inter text-[10px] mt-0.5" dir="ltr">
                                            ${material.type === 'link' ? 'رابط إلكتروني خارجي' : 'شيت تعليمي معتمد'}
                                        </p>
                                    </div>
                                    <a href="${downloadUrl}" target="_blank" class="text-secondary hover:text-primary-container transition-all p-2 rounded-full hover:bg-slate-50 flex-shrink-0" title="تحميل الملف">
                                        <span class="material-symbols-outlined text-[20px]">download</span>
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                });
            }

            const sectionBlock = document.createElement('section');
            sectionBlock.className = 'animate-scale-in';
            sectionBlock.innerHTML = `
                <div class="flex items-center gap-4 mb-5 text-right">
                    <h3 class="text-xl font-extrabold text-slate-800 whitespace-nowrap">${section.title}</h3>
                    <div class="h-px bg-border-subtle w-full"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${materialsHtml}
                </div>
            `;
            sectionsGrid.appendChild(sectionBlock);
        }

    } catch (error) {
        console.error('Error loading course details:', error);
        const sectionsGrid = document.getElementById('course-sections-grid');
        if (sectionsGrid) {
            sectionsGrid.innerHTML = `
                <div class="py-8 flex flex-col items-center justify-center bg-red-50 border border-red-200 text-red-600 rounded-2xl">
                    <span class="material-symbols-outlined text-3xl mb-1">error</span>
                    <p class="font-bold">فشل جلب فصول ومحاضرات الدورة: ${error.message}</p>
                </div>
            `;
        }
    }
}
