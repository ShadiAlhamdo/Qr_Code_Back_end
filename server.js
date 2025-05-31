const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config();

// إنشاء تطبيق Express
const app = express();

// الإعدادات الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://changtoqr.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// توصيل قاعدة البيانات MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/changtoqr_db')
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات MongoDB بنجاح');
  })
  .catch((err) => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
    process.exit(1);
  });

// تسجيل المسارات
const authRoutes = require('./src/routes/auth.routes');
const linksRoutes = require('./src/routes/links.routes');

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);

// اختبار الخادم
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'الخادم يعمل بشكل جيد' });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'حدث خطأ في الخادم' });
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
