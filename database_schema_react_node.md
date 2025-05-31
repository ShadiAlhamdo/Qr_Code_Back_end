# مخطط قاعدة بيانات MongoDB لمشروع ChangToQr

## 1. نظرة عامة

سيتم استخدام قاعدة بيانات MongoDB لتخزين معلومات المستخدمين والروابط التي يقومون بإنشاء رموز QR لها. سيتم استخدام مكتبة Mongoose في تطبيق Node.js للتفاعل مع قاعدة البيانات وتحديد المخططات (Schemas).

## 2. المجموعات (Collections)

سيكون لدينا مجموعتان رئيسيتان:

*   `users`: لتخزين معلومات حسابات المستخدمين.
*   `links`: لتخزين معلومات الروابط التي تم تحويلها إلى رموز QR.

## 3. مخطط مجموعة المستخدمين (`users`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'اسم المستخدم مطلوب'],
        unique: true,
        trim: true,
        minlength: [4, 'يجب أن يكون اسم المستخدم 4 أحرف على الأقل'],
        maxlength: [25, 'يجب ألا يتجاوز اسم المستخدم 25 حرفًا']
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        trim: true,
        lowercase: true,
        // يمكن إضافة تحقق من صحة البريد الإلكتروني باستخدام match أو validate
    },
    password: {
        type: String,
        // مطلوب فقط إذا كان authMethod هو 'manual'
        required: function() { return this.authMethod === 'manual'; },
        minlength: [6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل']
    },
    authMethod: {
        type: String,
        enum: ['manual', 'google'],
        required: true,
        default: 'manual'
    },
    googleId: {
        type: String,
        // مطلوب فقط إذا كان authMethod هو 'google'
        unique: true,
        sparse: true // يسمح بقيم null متعددة ولكن يفرض التفرد على القيم غير الفارغة
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware لتجزئة كلمة المرور قبل الحفظ (للتسجيل اليدوي)
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.authMethod !== 'manual') {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// دالة لمقارنة كلمة المرور المدخلة مع كلمة المرور المجزأة
UserSchema.methods.comparePassword = async function(enteredPassword) {
    if (this.authMethod !== 'manual' || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

**شرح الحقول:**

*   `username`: اسم المستخدم الفريد.
*   `email`: البريد الإلكتروني الفريد للمستخدم.
*   `password`: كلمة المرور المجزأة (مطلوبة فقط للتسجيل اليدوي).
*   `authMethod`: يحدد طريقة المصادقة (`manual` أو `google`).
*   `googleId`: المعرف الفريد للمستخدم من جوجل (مطلوب فقط لمصادقة جوجل).
*   `createdAt`: تاريخ ووقت إنشاء الحساب.

## 4. مخطط مجموعة الروابط (`links`)

```javascript
const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // يشير إلى مجموعة المستخدمين
        required: true
    },
    originalUrl: {
        type: String,
        required: [true, 'الرابط الأصلي مطلوب'],
        trim: true
    },
    // بما أنه لا يوجد Cloudinary، لن نخزن روابط QR هنا بشكل دائم.
    // يمكن تخزين اسم الملف المؤقت إذا تم حفظه على الخادم قبل التنزيل،
    // ولكن بشكل عام، سيتم توليد QR وإرساله مباشرة.
    // qrCodePngFilename: { type: String }, // مثال إذا تم تخزين اسم ملف PNG مؤقتًا
    // qrCodePdfFilename: { type: String }, // مثال إذا تم تخزين اسم ملف PDF مؤقتًا
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Link', LinkSchema);
```

**شرح الحقول:**

*   `userId`: معرف المستخدم الذي قام بإنشاء هذا الرابط (مرتبط بمجموعة `users`).
*   `originalUrl`: الرابط الأصلي الذي أدخله المستخدم.
*   `createdAt`: تاريخ ووقت إنشاء الرابط.

**ملاحظات حول تخزين رموز QR:**

*   بما أنه تم إلغاء استخدام Cloudinary، لن يتم تخزين روابط URL لرموز QR في قاعدة البيانات بشكل دائم.
*   سيتم توليد رموز QR (PNG و PDF) في الواجهة الخلفية عند الطلب وإرسالها مباشرة إلى المستخدم للتنزيل.
*   إذا كان هناك حاجة لتخزين الملفات مؤقتًا على الخادم قبل عملية التنزيل (على سبيل المثال، لتسهيل عملية `send_file` في Express)، يمكن إضافة حقول لأسماء الملفات المؤقتة إلى `LinkSchema` إذا لزم الأمر، ولكن هذا يعتمد على كيفية تنفيذ منطق التنزيل.

## 5. الاعتبارات

*   **الفهرسة (Indexing):** يجب إضافة فهارس مناسبة للحقول التي يتم البحث عنها بشكل متكرر (مثل `email` و `username` في مجموعة `users`، و `userId` في مجموعة `links`) لتحسين أداء الاستعلامات.
*   **التحقق من الصحة (Validation):** تم تضمين بعض قواعد التحقق الأساسية في المخططات. يمكن إضافة المزيد من قواعد التحقق المخصصة حسب الحاجة.
*   **الأمان:** تم تضمين تجزئة كلمة المرور. يجب مراعاة جوانب الأمان الأخرى في التطبيق ككل.

