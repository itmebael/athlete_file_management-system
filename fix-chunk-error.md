# Fix ChunkLoadError - Quick Guide

## Solution 1: Clear Cache and Restart (Recommended)

1. **Stop the dev server** (Ctrl+C in terminal)

2. **Delete build cache:**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
   ```

3. **Clear browser cache:**
   - Open Chrome DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

4. **Restart the server:**
   ```bash
   npm run dev
   ```

## Solution 2: Use Different Port

If port 3000 is causing issues:

```bash
npm run dev -- -p 3001
```

Then access at: `http://localhost:3001`

## Solution 3: Reinstall Dependencies

If the error persists:

```bash
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall
npm install

# Restart
npm run dev
```

## Solution 4: Update Next.js Config

The `next.config.js` has been updated with webpack configuration to prevent chunk loading issues.

## Solution 5: Check Network/Firewall

- Ensure no firewall is blocking localhost:3000
- Try accessing in incognito/private mode
- Disable browser extensions temporarily

## For Android Access

After fixing the error, use:
```bash
npm run dev:network
```

Then access from Android: `http://YOUR_IP:3000`




