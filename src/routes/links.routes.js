const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// إنشاء رمز QR من رابط (بدون مصادقة للعرض التوضيحي)
router.post('/generate-qr', async (req, res) => {
  try {
    const { url } = req.body;
    
    // التحقق من وجود الرابط
    if (!url) {
      return res.status(400).json({ message: 'الرجاء إدخال رابط' });
    }
    
    // التحقق من صحة تنسيق الرابط
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ message: 'الرجاء إدخال رابط صحيح' });
    }
    
    // إنشاء رمز QR كـ Buffer
    const qrBuffer = await QRCode.toBuffer(url);
    
    // إرجاع معرف الرابط والرمز كـ base64
    res.status(201).json({
      linkId: Date.now().toString(), // استخدام الطابع الزمني كمعرف مؤقت
      qrCode: `data:image/png;base64,${qrBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('خطأ في إنشاء رمز QR:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء رمز QR' });
  }
});

// تنزيل رمز QR بصيغة PNG
router.get('/:id/download-png', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ message: 'الرابط مطلوب' });
    }
    
    // إنشاء رمز QR كـ Buffer
    const qrBuffer = await QRCode.toBuffer(url);
    
    // إعداد الاستجابة
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qrcode-${req.params.id}.png"`
    });
    
    // إرسال البيانات
    res.send(qrBuffer);
  } catch (error) {
    console.error('خطأ في تنزيل رمز QR بصيغة PNG:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تنزيل رمز QR' });
  }
});

// تنزيل رمز QR بصيغة PDF
router.get('/:id/download-pdf', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ message: 'الرابط مطلوب' });
    }
    
    // إنشاء رمز QR كـ Buffer
    const qrBuffer = await QRCode.toBuffer(url);
    
    // إنشاء ملف PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 500]);
    
    // تحويل Buffer إلى صورة PNG في PDF
    const pngImage = await pdfDoc.embedPng(qrBuffer);
    const { width, height } = pngImage.scale(0.5);
    
    // رسم الصورة في وسط الصفحة
    page.drawImage(pngImage, {
      x: (page.getWidth() - width) / 2,
      y: (page.getHeight() - height) / 2,
      width,
      height,
    });
    
    // إضافة الرابط الأصلي كنص
    const fontSize = 12;
    page.drawText(`الرابط: ${url}`, {
      x: 50,
      y: 50,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    
    // حفظ PDF كـ Buffer
    const pdfBytes = await pdfDoc.save();
    
    // إعداد الاستجابة
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="qrcode-${req.params.id}.pdf"`
    });
    
    // إرسال البيانات
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('خطأ في تنزيل رمز QR بصيغة PDF:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تنزيل رمز QR' });
  }
});

module.exports = router;
