# ⚡ GitHub OAuth Quick Start

## 🚀 5-Minute Setup

### 1. Create GitHub OAuth App (2 min)
```
1. Visit: https://github.com/settings/developers
2. Click: "New OAuth App"
3. Set:
   - Name: CodeOrbit
   - Homepage: http://localhost:3000
   - Callback: http://localhost:3000/auth/github/callback
4. Copy: Client ID and Client Secret
```

### 2. Add Environment Variables (1 min)

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=YOUR_CLIENT_ID_HERE
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**Backend `.env`:**
```env
GITHUB_CLIENT_ID=YOUR_CLIENT_ID_HERE
GITHUB_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

### 3. Restart Servers (1 min)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4. Test (1 min)
```
1. Open: http://localhost:3000
2. Login
3. Go to Profile
4. Click "Connect Platforms"
5. Click "Connect via OAuth" for GitHub
6. Authorize on GitHub
7. See success message ✅
```

---

## 🎯 What Happens

```
Click "Connect GitHub"
    ↓
Redirect to GitHub
    ↓
User authorizes
    ↓
Redirect to /auth/github/callback?code=XXX
    ↓
Send code to backend
    ↓
Backend gets GitHub access token
    ↓
Backend fetches user data
    ↓
Shows GitHub stats ✅
```

---

## 📱 User Experience

### Before Connection:
```
┌─────────────────────────────────┐
│  [GitHub Icon]                  │
│  GitHub                          │
│  Status: Not Connected          │
│  [Connect via OAuth]            │
└─────────────────────────────────┘
```

### After Connection:
```
┌─────────────────────────────────┐
│  [@username] ✅ Connected       │
│                                  │
│  📦 25 Repos    ⭐ 150 Stars   │
│  👥 50 Followers  📊 1.2K Commits│
│                                  │
│  [Refresh Data]  [Disconnect]   │
└─────────────────────────────────┘
```

---

## 🐛 Quick Troubleshooting

**"Client ID not configured"**
→ Add `NEXT_PUBLIC_GITHUB_CLIENT_ID` to `.env.local`
→ Restart frontend server

**"redirect_uri_mismatch"**
→ Check GitHub OAuth App callback URL matches exactly
→ Must be: `http://localhost:3000/auth/github/callback`

**"CORS error"**
→ Backend needs: `app.use(cors({ origin: 'http://localhost:3000' }))`

**"Bad verification code"**
→ OAuth code expired (10 min limit)
→ Click "Connect GitHub" again

---

## ✅ Success Checklist

- [ ] GitHub OAuth App created
- [ ] Client ID copied to `.env.local`
- [ ] Client Secret added to backend `.env`
- [ ] Both servers restarted
- [ ] Can click "Connect GitHub"
- [ ] Redirects to GitHub
- [ ] Redirects back to app
- [ ] Shows "Connected successfully"
- [ ] Displays GitHub stats

---

## 📚 Full Documentation

See `GITHUB_OAUTH_SETUP.md` for:
- Detailed flow diagrams
- Console log examples
- Production deployment guide
- Security best practices
- Advanced troubleshooting

---

## 🎉 That's It!

Your GitHub OAuth is now working. Users can:
- ✅ Connect their GitHub account
- ✅ See their stats automatically
- ✅ Refresh data anytime
- ✅ Disconnect when needed

**No more manual username entry!** 🚀
