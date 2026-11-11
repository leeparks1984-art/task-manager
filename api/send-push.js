import admin from 'firebase-admin';

if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokens, title, body } = req.body;
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'No registered push tokens for target user' });
  }

  if (!admin.apps.length) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT environment variable missing' });
  }

  try {
    const uniqueTokens = [...new Set(tokens)];
    const message = {
      notification: { title, body },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          vibrate: [200, 100, 200],
          requireInteraction: true
        }
      },
      tokens: uniqueTokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return res.status(200).json({
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (err) {
    console.error('FCM send error:', err);
    return res.status(500).json({ error: err.message });
  }
}