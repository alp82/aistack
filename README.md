# AI Stack

<div align="center">

![AI Stack Logo](aistack-web/public/aistack-logo.png)

**A curated platform for discovering, comparing, and sharing AI technology stacks**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 🎯 Purpose

AI Stack is a web application designed to help developers and teams discover, compare, and share AI technology stacks. Whether you're building a new AI-powered application or looking to optimize your existing stack, AI Stack provides a curated collection of tools, frameworks, and libraries to make informed decisions.

## ✨ Features

- **Discover** AI tools and frameworks organized by category
- **Compare** different technology stacks side by side
- **Share** your own AI stacks with the community
- **Stay Updated** with the latest AI technology trends

## 🛠 Tech Stack

### Frontend
- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- **UI Library**: [React 19](https://react.dev/) - Latest React with concurrent features
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful & consistent icons
- **Animations**: [Motion](https://motion.dev/) & [GSAP](https://greensock.com/gsap/) - Smooth animations
- **Components**: [Radix UI](https://www.radix-ui.com/) - Accessible component primitives

### Backend & Data
- **Backend**: [Convex](https://convex.dev/) - Serverless database and backend functions
- **Authentication**: [Better Auth](https://better-auth.com/) - Modern authentication solution
- **State Management**: [TanStack Query](https://tanstack.com/query) - Server state management
- **Forms**: [TanStack Forms](https://tanstack.com/form) - Type-safe form handling

### Development Tools
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool and dev server
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Linting/Formatting**: [Biome](https://biomejs.dev/) - All-in-one toolchain
- **Testing**: [Vitest](https://vitest.dev/) - Fast unit testing framework

### Analytics
- **Analytics**: [PostHog](https://posthog.com/) - Product analytics suite

## 📁 Project Structure

```
aistack/
├── aistack-web/          # Main web application
│   ├── convex/           # Convex backend functions & schema
│   ├── public/           # Static assets
│   └── src/              # React application source
│       ├── components/   # Reusable UI components
│       ├── integrations/ # Third-party integrations
│       └── routes/       # File-based routing
└── README.md             # You are here
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aistack.git
   cd aistack
   ```

2. **Install dependencies**
   ```bash
   cd aistack-web
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Configure your environment variables
   # VITE_CONVEX_URL and CONVEX_DEPLOYMENT are required
   ```

4. **Initialize Convex**
   ```bash
   npx convex dev
   ```
   This will automatically set up your Convex deployment and update your environment variables.

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Convex Dashboard: http://localhost:3210

## 📜 Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm convex dev   # Start Convex backend server

# Building
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
pnpm check        # Run all Biome checks

# Testing
pnpm test         # Run unit tests with Vitest
```

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for unit testing. Tests are located in the `src/**/__tests__` directories.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Generate coverage report
pnpm test --coverage
```

## 🎨 Adding Components

This project uses [Shadcn UI](https://ui.shadcn.com/) components. Add new components with:

```bash
pnpm dlx shadcn@latest add [component-name]
```

## 📊 Development Notes

- The development server runs on `http://localhost:3000`
- The Convex backend runs on `http://localhost:3210`
- Both servers should remain running during development
- Use Chrome DevTools MCP for debugging and reviewing code updates

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main branch.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [TanStack Documentation](https://tanstack.com)
- [Convex Documentation](https://docs.convex.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Better Auth](https://better-auth.com/docs)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

<div align="center">
Made with ❤️ by the AI Stack team
</div>
