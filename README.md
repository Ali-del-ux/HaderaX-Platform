# 🏛️ منصة حاضراكس | HaderaX Platform
### البوابة الأكاديمية والتقنية الموحدة — جامعة الحاضرة (University of Alhadera)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](#)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-CDN-06B6D4?logo=tailwindcss&logoColor=white)](#)
[![Design System](https://img.shields.io/badge/Design_System-Obsidian_Pro-09090B)](#)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_AAA-10B981)](#)

---

## 📖 نظرة عامة عن المشروع (Project Overview)

منصة **حاضراكس (HaderaX)** هي النظام الرقمي المتكامل لنادي البرمجة والابتكار في **جامعة الحاضرة**، صُممت لتوفير بيئة تدريبية وهندسية متقدمة تلبي أعلى المعايير التقنية والأكاديمية المعاصرة. تجمع المنصة بين:

1. **إدارة المحتوى الأكاديمي والمناهج (Curriculum & Materials):** نظام إدارة محاضرات، مراجع، وسائط تعليمية، وورش عمل مع معالجة آمنة للملفات.
2. **الحضور الذكي المشفر بالـ QR Code:** جلسات حضور متغيرة ومحدثة ديناميكياً تمنع التلاعب وتتيح توثيقاً لحظياً للطلاب.
3. **لوحة إشراف متعددة الصلاحيات (Granular RBAC Portal):** إدارة الطلاب، توزيع الأدوار، وإحصائيات الحضور والنشاط الأكاديمي.
4. **هوية بصرية معمارية (Obsidian Pro):** نظام تصميمي أحادي التباين (Minimalist Monochrome) مستوحى من واجهات كبرى شركات البرمجيات العالمية (Vercel و Linear)، مع الحفاظ على شعار القلعة الذهبي كجوهرة للعلامة.

---

## ⚡ التشغيل السريع بأمر واحد (One-Click Setup)

لتسهيل تجربة المنصة دون أي تعقيد، تم توفير ملفات تشغيل مؤتمتة بالكامل في جذر المشروع:

### 🚀 الطريقة المباشرة (Windows 1-Click):
فقط اضغط نقراً مزدوجاً على الملف:
```cmd
start.bat
```
> **ما يفعله هذا الأمر تلقائياً:**
> 1. يفحص تثبيت Node.js.
> 2. يقوم بتنصيب مكتبات الباك إند (`npm install`) تلقائياً.
> 3. ينشئ ملف `.env` إن لم يكن متوفراً.
> 4. يزرع حسابات المشرفين والطلاب في قاعدة البيانات (`seedAdmin` & `importStudents`).
> 5. يشغل خادم Node.js ويفتح المتصفح تلقائياً على `http://localhost:3000`.

---

## 🛠️ التنصيب والتشغيل اليدوي (Manual Developer Setup)

إذا كنت تفضل الإعداد اليدوي عبر موجه الأوامر:

### 1. استنساخ المستودع (Clone Repository):
```bash
git clone https://github.com/Ali-del-ux/HaderaX-Platform.git
cd HaderaX-Platform
```

### 2. تثبيت مكتبات الخادم (Install Dependencies):
```bash
cd backend
npm install
```

### 3. إعداد متغيرات البيئة (Environment Configuration):
انسخ ملف الإعدادات وأدخل بيانات خادم MySQL لديك:
```bash
cp .env.example .env
```
محتوى ملف `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=saraya_club_db
PORT=3000
NODE_ENV=development
```

### 4. تهيئة وزراعة قاعدة البيانات (Database Seeding):
```bash
node scripts/seedAdmin.js
node scripts/importStudents.js
```

### 5. إطلاق الخادم (Start Server):
```bash
node server.js
```
افتح المتصفح على: **`http://localhost:3000`**

---

## 🛡️ بيانات تسجيل الدخول الافتراضية (Default Credentials)

> 💡 **ملاحظة:** يتم تسجيل الدخول برقم القيد (`student_id`) وكلمة المرور الافتراضية الموحدة لجميع الحسابات هي: **`123456`**

### 1. حسابات الإدارة والمشرفين (Admins):
| الدور الأكاديمي | رقم القيد (للدخول) | البريد الجامعي | الصلاحيات |
| :--- | :--- | :--- | :--- |
| **المشرف العام (Super Admin)** | `admin` | `admin@haderax.edu.ly` | كامل صلاحيات النظام |
| **مشرف شؤون الطلاب (Students Admin)** | `admin_students` | `admin_students@haderax.edu.ly` | إدارة الطلاب والغياب والـ QR |
| **مشرف شؤون المناهج (Curriculum Admin)** | `admin_curriculum` | `admin_curriculum@haderax.edu.ly` | إدارة المواد والكورسات والأخبار |

### 2. عينة من حسابات الطلاب (Sample Students):
| اسم الطالب | رقم القيد (للدخول) | كلمة المرور |
| :--- | :--- | :--- |
| تسنيم وجدي غالب | `2450150` | `123456` |
| محمد جمال نجاح | `2450113` | `123456` |
| عبد المهيمن بريدان | `2450103` | `123456` |
| طه الهادي المليتي | `2450061` | `123456` |
| سيف الدين العريفي | `2230001` | `123456` |

---

## 🏗️ البنية المعمارية وهندسة النظام (System Architecture)

```
HaderaX-Platform/
├── frontend/                     # واجهات المستخدم (SPA Vanilla JS + Tailwind)
│   ├── assets/
│   │   ├── branding/             # حزمة شعارات وأيقونات حاضراكس (SVG/ICO/PNG)
│   │   ├── css/style.css         # التنسيقات العامة والـ Micro-Interactions
│   │   └── js/
│   │       ├── tailwind-config.js# إعدادات الـ Tokens ونظام الألوان المعتمد
│   │       ├── admin.js          # منطق لوحة الإشراف والتفاعل مع الـ API
│   │       └── translations.js   # قاموس الترجمة المزدوج (عربي / English)
│   ├── index.html                # البوابة الرئيسية للتعريف بالمنصة والأنشطة
│   ├── login.html                # بوابة الدخول الآمنة مع واجهة زجاجية
│   ├── admin_portal.html         # لوحة الإدارة الشاملة للمشرفين
│   ├── course-details.html       # صفحة استعراض محتوى المسارات والكورسات
│   ├── forgot-password.html      # طلب استرداد كلمة المرور عبر البريد الجامعي
│   ├── reset-password.html       # إدخال وتأكيد كلمة المرور الجديدة
│   └── theme_comparison.html     # أداة المقارنة البصرية المباشرة للألوان
│
├── backend/                      # خادم التطبيقات وقواعد البيانات (MVC Node.js)
│   ├── config/db.js              # مجمع اتصالات MySQL (Connection Pool)
│   ├── controllers/              # وحدات التحكم المنطقية (Auth, Courses, Attendance)
│   ├── middleware/               # فلاتر الحماية (JWT Cookie Auth & RBAC Guard)
│   ├── routes/                   # نقاط الـ RESTful API الموحدة
│   ├── scripts/                  # أدوات سطر الأوامر للتهيئة والاستيراد
│   ├── utils/logger.js           # نظام التوثيق الأمني (Winston Logger)
│   ├── .env.example              # نموذج متغيرات البيئة
│   └── server.js                 # نقطة الدخول الرئيسية للخادم (Port 3000)
│
├── start.bat                     # مشغل التشغيل التلقائي بنقرة واحدة
├── setup.bat                     # مثبت البيئة والمكتبات بنقرة واحدة
├── vercel.json                   # إعدادات النشر السحابي على منصة Vercel
└── README.md                     # التوثيق التقني الشامل للمشروع
```

---

## 🔐 ركائز الأمان المطبقة (Security Architecture)

1. **الحماية ضد حقن الأوامر (SQL Injection Prevention):** جميع استعلامات قواعد البيانات مبنية بـ Prepared Statements مع التمرير المعلماتي (`?`).
2. **تأمين الجلسات ورمز التحقق (HttpOnly Cookie JWT):** منع هجمات XSS عبر حظر تخزين التوكن في LocalStorage وحفظه في HttpOnly Cookie مشفر.
3. **التحكم الصارم في الصلاحيات (Role-Based Access Control):** عزل تام لمسارات الإدارة مع تدقيق رتبة المستخدم (`requireSuperAdmin`, `requireStudentsAdmin`, `requireCurriculumAdmin`).
4. **جدار حماية رفع الملفات (Multer Upload Firewall):** تقييد امتدادات الملفات ومنع رفع الملفات القابلة للتنفيذ (Executables/Shells) وتحديد سقف الحجم بـ 50MB.
5. **تشفير كلمات المرور (Bcrypt Hashing):** تشفير غير قابل للعكس بـ 10 جولات تمليح (Salt Rounds).
6. **سجل تدقيق أمني متكامل (Winston Audit Logs):** توثيق كل طلب HTTP وعناوين الـ IP والمحاولات المشبوهة في ملفات `combined.log` و `error.log`.

---

## 🎨 هوية التصميم (Obsidian Pro Design System)

* **الألوان الأساسية (Primary):**
  - أسود أوبسيديان فاحم (`#09090B` / `#18181B`) للأزرار الرئيسية والتباين العالي.
  - رمادي زنك محايد (`#52525B` / `#71717A`) للنصوص المساعدة والحدود.
* **الذهب الأكاديمي (Brand Accent):**
  - ذهب الحاضرة الدافئ (`#F59E0B` / `#FCD34D`) مخصص حصرياً للقلعة في الشعار وشارات التميز فقط، لإلغاء أي صراع لوني.
* **الخطوط الرسمية (Typography):**
  - خط **Alexandria** للعناوين الرئيسية والنصوص العربية.
  - خط **Outfit** للأرقام والرموز اللاتينية.
  - خط **JetBrains Mono** لأرقام القيود والأكواد.

---

## 📜 الترخيص والملكية (License & Credits)

* **الجهة الأكاديمية:** جامعة الحاضرة — University of Alhadera.
* **إدارة المنصة:** نادي البرمجة والابتكار التقني.
* **حقوق التصميم والبرمجة:** محفوظة © 2026.
