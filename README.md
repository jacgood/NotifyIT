# NotifyIT

A mobile web application for IT teams to receive loud notifications for critical emails during non-working hours.

## Features

- Email integration with critical email filtering
- Loud notifications that can override silent mode
- Customizable notification settings
- Works on iOS and Android devices
- Installable as a Progressive Web App

## Installation

1. Clone the repository:
```
git clone https://github.com/your-username/notifyit.git
cd notifyit
```

2. Install dependencies:
```
npm install
```

3. Add sound files to the public/sounds directory:
- alarm.mp3
- siren.mp3
- bell.mp3
- alert.mp3

4. Start the development server:
```
npm start
```

## Building for Production

```
npm run build
```

## How to Use

1. Install the app on your mobile device:
   - On iOS: Open in Safari, tap the Share button, then "Add to Home Screen"
   - On Android: Open in Chrome, tap menu, then "Add to Home Screen"

2. Configure email notification settings:
   - Set active hours for notifications
   - Adjust volume level
   - Choose alert sound

3. Configure email filters:
   - Add email addresses to monitor
   - Add subject keywords to trigger alerts
   - Set priority level filtering

4. The app will check for new emails every 30 seconds and alert you if critical emails are received during your specified hours.

## Technologies Used

- React
- TypeScript
- Progressive Web App (PWA)
- Local Storage API
- Web Notifications API
- Service Workers

## Note for iOS Users

iOS has limitations on background notifications. For best results, keep the app open in the background or install it to your home screen as a PWA.

## License

MIT