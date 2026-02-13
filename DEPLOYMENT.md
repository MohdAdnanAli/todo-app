# Vercel Deployment Guide

## Prerequisites
1. **MongoDB Atlas Account** - Create a free cluster at https://www.mongodb.com/atlas
2. **Vercel Account** - Sign up at https://vercel.com
3. **GitHub/GitLab/Bitbucket** - Push your code to a git repository

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/atlas and create a free account
2. Create a free cluster
3. Create a database user (username/password)
4. Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

---

## Step 2: Prepare Environment Variables

Create a `.env` file in the project root:

```env
# Backend (Required)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/todo-app
JWT_SECRET=your_random_secret_key_min_32_chars

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /home/artemis/Documents/ToDo_Adva_API/todo-app
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your username**
- Want to modify settings? **No** (it will auto-detect)

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Other** (or Vercel will auto-detect)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your random secret key
7. Click **Deploy**

---

## Step 4: Update Frontend API URL

After deployment, Vercel will give you a URL like: `https://your-app.vercel.app`

Update your frontend environment:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-app.vercel.app` (no trailing slash)
4. Redeploy to apply changes

Or update `frontend/src/App.tsx` to use relative paths for production:

```typescript
// In App.tsx, change to:
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:5000');
```

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Register a new account
3. Add some todos
4. Test login/logout

---

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure the backend CORS is configured properly:

```typescript
// In api/index.ts, update cors origin:
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
```

### MongoDB Connection Issues
- Verify your MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check that your connection string is correct
- Ensure database user has proper permissions

### Session/Cookie Issues
For production, you may need to configure cookies with:
```typescript
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true,        // required for HTTPS
  sameSite: 'none',    // required for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

---

## Quick Deploy Commands

```bash
# Full deployment from scratch
cd /home/artemis/Documents/ToDo_Adva_API/todo-app
vercel --prod
```

After first deployment, use `--prod` for production updates.

