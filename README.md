# Custom Web Push Notification System (Node.js + VAPID)

A robust, full-stack implementation of the **Web Push Protocol (RFC 8292)** built from scratch.

This project demonstrates a custom push notification architecture that manages its own application identity and security. Instead of relying on third-party SDKs for user management, it generates **VAPID Keys** (Voluntary Application Server Identification) for cryptographic signing and stores subscriber endpoints directly in a **PostgreSQL** database.

It is designed to be browser-agnostic and compliant with the IETF Web Push standard.

---

## 🚀 Key Features

* **Custom Identity Management:** Implements VAPID (Voluntary Application Server Identification) to cryptographically sign every notification.
* **Full Data Ownership:** Subscriber endpoints and encryption keys are stored in a local PostgreSQL database, not a third-party cloud console.
* **End-to-End Encryption:** Payloads are encrypted on the server using the client's public key before transmission.
* **Service Worker Integration:** Handles background push events and system notifications even when the web page is closed.
* **Garbage Collection:** Automatically detects and removes expired or invalid subscriptions (HTTP 410 Gone) to keep the database clean.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (Express)
* **Database:** PostgreSQL (`pg` client)
* **Security:** `web-push` library (for Elliptic Curve Cryptography & VAPID signing)
* **Frontend:** HTML5, Native Service Worker API
* **Utilities:** `cors`, `dotenv`

---

## ⚙️ Architecture Workflow

1.  **Subscription:** The Frontend requests permission from the browser and generates a unique Push Subscription Object (Endpoint + Keys).
2.  **Storage:** This subscription object is sent to the Backend API and stored in PostgreSQL.
3.  **Trigger:** An internal event triggers the `/send-notification` route.
4.  **Encryption & Signing:** The Backend retrieves the user's keys, encrypts the message payload, and signs it with the Private VAPID Key.
5.  **Delivery:** The encrypted packet is sent to the browser's Push Service, which wakes up the Service Worker to display the notification.

---

## 📦 Installation & Setup

### 1. Prerequisites
* Node.js (v14+)
* PostgreSQL installed and running
* A created database (e.g., `push_system_db`)

### 2. Clone the Repository
```
git clone [https://github.com/your-username/custom-push-system.git](https://github.com/your-username/custom-push-system.git)
cd custom-push-system
npm install
```

3. Generate VAPID Keys
Generate your unique cryptographic key pair. Run this command once:
```
npx web-push generate-vapid-keys
Note the "Public Key" and "Private Key" from the output.
```
4. Configuration
Create a .env file in the root directory:

```
# Database Connection
DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_database_name

# VAPID Identity Keys (From Step 3)
PUBLIC_VAPID_KEY=paste_your_public_key_here
PRIVATE_VAPID_KEY=paste_your_private_key_here
mailto=admin@yourapp.com
PORT=3000
```

5. Database Initialization
Run the setup script to create the required table (push_subscriptions):
```
CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
CREATE INDEX IF NOT EXISTS idx_user_id ON push_subscriptions(user_id);
```

6. Client Setup
    Open client/index.html and update the PUBLIC_VAPID_KEY constant with your generated Public Key:

JavaScript
```
const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_KEY_FROM_STEP_3';
```
How to Run
To simulate a real production environment , run the backend and frontend in separate terminals.

Terminal 1: Backend API
```
node server.js
```

Terminal 2: Frontend Client (Must be served via HTTP, not file://)
```
cd client
npx http-server -p 8080
```

Testing the System:

    Navigate to http://localhost:8080 in your browser.

    Click "Subscribe" and allow permissions.

    Verify the subscription was saved in your database.

Triggering a Notification:

Send a POST request to your backend to trigger a push alert. You can use Postman or cURL:

```
curl -X POST http://localhost:3000/send-notification \
     -H "Content-Type: application/json" \
     -d '{"userId": "user_123", "title": "Security Alert", "message": "Unusual login detected."}'
```

Troubleshooting:

    Silent Failures: If the logs show success but no popup appears, check your OS settings (Focus Assist/Do Not Disturb) and ensure the browser isn't muting notifications.

    CORS Issues: Ensure your backend cors configuration matches the port your frontend is running on (e.g., port 8080).

    Service Worker Updates: If you change sw.js, remember to check "Update on reload" in Chrome DevTools -> Application -> Service Workers.