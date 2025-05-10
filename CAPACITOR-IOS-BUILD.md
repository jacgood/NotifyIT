# Building NotifyIT for iOS with Capacitor

This guide explains how to build and run the NotifyIT app on iOS devices using Capacitor.

## Prerequisites

Before you begin, make sure you have the following installed on your Mac:

- Xcode 13 or newer
- CocoaPods (`brew install cocoapods`)
- Node.js 14 or newer
- npm 6 or newer

## Setup

The project has already been configured with Capacitor for iOS. The following steps have been completed:

1. Capacitor core and iOS platform have been installed
2. The app has been configured to use Capacitor's native notification system on iOS
3. Notification sounds have been copied to the iOS project

## Building for iOS

Follow these steps to build and run the NotifyIT app on an iOS device or simulator:

1. **Clone the repository to your Mac**

   ```bash
   git clone <your-repo-url>
   cd NotifyIT
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the web app**

   ```bash
   npm run build
   ```

4. **Update the iOS app with the latest web build**

   ```bash
   npx cap sync ios
   ```

5. **Open the iOS project in Xcode**

   ```bash
   npx cap open ios
   ```

6. **In Xcode:**
   - Select your development team in the Signing & Capabilities section
   - Choose your target device (simulator or connected physical device)
   - Click the Run button (▶️) to build and run the app

## Troubleshooting

### Notification Sounds Not Working

If notification sounds aren't playing on iOS:

1. Make sure the sound files are properly copied to the iOS project:
   ```bash
   ls -la ios/App/App/public/sounds/
   ```

2. Check that the sound file names in the app match the actual files in the sounds directory

3. Verify that notification permissions are granted on the device

### App Crashes on Launch

If the app crashes immediately after launch:

1. Check the Xcode console for error messages
2. Verify that all required Capacitor plugins are installed:
   ```bash
   npm install @capacitor/core @capacitor/ios @capacitor/push-notifications @capacitor/splash-screen @capacitor/local-notifications
   ```

## Customizing iOS Settings

You can customize various iOS-specific settings in the `capacitor.config.ts` file:

```typescript
ios: {
  contentInset: 'automatic',
  allowsLinkPreview: true,
  scrollEnabled: true
}
```

## Updating the App

After making changes to the web app code:

1. Rebuild the web app:
   ```bash
   npm run build
   ```

2. Update the iOS app:
   ```bash
   npx cap copy ios
   ```

3. For plugin changes or major updates:
   ```bash
   npx cap sync ios
   ```

## Distribution

To distribute your app to TestFlight or the App Store:

1. In Xcode, select Product > Archive
2. Follow the prompts to upload your app to App Store Connect
3. Use App Store Connect to submit the app to TestFlight or the App Store

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/ios/)
