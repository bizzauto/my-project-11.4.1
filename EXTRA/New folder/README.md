
# 📱 IndiaCRM Mobile App

IndiaCRM ka Android & iOS mobile app, built with **Capacitor** - existing React web app ko native mobile app mein convert karta hai.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **Android Studio** (for Android builds)
- **Xcode** (for iOS builds, Mac only)
- **Java JDK** 17+

### Step 1: Web Build
Pehle main project ka web build banao:
```bash
cd ..
npm run build
```

### Step 2: Sync Web Assets
Web build ko mobile platforms mein copy karo:
```bash
cd mobile-app
npx cap sync
```

### Step 3: Open in IDE

**Android:**
```bash
npx cap open android
```
Phir Android Studio mein **Run** button press karo.

**iOS (Mac only):**
```bash
npx cap open ios
```
Phir Xcode mein **Run** button press karo.

---

## 📂 Project Structure

```
mobile-app/
├── capacitor.config.ts    # Capacitor configuration
├── package.json           # Mobile dependencies
├── android/               # Android native project
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── res/           # Icons, splash, colors
└── ios/                   # iOS native project (Mac only)
```

## 🔧 Configuration

### API URL Change
Mobile app ko apne server se connect karne ke liye:

1. **`../src/lib/api.ts`** mein `VITE_API_URL` set karo
2. Ya **`../.env`** file banao:
```
VITE_API_URL=https://your-server.com/api
```

### App Name Change
- **Android:** `android/app/src/main/res/values/strings.xml`
- **iOS:** `ios/App/App/Info.plist`

### App Icon Change
- **Android:** `android/app/src/main/res/mipmap-*` folders mein icons daalo
- **iOS:** `ios/App/App/Assets.xcassets/AppIcon.appiconset` mein icons daalo

**Tip:** [icon.kitchen](https://icon.kitchen) se easily icons generate karo!

---

## 📱 Features

| Feature | Android | iOS |
|---------|---------|-----|
| Push Notifications | ✅ | ✅ |
| Camera Access | ✅ | ✅ |
| File System | ✅ | ✅ |
| Share | ✅ | ✅ |
| Dark Mode | ✅ | ✅ |
| Bottom Navigation | ✅ | ✅ |
| Safe Area Support | ✅ | ✅ |
| Splash Screen | ✅ | ✅ |
| Status Bar | ✅ | ✅ |

---

## 🔄 Development Workflow

1. **Code changes** → `src/` folder mein changes karo
2. **Build** → `cd .. && npm run build`
3. **Sync** → `cd mobile-app && npx cap sync`
4. **Test** → `npx cap run android` ya Android Studio mein run karo

### Live Reload (Development)
```bash
# Terminal 1: Start dev server
cd .. && npm run dev

# Terminal 2: Run on device with live reload
npx cap run android --livereload --external
```

---

## 🏗️ Build for Production

### Android APK/AAB
1. `npx cap open android`
2. Android Studio mein **Build → Generate Signed Bundle/APK**
3. Keystore create karo ya existing use karo
4. Release build generate hoga

### iOS IPA
1. `npx cap open ios`
2. Xcode mein **Product → Archive**
3. Organizer mein **Distribute App**

---

## ⚠️ Important Notes

- **`../`** (parent directory) mein web project hona chahiye
- Web build (`dist/client/`) ke bina mobile app kaam nahi karega
- iOS build ke liye **Mac + Xcode** zaroori hai
- Android build Windows/Linux/Mac sab pe ho sakta hai
- Production ke liye `VITE_API_URL` zaroor set karo
