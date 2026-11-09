const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// قواعد البيانات المؤقتة في الذاكرة
let users = [];          // لحفظ الحسابات التي تم إنشاؤها نهائياً
let pendingCodes = {};   // لحفظ الأكواد المؤقتة لكل بريد أثناء عملية التحقق

// إعداد خدمة إرسال الإيميلات (ضع بريدك وكلمة مرور التطبيق App Password هنا)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // استبدله بريدك الحقيقي
        pass: 'your-app-password'    // كلمة مرور التطبيق من إعدادات جوجل
    }
});

// 1. مسار إرسال البريد والتحقق هل هو مسجل مسبقاً أم لا
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صالح' });
    }

    // التحقق هل البريد مسجل مسبقاً في النظام
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'هذا البريد مستخدم مسبقاً ولديه حساب بالفعل!' });
    }

    // توليد رمز تحقق عشوائي من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingCodes[email] = otpCode;

    // إرسال الإيميل للمستخدم
    const mailOptions = {
        from: 'nexus-chat@gmail.com',
        to: email,
        subject: 'رمز التحقق الخاص بك لتطبيق Nexus Chat',
        text: `رمز التحقق الخاص بك هو: ${otpCode} \nيرجى إدخاله في التطبيق لإتمام إنشاء الحساب.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`تم إرسال الرمز ${otpCode} إلى: ${email}`);
        return res.status(200).json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
    } catch (error) {
        console.error('خطأ في الإرسال:', error);
        return res.status(500).json({ success: false, message: 'فشل إرسال البريد، تحقق من إعدادات السيرفر' });
    }
});

// 2. مسار التحقق من الكود المدخل وإنشاء الحساب نهائياً
app.post('/api/verify-otp', (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ success: false, message: 'بيانات غير مكتملة' });
    }

    // التحقق من صحة الكود
    if (pendingCodes[email] && pendingCodes[email] === code) {
        // حذف الرمز بعد استخدامه
        delete pendingCodes[email];

        // حفظ المستخدم نهائياً في قائمة المستخدمين
        users.push({ email, createdAt: new Date() });

        console.log(`تم إنشاء حساب جديد بنجاح للبريد: ${email}`);
        return res.status(200).json({ success: true, message: 'تم التحقق وإنشاء الحساب بنجاح!' });
    } else {
        return res.status(400).json({ success: false, message: 'الرمز خاطئ، تأكد من الأرقام وحاول مجدداً.' });
    }
});

app.listen(PORT, () => {
    console.log(`سيرفر Nexus يعمل بنجاح على المنفذ ${PORT}`);
});
