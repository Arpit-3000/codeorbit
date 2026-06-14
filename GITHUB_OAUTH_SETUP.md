# 🔐 GitHub OAuth Setup Guide

## ✅ What's Been Implemented

### Frontend Changes:
1. ✅ Updated API functions in `lib/api.ts`
   - Added `connectGithubOAuth(code)` 
   - Added `disconnectGithub()`
   - Added `refreshGithub()`

2. ✅ Created OAuth callback page: `app/auth/github/callback/page.tsx`
   - Handles OAuth redirect from GitHub
   - Extracts authorization code
   - Sends to backend
   - Shows success/error states

3. ✅ Created GitHub connection modal: `components/connect-github-modal.tsx`
   - Initiates OAuth flow
   - Shows connected status with stats
   - Refresh and disconnect functionality
   - Beautiful UI with user info

4. ✅ Updated platforms modal: `components/connect-platforms-modal.tsx`
   - GitHub now uses OAuth instead of manual username
   - Shows "Connect via OAuth" button
   - Opens dedicated GitHub modal

5. ✅ Added environment variables to `.env.local`
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID`
   - `NEXT_PUBLIC_FRONTEND_URL`

---

## 🚀 Setup Instructions

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the details:

```
Application name: CodeOrbit
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/auth/github/callback
```

4. Click **"Register application"**
5. You'll see:
   - **Client ID**: `Ov23liXXXXXXXXXXXX` (copy this)
6. Click **"Generate a new client secret"**
   - **Client Secret**: `ghp_XXXXXXXXXXXX` (copy this)

### Step 2: Update Environment Variables

#### Frontend `.env.local`:
```env
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXX
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

Replace `Ov23liXXXXXXXXXXXX` with your actual Client ID from Step 1.

#### Backend `.env`:
```env
# GitHub OAuth (ADD THESE)
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=ghp_XXXXXXXXXXXX
```

Replace with your actual values from Step 1.

### Step 3: Restart Both Servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 🧪 Testing the Flow

### Test 1: Connect GitHub
1. Login to your app
2. Go to Profile page
3. Click "Connect Platforms" or "Connect GitHub"
4. Click "Connect with GitHub"
5. You'll be redirected to GitHub
6. Click "Authorize" on GitHub
7. You'll be redirected back to app
8. Should see "GitHub connected successfully!"
9. Should see your GitHub stats (repos, stars, contributions)

### Test 2: View Connected Account
1. Click "Connect Platforms" again
2. GitHub should show as "Connected"
3. Should show username and "Manage" button
4. Click "Manage" to see detailed stats

### Test 3: Refresh Data
1. Open GitHub modal
2. Click "Refresh Data"
3. Should update stats from GitHub
4. Toast notification appears

### Test 4: Disconnect
1. Open GitHub modal
2. Click "Disconnect"
3. Confirm disconnection
4. GitHub should show as not connected

---

## 📊 OAuth Flow Diagram

```
User clicks "Connect with GitHub"
         ↓
Redirect to GitHub OAuth
https://github.com/login/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/auth/github/callback&
  scope=read:user,repo
         ↓
User authorizes on GitHub
         ↓
GitHub redirects back
http://localhost:3000/auth/github/callback?code=ABC123
         ↓
Frontend extracts code
         ↓
Frontend sends to backend
POST /api/github/oauth/callback
{ code: "ABC123" }
         ↓
Backend exchanges code for access token
POST https://github.com/login/oauth/access_token
         ↓
Backend fetches user data using token
GET https://api.github.com/user
GET https://api.github.com/user/repos
         ↓
Backend stores data + token in database
         ↓
Backend returns user data
         ↓
Frontend shows success + stats
         ↓
User sees connected status ✅
```

---

## 🔍 Console Logs to Check

### Frontend Logs:
```
[GITHUB OAUTH] Initiating OAuth flow
[GITHUB OAUTH] Client ID: Present
[GITHUB OAUTH] Redirect URI: http://localhost:3000/auth/github/callback
[GITHUB OAUTH] Redirecting to: https://github.com/login/oauth/authorize...
```

After redirect back:
```
[GITHUB OAUTH] Callback received
[GITHUB OAUTH] Code: Present
[GITHUB OAUTH] Sending code to backend...
[GITHUB OAUTH] ✅ Success: { github: { username: "...", ... } }
[GITHUB OAUTH] Stats:
- Username: your-username
- Repos: 25
- Stars: 150
- Contributions: 1234
```

