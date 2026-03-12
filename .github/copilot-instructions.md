# Social Vibing Admin Panel – Copilot Instructions

## Project Overview
**Social Vibing Admin** is a React Native + Expo admin panel for the Social Vibing social platform. It manages communities, users, reports, verification, bans, content moderation, advertisements, and permissions.

## Architecture

### Directory Layout
```
/                        # Root files: App.js, firebaseConfig.js, cloudinary.js
components/              # Reusable UI (Theme.js color constants, ListRow, PillButton, SectionHeader)
navigation/              # DrawerSidebar.js + StackScreens.js (bottom tabs + all stack screens)
screens/                 # All screen components (25+ screens)
services/                # reportService.js — Firestore report CRUD, subscriptions, admin actions
scripts/                 # CLI scripts: setAdmin.js, checkAdminRole.js
styles/                  # styles.js — shared StyleSheet (s object)
data/                    # mock.js — mock data for development
assets/                  # Static assets
```

### Navigation
- Root: Auth gate in App.js (login screen if not admin)
- Drawer → Bottom Tabs (Home, Messages, Favourites) + Stack screens for admin features

### State Management
- Local `useState`/`useEffect` only — no Redux, no Context, no global state library.

## Tech Stack
| Concern | Solution |
|---|---|
| Framework | Expo ~54 + React Native ^0.81 |
| Database / Auth | Firebase Firestore + Firebase Auth (same project as main app) |
| Media Uploads | **Cloudinary** (unsigned uploads) — NOT Hostinger |
| Navigation | React Navigation (Drawer + Bottom Tabs + Native Stack) |
| UI Library | react-native-paper 4.9.2 |
| Icons | @expo/vector-icons (Ionicons, MaterialIcons) |

## Key Conventions

### Firebase Config
Import from `firebaseConfig.js`. Firebase project: `social-vibing-karr` (shared with main app).

### Admin Authentication
- `onAuthStateChanged` → fetch `users/{uid}` from Firestore
- Check `role === 'admin'` or `isAdmin === true`
- If not admin → sign out + "Access Denied"

### Theme & Styling
- All screens use `import { s } from "../styles/styles"` + `import { C } from "../components/Theme"`
- Dark theme. Color constants in `C` object.

### Media Uploads
Use Cloudinary via `cloudinary.js` helper. Do NOT use Hostinger (that's the main app).

### File Naming
- Screens: `PascalCase.js` (e.g., `AdminPortalScreen.js`)
- Components: `PascalCase.js`
- Services/Utils: `camelCase.js`

## Build & Run
```bash
npm start              # Start dev server
npm run android        # expo run:android
npm run ios            # expo run:ios
npm run web            # expo start --web
```

## Main App Awareness

**There is a companion main app** at `/Users/ameerhamza/Developer/social-vibing-app` (also React Native + Expo SDK 54). Both apps share the **same Firebase project** (`social-vibing-karr`) and the **same Firestore database**.

### Shared Firestore schemas (DO NOT change without coordinating with main app):
- **`users/{uid}` moderation fields**: `role`, `isAdmin`, `isVerified`, `verificationStatus`, `isBanned`, `banType`, `banReason`, `bannedAt`, `banExpiresAt`, `bannedBy`, `isSuspended`, `suspendedReason`, `warnings`, `warningsCount`, `accountStatus`, `reportsReceived`
- **`reports` collection**: Moderation pipeline used by both apps
- **`admin_actions` collection**: Immutable audit log — rules block updates/deletes
- **`communities` document fields**: `creatorId`, `moderators`, `members`, `memberCount`, `isDisabled`, `disabledAt`, `disabledBy`, `disabledReason`
- **Content soft-delete convention**: `isDeleted`, `deletedAt`, `deletedBy`, `deletionReason` on posts, products, comments
- **Firestore rules helper functions**: `isAdmin()` checks `users/{uid}.role == 'admin'`

### Key Differences:
| Aspect | Main App | Admin App |
|--------|----------|-----------|
| Media Uploads | Hostinger | Cloudinary |
| UI Library | Custom components | react-native-paper |
| Navigation | Stack + Bottom Tabs | Drawer + Bottom Tabs + Native Stack |
| State | Context (Wallet, Status) | Local useState only |

See full admin app skill file: `.agents/skills/admin-app-skills.md`

## Security Notes
- Firebase API keys loaded from `.env` → `app.config.js` → `expo.extra`
- Firestore rules enforce admin access via `isAdmin()` helper function
- Admin role: `users/{uid}.role === 'admin'` — this is the source of truth
