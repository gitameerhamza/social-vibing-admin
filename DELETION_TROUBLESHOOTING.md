# Content Deletion Troubleshooting Guide

## Issue: Content deletion not working

### Most Common Cause: User doesn't have admin role in Firestore

The Firestore security rules check if `user.role == 'admin'` before allowing deletion. If your user document doesn't have this field set, deletions will fail silently.

## How to Fix

### Step 1: Get your User ID

1. Log into the admin app
2. Open the browser/app console
3. Look for: `Authenticated as: <userId>` or check `auth.currentUser.uid`
4. Copy this user ID

### Step 2: Check if you have admin role

Run in terminal:
```bash
cd /Users/ameerhamza/StudioProjects/social-vibing-admin
node scripts/checkAdminRole.js <YOUR_USER_ID>
```

This will show:
- Your current role
- Whether you're an admin
- Instructions if you need to set admin role

### Step 3: Set admin role (if needed)

If you're NOT an admin, run:
```bash
node scripts/setAdmin.js <YOUR_USER_ID>
```

This directly updates your user document in Firestore to:
```javascript
{
  role: 'admin',
  isAdmin: true
}
```

### Step 4: Verify Firestore Rules are deployed

Make sure the latest rules are deployed:
```bash
firebase deploy --only firestore:rules
```

Check the Firebase Console > Firestore > Rules to confirm deployment timestamp.

### Step 5: Test deletion again

1. Log out and log back in
2. Try removing content from a report
3. Check the console for any errors

## What Gets Logged

When you try to remove content, you should see:
```
Attempting to remove post content with ID: abc123 by admin: xyz789
Committing batch with action: content_removed for report: report123
Successfully took action "content_removed" on report report123
```

## Common Errors

### "permission-denied"
- **Cause**: User doesn't have admin role
- **Fix**: Run `setAdmin.js` script

### "Missing required parameters"
- **Cause**: adminId is undefined
- **Fix**: Check `auth.currentUser` is not null

### No error but content still visible
- **Cause**: Might be cached or soft-deleted
- **Fix**: Check Firestore console directly - document should be GONE (not just marked isDeleted)

## Verify in Firestore Console

1. Go to Firebase Console > Firestore Database
2. Find the collection (posts/stories/messages/products)
3. Search for the content ID
4. After deletion, document should be **completely removed** (not present)

## Manual Fix (Firebase Console)

If scripts don't work, manually set admin role:

1. Go to Firebase Console > Firestore Database
2. Navigate to `users` collection
3. Find your user document
4. Click "Add field":
   - Field: `role`
   - Type: `string`
   - Value: `admin`
5. Add another field:
   - Field: `isAdmin`
   - Type: `boolean`
   - Value: `true`
6. Save changes

## Testing Checklist

- [ ] User document has `role: 'admin'`
- [ ] User document has `isAdmin: true`  
- [ ] Firestore rules are deployed
- [ ] Logged out and back in
- [ ] Console shows "Attempting to remove..." logs
- [ ] Console shows "Successfully took action..." log
- [ ] Content is DELETED from Firestore (not just marked)
- [ ] No permission-denied errors

## Still Not Working?

Check the browser/app console for the exact error message and share it for further debugging.
