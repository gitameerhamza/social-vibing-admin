---
name: social-vibing-app
description: "React Native (Expo) main app for the Social Vibing platform. Firebase/Firestore backend, Hostinger media uploads, real-time chat, communities, marketplace, voice/video calls via Agora, and virtual coin economy. Key stacks: Expo SDK 54, React Native 0.81, Firebase 12, React Navigation (Stack + Bottom Tabs), Hostinger media hosting."
---

# Social Vibing Main App — Project Skill File (for Admin App Reference)

Complete reference for AI agents working on the admin app who need to understand the **main Social Vibing app** and avoid breaking shared schemas.

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Name** | `social-vibing-app` |
| **Location** | `/Users/ameerhamza/Developer/social-vibing-app` |
| **Type** | React Native mobile social platform |
| **Framework** | Expo SDK 54 (`expo ~54.0.27`) |
| **React Native** | 0.81.5 |
| **React** | 19.1.0 |
| **Backend** | Firebase (Firestore, Auth) — same project `social-vibing-karr` |
| **Media** | Hostinger (NOT Cloudinary like admin app) |
| **Language** | JavaScript (no TypeScript) |
| **Entry Point** | `App.js` |

---

## 2. Shared Firestore Collections

Both apps share these collections. Any schema change needs coordination:

### User Document (`users/{uid}`) — Moderation Fields
```javascript
{
  role: 'admin' | 'user',          // Admin role flag — BOTH apps check this
  isAdmin: boolean,                 // Alternative admin flag
  isVerified: boolean,              // Age verification (17+)
  verificationStatus: 'pending' | 'verified' | 'rejected',
  isBanned: boolean,
  banType: string, banReason: string, bannedAt: timestamp, banExpiresAt: timestamp, bannedBy: string,
  isSuspended: boolean,
  suspendedReason: string, suspendedAt: timestamp, suspendedBy: string,
  warnings: array, warningsCount: number,
  accountStatus: string,            // 'active' | 'banned' | 'suspended'
  reportsReceived: number,
}
```

### Reports (`reports/{id}`)
Full report document schema — used by admin app's moderation pipeline.

### Admin Actions (`admin_actions/{id}`)
Immutable audit log — Firestore rules block updates/deletes.

### Communities (`communities/{id}`)
Key admin-relevant fields: `creatorId`, `moderators`, `members`, `memberCount`, `isDisabled`, `disabledAt`, `disabledBy`, `disabledReason`

### Content Soft-Delete Convention
All content types use: `isDeleted`, `deletedAt`, `deletedBy`, `deletionReason`

### Admin-Only Collections
`advertisements`, `blocked_content`, `blocked_members`, `join_requests`, `management_records`

---

## 3. Main App Features to Be Aware Of

- **Real-time chat** with Firestore listeners
- **Communities** with posts, polls, quizzes, blogs
- **Marketplace** with products, seller stores, wallet, IAP
- **Voice/Video calls** via Agora
- **Stories** (ephemeral content)
- **Virtual coin economy** (coins + diamonds)
- **Push notifications** via Firebase Cloud Messaging

---

## 4. Key Technical Differences

| Aspect | Main App | Admin App |
|--------|----------|-----------|
| Media Uploads | Hostinger (`hostingerConfig.js`) | Cloudinary (`cloudinary.js`) |
| UI Library | Custom components | react-native-paper |
| Navigation | `createStackNavigator` + Bottom Tabs | Drawer + Bottom Tabs + Native Stack |
| State | `WalletContext`, `StatusContext` | Local `useState` only |
| Firestore Access | Retry/cache helpers (`firestoreHelpers.js`) | Direct SDK calls |
| Admin Auth | Enforces ban/suspend on login | Checks `role === 'admin'` |

---

## 5. Rules for Modifying Shared Data

1. **Never rename** moderation fields on `users/{uid}` — the main app checks these on every login
2. **Never change** the `reports` document structure without updating `ReportUserModal` in main app
3. **Never modify** Firestore rules `isAdmin()` helper — both apps depend on it
4. **Content deletion**: Always use soft-delete (`isDeleted: true`) — the main app filters by this field
5. **Community changes**: Don't restructure `moderators` array or `creatorId` — main app's permission checks depend on these
