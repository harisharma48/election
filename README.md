# 🗳️ Nepal Federal Parliament Election — Vote Tracker

A real-time election vote tracking website for Nepal's Pratinidhi Sabha (Federal Parliament).
Vote counts are stored in **Firebase Firestore** so multiple users on different devices can view and update results simultaneously.

## Features

- Cascading dropdowns: **Province → District → Constituency**
- All 7 provinces, 77 districts, and 165 constituencies pre-populated
- **Real-time updates** via Firestore `onSnapshot` — no page refresh needed
- Add new candidates and update vote counts
- **Offline support** — works even with spotty internet (cached data)
- Online / offline status indicator
- Admin section (commented out by default)

---

## 🚀 Setup — Getting Started

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the wizard
3. Disable Google Analytics if you don't need it → Click **Create project**

### Step 2 — Register a Web App

1. In the Firebase console, click the **Web** icon (`</>`) on the project overview page
2. Enter an app nickname (e.g. `election-tracker`) → Click **Register app**
3. Copy the `firebaseConfig` object shown — you will paste this into `script.js`

### Step 3 — Enable Firestore

1. In the Firebase console sidebar, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (allows all reads/writes for 30 days — fine for development)
4. Select a Cloud Firestore location (e.g. `asia-south1` for Asia) → Click **Enable**

### Step 4 — Update `script.js`

Open `script.js` and replace the placeholder values in `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY_HERE",           // ← replace
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com", // ← replace
  projectId:         "YOUR_PROJECT_ID_HERE",        // ← replace
  storageBucket:     "YOUR_PROJECT_ID.appspot.com", // ← replace
  messagingSenderId: "YOUR_SENDER_ID_HERE",         // ← replace
  appId:             "YOUR_APP_ID_HERE"             // ← replace
};
```

### Step 5 — Open the website

Open `index.html` in your browser (or serve it with any static file server).
The yellow warning banner will disappear once the config values are replaced.

---

## 🔥 Firestore Security Rules

After initial testing, replace the default permissive rules with these in **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read
    match /constituencies/{docId}/candidates/{candidateId} {
      allow read: true;
      allow write: if request.auth != null;  // only authenticated users can write
    }
  }
}
```

> **Note:** For a fully public write setup (no login required), you can use `allow write: true;`
> during development. Switch to auth-restricted rules before going public.

---

## 🌱 Initialise Sample Data

After configuring Firebase, open `index.html` in your browser, open the **browser console** (F12),
and run:

```javascript
initializeSampleData()
```

This will populate Firestore with sample candidates for:
- **Kathmandu** Constituency 1 & 2
- **Lalitpur** Constituency 1

Then select **Bagmati Province → Kathmandu → Constituency 1** and click **Search** to see live data.

---

## 🔒 Enabling Admin Mode

The admin login section is **commented out** by default. To enable it:

1. Enable **Firebase Authentication** in the console: **Build → Authentication → Sign-in method → Email/Password**
2. Create an admin user: **Authentication → Users → Add user**
3. In `script.js`, uncomment the admin section (the block wrapped in `/* ... */` near the bottom)
4. Add the admin UI elements to `index.html` (email/password inputs + login/logout buttons)

When admin mode is active, only authenticated admin users can update votes or add candidates.
Regular visitors can only view results.

---

## 📁 Database Structure

```
constituencies (collection)
  └── {province}_{district}_{number}  (document)
        └── candidates (subcollection)
              └── {auto-id}  (document)
                    ├── name:    "Ram Sharma"
                    ├── party:   "Nepali Congress"
                    ├── votes:   12500
                    └── addedAt: timestamp
```

---

## 🛠️ Tech Stack

- Pure **HTML / CSS / JavaScript** — no build tools, no npm, no frameworks
- **Firebase Firestore** (compat v9 SDK via CDN) for real-time database
- Offline persistence via `db.enablePersistence()`

