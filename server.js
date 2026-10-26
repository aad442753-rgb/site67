const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Включаем доверие прокси (нужно для реальных хостингов и корректного чтения IP)
app.set('trust proxy', true);

app.use(express.json());
app.use(express.static('public'));

const logsDir = path.join(__dirname, 'visitor_logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

app.post('/api/save', (req, res) => {
    const data = req.body;
    
    // Получаем реальный IP с учетом заголовков прокси или прямого подключения
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Очищаем IPv6-префикс, если он есть (например, превращаем ::ffff:192.168.1.1 в 192.168.1.1)
    if (clientIp && clientIp.includes('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(logsDir, `visitor_${timestamp}.txt`);

    const fileContent = `
=== ДАННЫЕ ПОСЕТИТЕЛЯ ===
Дата/Время: ${new Date().toLocaleString()}
IP-адрес: ${clientIp}
User-Agent (Устройство): ${data.userAgent || 'Неизвестно'}
Разрешение экрана: ${data.screenResolution || 'Неизвестно'}
Язык: ${data.language || 'Неизвестно'}
    `.trim();

    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        res.json({ success: true, message: 'Данные записаны' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Откройте http://localhost:${PORT}`);
});