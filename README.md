# 🍽️ ReCook - Your AI Smart Cooking Assistant

ReCook is an innovative mobile application tailored for culinary enthusiasts and
home cooks. Leveraging the power of Artificial Intelligence, ReCook helps you
discover recipes, manage your kitchen, and cooks along with you using voice
commands.

## 📱 Demo

<!--
Cara terbaik untuk menampilkan video:
1. Download video dari link di bawah.
2. Buka file README.md ini di GitHub.com.
3. Klik ikon pensil (Edit).
4. Drag & drop file video ke area editor ini. GitHub akan membuat player otomatis.
-->

[**🎥 Tonton Demo Aplikasi ReCook**](https://drive.google.com/file/d/17DuTBpqvDyeGnxownCiUXpe4c3A3e5mD/view?usp=drive_link)

## ✨ Key Features

- **🤖 AI Recipe Generator**: Generate unique, personalized recipes instantly
  based on ingredients you have or cravings you feel.
- **🗣️ Voice Cooking Mode**: A hands-free, interactive cooking experience. The
  app reads steps aloud and listens to your commands (Next, Repeat) so you can
  focus on cooking.
- **🛒 Smart Shopping List**: Seamlessly add ingredients from recipes directly
  to your digital shopping list.
- **🏠 Pantry Management**: Keep track of your kitchen inventory to minimize
  food waste and cook with what you have.
- **🌍 Community Feed**: Share your culinary creations and discover what others
  are cooking.
- **💎 Pro Subscription**: Integrated with RevenueCat for premium features like
  unlimited AI generations and exclusive content.

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge
  Functions)
- **AI Integration**: OpenAI / Novita AI serving via Supabase Edge Functions
- **In-App Purchases**: [RevenueCat](https://www.revenuecat.com/)
- **Navigation**: Expo Router

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo Go app installed on your iOS/Android device

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/recook.git
   cd recook
   ```

2. **Install dependencies:**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup:** Create a `.env` file in the root directory and add
   your keys:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_REVENUECAT_APPLE_KEY=your_rc_apple_key
   EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=your_rc_google_key
   ```

4. **Run the Application:**

   ```bash
   npx expo start
   ```

   Scan the QR code with your phone (using Expo Go) or press `a` for Android
   Emulator / `i` for iOS Simulator.

## 📂 Project Structure

```
recook/
├── app/                 # Expo Router pages and screens
├── components/          # Reusable UI components
│   ├── feed/            # Feed-related components
│   ├── recipes/         # Recipe-related components
│   └── ...
├── lib/                 # Utilities, stores, and services
│   ├── services/        # API calls (Supabase, AI, etc.)
│   ├── store/           # Zustand state management
│   └── ...
├── assets/              # Images, fonts, and static assets
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request
for any enhancements or bug fixes.

## 📄 License

This project is licensed under the MIT License.
