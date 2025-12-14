<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI English Coach

An AI-powered English learning application designed to provide interactive and personalized coaching for language learners. Built with modern web technologies and integrated with Google Gemini AI for intelligent assistance.

## Features

- **Interactive Lessons**: Engage with structured English lessons tailored for effective learning.
- **AI-Powered Coaching**: Leverage Google Gemini AI for personalized feedback and guidance.
- **User Management**: Secure login system with role-based access for learners and administrators.
- **Admin Panel**: Comprehensive tools for managing lessons, users, and content.
- **Persistent Storage**: Local storage for session management and data persistence.
- **Responsive Design**: Optimized for various devices and screen sizes.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI Integration**: Google Gemini API
- **UI Components**: Lucide React icons
- **Build Tool**: Vite
- **Package Manager**: npm

## Prerequisites

- Node.js (version 16 or higher)
- Google Gemini API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/quemanhmcr/AI-English-Coach.git
   cd AI-English-Coach
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Run the application:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Usage

- **For Learners**: Log in with learner credentials to access lessons and receive AI coaching.
- **For Administrators**: Log in with admin credentials to manage lessons and users through the admin panel.

View your app in AI Studio: https://ai.studio/apps/drive/184trTRZJoTs61w5473GzvPF0x6mZv4h_

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.