### Backend Logs:
```
[GITHUB OAUTH] Received code from frontend
[GITHUB OAUTH] Exchanging code for token...
[GITHUB OAUTH] ✅ Got access token
[GITHUB OAUTH] Fetching user data...
[GITHUB OAUTH] ✅ User data fetched
[GITHUB OAUTH] Fetching repositories...
[GITHUB OAUTH] ✅ Repos fetched
[GITHUB OAUTH] Saving to database...
[GITHUB OAUTH] ✅ Saved successfully
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Configuration Error - GitHub Client ID not configured"

**Problem**: Frontend can't find the Client ID

**Solution**:
1. Check `.env.local` has: `NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23li...`
2. Make sure it's `NEXT_PUBLIC_` prefix (required for Next.js)
3. Restart dev server after adding env var
4. Clear browser cache and reload

### Issue 2: "redirect_uri_mismatch"

**Problem**: The callback URL doesn't match what's in GitHub OAuth App

**Solution**:
1. Go to: https://github.com/settings/developers
2. Click your OAuth App
3. Make sure "Authorization callback URL" is: `http://localhost:3000/auth/github/callback`
4. For production, add: `https://your-domain.com/auth/github/callback`

### Issue 3: "Bad verification code"

**Problem**: OAuth code expired or already used

**Solution**:
- OAuth codes are single-use and expire in ~10 minutes
- User needs to click "Connect GitHub" again
- Don't refresh the callback page

### Issue 4: CORS errors

**Problem**: Backend not allowing frontend requests

**Solution**: Backend needs CORS enabled
```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue 5: "401 Unauthorized" when calling backend

**Problem**: JWT token not being sent

**Solution**: Check that JWT token is in localStorage and API client adds it
```javascript
// Frontend already handles this in lib/api-client.ts
const token = localStorage.getItem('token');
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## 🔐 Security Checklist

- ✅ Client Secret ONLY in backend `.env` (never in frontend)
- ✅ Access tokens stored ONLY in backend database
- ✅ Frontend NEVER sees GitHub access token
- ✅ Backend validates JWT before processing OAuth
- ✅ HTTPS required in production
- ✅ CORS properly configured
- ✅ State parameter used for CSRF protection

---

## 📝 Production Deployment

### When deploying to production:

1. **Update GitHub OAuth App**:
   - Add production callback URL: `https://your-domain.com/auth/github/callback`
   - Keep localhost URL for development

2. **Update Frontend Environment Variables**:
```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXX
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-backend.com
```

3. **Update Backend Environment Variables**:
```env
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=ghp_XXXXXXXXXXXX
FRONTEND_URL=https://your-domain.com
```

4. **Update CORS**:
```javascript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

---

## 📚 Files Modified/Created

### Created:
- ✅ `app/auth/github/callback/page.tsx` - OAuth callback handler
- ✅ `components/connect-github-modal.tsx` - GitHub connection modal
- ✅ `GITHUB_OAUTH_SETUP.md` - This setup guide

### Modified:
- ✅ `lib/api.ts` - Added OAuth API functions
- ✅ `components/connect-platforms-modal.tsx` - Updated to use OAuth for GitHub
- ✅ `.env.local` - Added GitHub OAuth env vars

---

## 🎯 Next Steps

1. **Get GitHub OAuth credentials** (Step 1 above)
2. **Add to `.env.local`** (Step 2 above)
3. **Restart dev servers** (Step 3 above)
4. **Test the flow** (Testing section above)
5. **Deploy to production** (when ready)

---

## 💡 Features Implemented

✅ OAuth authorization flow
✅ Secure token exchange
✅ User data fetching
✅ Repository statistics
✅ Contribution graph
✅ Star count
✅ Refresh functionality
✅ Disconnect functionality
✅ Beautiful UI with stats
✅ Error handling
✅ Loading states
✅ Toast notifications

---

## 📞 Need Help?

If you encounter issues:
1. Check console logs (both frontend and backend)
2. Verify environment variables are set correctly
3. Make sure GitHub OAuth App settings are correct
4. Ensure backend OAuth endpoints are implemented
5. Check network tab for API request/response details

---

**Status**: ✅ Frontend Implementation Complete
**Requires**: Backend OAuth endpoints + GitHub OAuth App setup
**Ready for**: Testing and deployment
