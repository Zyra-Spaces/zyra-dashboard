# Cookie Size Optimization - Fixed ERR_HTTP_RESPONSE_CODE_FAILURE 431

## Problem
Supabase stores user metadata in cookies. When large data (base64 images, arrays, objects) was stored in metadata, it exceeded the HTTP header size limit (8KB), causing `ERR_HTTP_RESPONSE_CODE_FAILURE 431`.

## Solution

### 1. Minimized Metadata Storage
**Only store small, essential fields in Supabase user metadata:**
- ✅ first_name, last_name, username (max 100 chars each)
- ✅ date_of_birth, gender, occupation, referral_source
- ✅ bio (only if ≤ 50 chars)
- ❌ **NEVER store**: images, arrays, objects, large strings

### 2. localStorage for Large Data
**Store large data in localStorage only:**
- Profile pictures (base64 or URLs)
- Banner pictures (base64 or URLs)
- Team emails (arrays)
- Social links (objects)
- Full bio (if > 50 chars)

### 3. Automatic Cleanup
- Runs on every page load (`CleanupOnMount` component)
- Runs after login/signup
- Runs after OAuth callback
- Removes any existing large data from metadata

### 4. API Routes
- `/api/cleanup-cookies` - Cleans up user metadata
- `/api/clear-cookies` - Emergency cookie clearing

## How to Fix Existing Large Cookies

### Option 1: Automatic (Recommended)
Just refresh the page - cleanup runs automatically.

### Option 2: Manual API Call
Open browser console and run:
```javascript
fetch('/api/cleanup-cookies', { method: 'POST' }).then(r => r.json()).then(console.log);
```

### Option 3: Clear All Cookies
Open browser console and run:
```javascript
fetch('/api/clear-cookies', { method: 'POST' }).then(() => {
  window.location.reload();
});
```

### Option 4: Browser DevTools
1. Open DevTools (F12)
2. Go to Application > Cookies
3. Delete all cookies for `localhost:3001`
4. Refresh page

## Files Modified

1. `lib/supabase/profile.ts` - Only saves small fields to metadata
2. `app/api/cleanup-cookies/route.ts` - Cleanup API endpoint
3. `components/cleanup-on-mount.tsx` - Auto-cleanup on mount
4. `app/layout.tsx` - Added cleanup component
5. `contexts/auth-context.tsx` - Cleanup on sign in
6. `app/auth/callback/route.ts` - Cleanup after OAuth
7. All onboarding pages - Store large data in localStorage only

## Data Storage Strategy

| Data Type | Storage Location | Reason |
|-----------|----------------|--------|
| Name, Username, DOB, Gender | Supabase Metadata | Small, essential |
| Occupation, Referral Source | Supabase Metadata | Small strings |
| Bio (short) | Supabase Metadata | If ≤ 50 chars |
| Bio (long) | localStorage | If > 50 chars |
| Profile Picture | localStorage | Large data |
| Banner Picture | localStorage | Large data |
| Team Emails | localStorage | Array data |
| Social Links | localStorage | Object data |

## Testing

After these changes:
1. Clear browser cookies
2. Login again
3. Check cookie size in DevTools (should be < 4KB)
4. Complete onboarding
5. Verify no 431 errors

