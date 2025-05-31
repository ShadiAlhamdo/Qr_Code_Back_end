const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// نموذج مبسط للمستخدم (في الإنتاج، يجب استخدام نموذج Mongoose)
const users = [];

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // التحقق من البيانات
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
    
    // التحقق من عدم وجود المستخدم مسبقًا
    const userExists = users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // إنشاء مستخدم جديد
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    // حفظ المستخدم (في الإنتاج، يجب حفظه في قاعدة البيانات)
    users.push(newUser);
    
    // إنشاء رمز JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '30d' }
    );
    
    // إرجاع البيانات
    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      token
    });
  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل المستخدم' });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من البيانات
    if (!email || !password) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
    
    // البحث عن المستخدم
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    
    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    
    // إنشاء رمز JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '30d' }
    );
    
    // إرجاع البيانات
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

module.exports = router;
