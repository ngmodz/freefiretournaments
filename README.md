# Freefire Tournaments App

A modern web application for browsing, joining, and managing Freefire gaming tournaments. This platform connects gamers, allowing them to participate in tournaments, track their progress, and engage with the Freefire gaming community.

## 🎮 Features

- **Tournament Listings**: Browse and search for upcoming Freefire tournaments
- **Tournament Details**: View comprehensive information about each tournament including rules, prizes, and schedules
- **User Authentication**: Secure login/signup system with email and password
- **User Profiles**: Customizable user profiles with gaming history and statistics
- **Settings Management**: User preferences and account settings
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Progressive Web App (PWA)**: Install and use as a native app on mobile devices

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS with custom gaming theme
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Query for server state
- **Authentication & Database**: Firebase
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Date Handling**: date-fns
- **Charts & Visualizations**: Recharts

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn or bun package manager

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd freefire-tournaments
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
# or
yarn build
# or
bun build
```

The build artifacts will be generated in the `dist/` folder.

## 📱 PWA Support

This application is configured as a Progressive Web App (PWA), which means users can install it on their mobile devices and use it like a native app. PWA features include:

- Offline support
- Home screen installation
- Native-like experience on mobile devices

## 🧩 Project Structure

```
src/
├── components/        # UI components
│   ├── ui/            # Base UI components from Shadcn
│   ├── settings/      # Settings-related components
│   ├── profile/       # Profile-related components
│   └── auth/          # Authentication components
├── pages/             # Application pages/routes
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and service configurations
├── App.tsx            # Main application component with routes
└── main.tsx           # Application entry point
```

## 🔧 Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions, feedback, or support, please use the Contact Developer form in the app settings, or reach out to the repository owner.