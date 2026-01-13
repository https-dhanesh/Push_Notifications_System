require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'], 
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

webpush.setVapidDetails(
    'mailto:mr.x.k.404@gmail.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

app.get('/',async(req,response)=>{
    return response.json("This is get");
})

app.post('/subscribe', async (req, res) => {
    const { userId, subscription } = req.body;

    if (!subscription || !subscription.endpoint || !userId) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
        await pool.query(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (endpoint) DO NOTHING`,
            [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
        );
        res.status(201).json({ message: 'Subscription saved' });
    } catch (err) {
        console.error('DB Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/send-notification', async (req, res) => {
    const { userId, title, message } = req.body;

    const result = await pool.query(
        'SELECT * FROM push_subscriptions WHERE user_id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not subscribed' });
    }

    const payload = JSON.stringify({ title, body: message });

    const sendPromises = result.rows.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        try {
            await webpush.sendNotification(pushSubscription, payload);
        } catch (error) {

            if (error.statusCode === 410 || error.statusCode === 404) {
                console.log(`Subscription expired for ${sub.id}, deleting...`);
                await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
            } else {
                console.error('Push error:', error);
            }
        }
    });

    await Promise.all(sendPromises);
    res.json({ success: true, deviceCount: result.rows.length });
});

app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));