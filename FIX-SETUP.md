# Fix: ReactNativePrivateInterface / Bundling Error

## Root cause
Your Node.js (20.14.0) is older than Expo 54's requirement (20.19.4+), which can lead to install and bundling issues.

## Fix steps

### 1. Upgrade Node.js
- Download **Node.js 20.19.4 or later** from https://nodejs.org/
- Or use **nvm-windows**: https://github.com/coreybutler/nvm-windows
  ```powershell
  nvm install 20.19
  nvm use 20.19
  ```
- Confirm:
  ```powershell
  node -v   # Should show v20.19.x or higher
  ```

### 2. Clean reinstall
```powershell
cd C:\Users\lenavo\Desktop\Expense-App
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npm install
```

### 3. Align Expo versions
```powershell
npx expo install --fix
```

### 4. Start with clean cache
```powershell
npx expo start --clear
```

Then press `a` for Android or scan the QR code with Expo Go.
