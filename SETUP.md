# Athlete File Management System - Setup Guide

## Environment Variables Setup

To fix the data fetching issues in the admin dashboard, you need to set up your environment variables:

### 1. Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Database Setup

Run the SQL commands from `database/schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

### 4. Features Added

✅ **Fixed Admin Dashboard Data Fetching**
- Improved error handling and logging
- Added proper loading states
- Enhanced UI for empty states

✅ **Added Announcement Feature**
- Create, view, and delete announcements
- Admin-only access for management
- Beautiful UI with proper styling
- Real-time updates

### 5. Admin Dashboard Tabs

- **Folders**: Manage public folders
- **Files**: View and manage all uploaded files
- **Users**: View registered users
- **Announcements**: Create and manage system announcements
- **Analytics**: View system statistics and charts

### 6. Troubleshooting

If data is still not loading:

1. Check browser console for errors
2. Verify environment variables are correctly set
3. Ensure Supabase project is active
4. Check RLS policies in Supabase dashboard
5. Verify user has admin role in the database

### 7. Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

