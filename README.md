# 🎓 LMS Gambheera - Complete Learning Management System

A modern, full-featured Learning Management System built with Next.js 15, Sanity CMS, and Supabase.

## ✨ Features

### 👨‍🎓 Student Features
- **Course Catalog**: Browse and search courses with advanced filtering
- **Progress Tracking**: Automatic progress tracking across lectures, assignments, quizzes, and modules
- **Interactive Learning**: 
  - Video lectures with notes
  - Code editor (IDE) integration
  - Interactive quizzes with instant feedback
  - Assignment submissions
- **Certificates**: Automatic certificate generation upon course completion
- **Dashboard**: Personalized dashboard with learning analytics and progress charts
- **Saved Notes**: Save and manage lecture notes with timestamps

### 👨‍🏫 Faculty Features
- **Course Management**: 
  - Create and edit courses with rich content
  - Upload thumbnails and preview videos
  - Organize content into modules and sections
- **Content Creation**:
  - Add lectures with video/text content
  - Create assignments with code submissions
  - Design interactive quizzes
- **Student Management**: Track student enrollments and progress
- **Analytics**: View course performance and student engagement

### 🎨 Design & UX
- **Modern UI**: Built with shadcn/ui components
- **Dark Theme**: Elegant dark mode interface
- **Responsive Design**: Works seamlessly on all devices
- **Smooth Animations**: Framer Motion animations throughout

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Code Editor**: Monaco Editor

### Backend & Services
- **CMS**: Sanity (Headless CMS)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Sanity Assets
- **Deployment**: Vercel

## 📦 Project Structure

```
lmsgambheera/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── courses/           # Course pages
│   │   ├── dashboard/         # Student dashboard
│   │   ├── faculty/           # Faculty dashboard
│   │   ├── studio/            # Sanity Studio
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/               # UI components (shadcn)
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── learn/            # Learning components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   └── sanity/              # Sanity configuration
│       ├── schemaTypes/     # Content schemas
│       └── lib/             # Sanity utilities
├── public/                   # Static assets
├── docs/                     # Documentation
└── ...config files

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Sanity account
- Supabase account
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/DampetlaMokshith/lmsgambheera.git
   cd lmsgambheera
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Sanity and Supabase credentials
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Main app: http://localhost:3000
   - Sanity Studio: http://localhost:3000/studio

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Complete guide to deploy to Vercel
- **[Progress Tracking Documentation](./docs/)**: Detailed progress tracking system docs

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
NEXT_PUBLIC_SANITY_READ_TOKEN=
SANITY_API_TOKEN=
SANITY_API_WRITE_TOKEN=
NEXT_PUBLIC_SANITY_EDITOR_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 🎯 Key Features Implementation

### Progress Tracking System
- Automatic progress calculation
- Real-time updates
- Database triggers for efficiency
- Detailed item-level tracking

### Course Management
- Drag-and-drop content organization
- Rich text editing
- Code syntax highlighting
- Video integration

### Authentication & Authorization
- Student and Faculty roles
- Secure authentication with Supabase
- Protected routes and API endpoints

## 📱 Screenshots

*(Add screenshots of your LMS here)*

## 🤝 Contributing

This is a private educational project. For any questions or suggestions, please contact the maintainer.

## 👨‍💻 Developer

**Mokshith Dampetla**
- Email: 23101A030084@mbu.asia
- GitHub: [@DampetlaMokshith](https://github.com/DampetlaMokshith)

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- CMS powered by [Sanity](https://www.sanity.io/)
- Database by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

**Made with ❤️ for educational excellence**
