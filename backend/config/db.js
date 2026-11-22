const mysql = require('mysql2/promise');
const path = require('path');

// تحميل المتغيرات البيئية من المجلد السابق (backend) لضمان عدم حدوث خطأ عند الاستيراد
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 1. Create the connection pool targeting our specific database
// The pool is created synchronously so it can be exported immediately.
const isTidb = Boolean(process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com'));
const useSsl = process.env.DB_SSL === 'true' || isTidb;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'haderax_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

/**
 * Initializes the database and required tables.
 * This runs automatically when the file is required.
 */
async function initializeDatabase() {
    try {
        // 2. Initial connection check / DB creation for local environments
        const isLocal = !process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
        if (isLocal) {
            try {
                const connection = await mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || ''
                });
                const targetDb = process.env.DB_NAME || 'haderax_db';
                await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\`;`);
                await connection.end();
            } catch (localDbErr) {
                // If DB exists or user has restricted permissions, proceed to pool
            }
        }

        // 4. Create the Users table with the exact specified schema using the pool
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE,
                Name VARCHAR(100),
                birth_year INT,
                Password_hash VARCHAR(255),
                role VARCHAR(50),
                reset_token VARCHAR(255) NULL,
                reset_token_expires DATETIME NULL
            );
        `);
        console.log('✅ Users table ready.');

        // ترقية علائقية: إضافة عمود سنة الميلاد في حال كان الجدول منشأً مسبقاً وبنية البيانات قديمة
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Users LIKE 'birth_year'");
            if (columns.length === 0) {
                console.log('⚠️ تم اكتشاف بنية قديمة لجدول Users. جاري إضافة عمود سنة الميلاد (birth_year)...');
                await pool.query('ALTER TABLE Users ADD COLUMN birth_year INT AFTER Name');
                console.log('✅ تم إضافة عمود سنة الميلاد بنجاح.');
            }
        } catch (migrationError) {
            console.error('❌ فشل ترقية جدول Users:', migrationError.message);
        }

        // ترقية أمنية: إضافة حقول استعادة كلمة المرور لجدول Users تلقائياً في حال البيانات القائمة
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Users LIKE 'reset_token'");
            if (columns.length === 0) {
                console.log('⚠️ تم اكتشاف بنية قديمة لجدول Users. جاري إضافة أعمدة استعادة كلمة المرور (reset_token)...');
                await pool.query('ALTER TABLE Users ADD COLUMN reset_token VARCHAR(255) NULL, ADD COLUMN reset_token_expires DATETIME NULL');
                console.log('✅ تم إضافة أعمدة استعادة كلمة المرور بنجاح.');
            }
        } catch (migrationError) {
            console.error('❌ فشل ترقية جدول Users لحقول الاستعادة:', migrationError.message);
        }

        // 5. Create Courses table (No dependencies)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Courses (
                course_id INT AUTO_INCREMENT PRIMARY KEY,
                course_title VARCHAR(255),
                description TEXT,
                image_url VARCHAR(255)
            );
        `);
        console.log('✅ Courses table ready.');

        // Create Course_Sections table (Depends on Courses)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Course_Sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                title VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Course_Sections table ready.');

        // 6. Create News table (No dependencies)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS News (
                news_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                content TEXT,
                image_path VARCHAR(255)
            );
        `);
        console.log('✅ News table ready.');

        // 7. Create Materials table (Depends on Course_Sections)
        // خطوة دفاعية: التحقق من بنية جدول المواد القديم لترقيته إلى الهرمية العلائقية الصحيحة
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Materials LIKE 'section_id'");
            if (columns.length === 0) {
                console.log('⚠️ تم اكتشاف بنية جدول المواد القديم. جاري حذفه وإعادة إنشائه لربطه بالأقسام علائقياً...');
                await pool.query('DROP TABLE IF EXISTS Materials');
            }
        } catch (e) {
            // الجدول غير موجود أصلاً، لا توجد مشكلة
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Materials (
                material_id INT AUTO_INCREMENT PRIMARY KEY,
                section_id INT,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (section_id) REFERENCES Course_Sections(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Materials table ready.');

        // 8. Create Security_Logs table (Depends on Users)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Security_Logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255),
                ip_address VARCHAR(45),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Security_Logs table ready.');

        // 9. Create Attendance_Sessions table (Linked to Courses)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Attendance_Sessions (
                session_id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NULL,
                session_title VARCHAR(255) NOT NULL,
                session_description TEXT,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE SET NULL
            );
        `);
        console.log('✅ Attendance_Sessions table ready.');

        // ترقية علائقية: ربط جدول الجلسات بالكورسات في حال كان منشأ مسبقاً بدون course_id
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Attendance_Sessions LIKE 'course_id'");
            if (columns.length === 0) {
                console.log('⚠️ تم اكتشاف بنية قديمة لجدول Attendance_Sessions. جاري إضافة عمود course_id...');
                await pool.query('ALTER TABLE Attendance_Sessions ADD COLUMN course_id INT NULL, ADD FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE SET NULL');
                console.log('✅ تم ربط Attendance_Sessions بالكورسات بنجاح.');
            }
        } catch (migrationError) {
            console.error('❌ فشل ترقية جدول Attendance_Sessions:', migrationError.message);
        }

        // خطوة دفاعية: التحقق من بنية جدول الحضور القديم وإعادة إنشائه ليرتبط بالجلسات ديناميكياً
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Attendance LIKE 'session_id'");
            if (columns.length === 0) {
                console.log('⚠️ تم اكتشاف بنية قديمة لجدول الحضور. جاري إعادة تهيئته لربطه بالجلسات التفاعلية الـ QR...');
                await pool.query('DROP TABLE IF EXISTS Attendance');
            }
        } catch (e) {
            // الجدول غير موجود أصلاً
        }

        // 10. Create Attendance table (Depends on Users and Attendance_Sessions)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Attendance (
                attendance_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                session_id INT,
                date DATE,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES Attendance_Sessions(session_id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Attendance table ready.');

        // ترقية لحظية: إضافة عمود created_at لجدول الحضور لتسجيل توقيت المسح بالدقيقة والثانية
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM Attendance LIKE 'created_at'");
            if (columns.length === 0) {
                console.log('⚠️ جاري إضافة عمود created_at لجدول Attendance لتتبع وقت المسح اللحظي...');
                await pool.query('ALTER TABLE Attendance ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
                console.log('✅ تم إضافة عمود created_at بنجاح.');
            }
        } catch (migrationError) {
            console.error('❌ فشل ترقية جدول Attendance لوقت المسح:', migrationError.message);
        }
        
        console.log('🚀 All database tables initialized successfully.');

    } catch (error) {
        console.warn('⚠️ Database Warning: Could not connect to MySQL (' + (error.message || error.code) + ').');
        console.warn('ℹ️ Running in frontend-first mode: static assets and UI will be served.');
    }
}

// Execute the initialization function
initializeDatabase();

// 5. Export the pool for use in other parts of the application (e.g., auth controllers)
module.exports = pool;
