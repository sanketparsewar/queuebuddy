// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  "projectId": "engaged-octane-465008-v5",
  "appId": "1:1058223662625:web:784141c1194e70b1196560",
  "apiKey": "AIzaSyB6I91pCxmHRyD1CqWxJec1lhRJEuEu05g",
  "authDomain": "engaged-octane-465008-v5.firebaseapp.com",
  "messagingSenderId": "1058223662625",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Make sure you have an icon or use a generic one
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
