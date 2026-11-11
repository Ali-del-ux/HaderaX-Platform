@echo off
chcp 65001 >nul
echo ======================================================================
echo    🚀 تجهيز منصة حاضراكس - جامعة الحاضرة (HaderaX Platform Setup)
echo ======================================================================
echo.

:: 1. التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] خطأ: Node.js غير مثبت على جهازك! يرجى تثبيته أولاً من https://nodejs.org
    pause
    exit /b 1
)

:: 2. الانتقال لمجلد الباك إند وتثبيت الحزم
echo [1/3] تثبيت حزم ومكتبات الخادم (Backend Dependencies)...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [X] خطأ أثناء تثبيت مكتبات Node.js!
    cd ..
    pause
    exit /b 1
)
cd ..

:: 3. إنشاء ملف البيئة .env إن لم يكن موجوداً
echo [2/3] فحص إعدادات الاتصال بقاعدة البيانات (.env)...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo [!] تم إنشاء ملف backend\.env بنجاح. يرجى تعديل كلمة مرور MySQL إن لزم الأمر.
) else (
    echo [V] ملف backend\.env موجود مسبقاً ومُعد.
)

:: 4. زراعة المشرفين والطلاب في قاعدة البيانات (Seeding)
echo [3/3] تهيئة جداول قاعدة البيانات والحسابات الافتراضية...
cd backend
node scripts/seedAdmin.js
node scripts/importStudents.js
cd ..

echo.
echo ======================================================================
echo    ✅ اكتملت عملية التجهيز بنجاح! يمكنك الآن تشغيل المنصة بملف: start.bat
echo ======================================================================
echo.
pause
