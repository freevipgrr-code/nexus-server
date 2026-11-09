const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// قواعد بيانات مؤقتة لتخزين المستخدمين والرسائل
let users = [];
let messages = [];

// مسار التحقق وتسجيل الدخول الحقيقي بالبريد الإلكتروني
app.post('/api/login', (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صالح' });
    }

    let user = users.find(u => u.email === email);
    if (!user) {
        user = { email, joinedAt: new Date() };
        users.push(user);
    }

    console.log(`تم تسجيل دخول المستخدم: ${email}`);
    return res.status(200).json({ 
        success: true, 
        message: 'تم تسجيل الدخول بنجاح', 
        email: user.email 
    });
});

// مسار إرسال رسالة جديدة للدردشة الحية
app.post('/api/send', (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ success: false, message: 'بيانات غير مكتملة' });
    }

    const newMessage = { email, message, timestamp: new Date() };
    messages.push(newMessage);

    console.log(`رسالة من ${email}: ${message}`);
    return res.status(200).json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
});

// مسار جلب جميع الرسائل لعرضها في التطبيق
app.get('/api/messages', (req, res) => {
    return res.status(200).json({ success: true, messages });
});

app.listen(PORT, () => {
    console.log(`سيرفر Nexus يعمل بنجاح على المنفذ ${PORT}`);
});
