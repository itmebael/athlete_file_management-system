# AthleteFile - Professional File Management System

A comprehensive web application for managing athlete files with role-based authentication, secure file storage, and modern UI design.

## Features

### 🎯 Core Features
- **Splash Screen** - Beautiful animated logo screen (3 seconds)
- **Role-based Authentication** - Admin sign-in & Student registration
- **Admin Dashboard** - Create/manage folders, view all student files
- **Student Dashboard** - Browse folders, create personal folders, upload files
- **File Management** - Upload PDF, images, Word docs with download & delete
- **Secure Database** - Users, folders, student folders with Row Level Security (RLS)
- **Theme Toggle** - Light/Dark mode with persistent preferences

### 🎨 Design Features
- **Blue & White Modern Theme** with gradients
- **Smooth Animations** and hover effects
- **Card-based Layouts** with Inter font
- **Custom Logo** with animated elements
- **Responsive Design** for all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Notifications**: React Hot Toast

## Running on Android Device

### Option 1: Access from Android Browser (Same Network)

1. **Start the development server with network access:**
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Or modify `package.json`:
   ```json
   "dev": "next dev -H 0.0.0.0"
   ```

2. **Find your computer's local IP address:**
   - **Windows**: Open Command Prompt and run:
     ```bash
     ipconfig
     ```
     Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.x.x.x)
   
   - **Mac/Linux**: Open Terminal and run:
     ```bash
     ifconfig | grep "inet "
     ```
     Or:
     ```bash
     ip addr show
     ```

3. **Access from Android device:**
   - Make sure your Android device is on the same Wi-Fi network
   - Open Chrome or any browser on your Android device
   - Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

4. **If connection fails:**
   - Check Windows Firewall settings (allow Node.js through firewall)
   - Ensure both devices are on the same network
   - Try disabling VPN if active

### Option 2: Using Android Emulator

1. **Install Android Studio** and set up an emulator
2. **Start the emulator**
3. **Access from emulator browser:**
   - For Android emulator, use: `http://10.0.2.2:3000`
   - This is the special IP that maps to your host machine's localhost

### Option 3: Deploy to Production

**📖 For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

**Quick Deploy Options:**

1. **Vercel (Recommended - 2 minutes):**
   - Push code to GitHub
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import repository
   - Add environment variables (see below)
   - Click Deploy

2. **Netlify (3 minutes):**
   - Push code to GitHub
   - Go to [app.netlify.com](https://app.netlify.com)
   - Import repository
   - Add environment variables (see below)
   - Click Deploy

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

**Get these from:** Supabase Dashboard → Settings → API

**Full Guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd athlete-file-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```
4. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from `database/schema.sql` to create tables and policies

### 5. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Tables
- **users** - User profiles with roles (admin/student)
- **folders** - Public folders created by admins
- **student_folders** - Personal folders created by students
- **files** - File metadata and storage references

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Secure file upload/download with authentication

## User Roles

### Admin (Pre-configured)
- Sign in with existing admin credentials
- Create and manage public folders
- View all files and users
- Delete any files or folders
- Access analytics dashboard

### Student
- Register for new student account
- Browse public folders
- Create personal folders
- Upload files to personal folders
- Download and manage own files

## File Types Supported
- PDF documents
- Images (JPG, PNG, GIF)
- Word documents (DOC, DOCX)

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and Tailwind config
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── page.tsx             # Main application component
├── components/
│   ├── SplashScreen.tsx     # Animated splash screen
│   ├── AuthForm.tsx         # Authentication forms
│   ├── AdminDashboard.tsx   # Admin interface
│   └── StudentDashboard.tsx # Student interface
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── lib/
│   └── supabase.ts          # Supabase client and types
├── database/
│   └── schema.sql           # Database schema and policies
└── public/                  # Static assets
```

## Customization

### Colors
The application uses a blue and white color scheme defined in `tailwind.config.js`. You can customize the colors by modifying the `primary` and `secondary` color palettes.

### Animations
Animations are powered by Framer Motion and can be customized in the component files. The splash screen includes gentle bounce animations and fade effects.

### Logo
The logo is created using Lucide React icons. You can replace the Trophy icon with your own logo by modifying the `SplashScreen.tsx` component.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.
