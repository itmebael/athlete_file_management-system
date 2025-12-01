# Admin Account Setup Instructions

## How to Create Admin Account

1. **Start the application** by running `npm run dev`

2. **Access the application** at `http://localhost:3000`

3. **After the splash screen**, you'll see a "Choose Your Role" screen

4. **Click "Admin Access"** - this will take you to the admin setup screen

5. **Click "Create Admin Account"** - this will create the admin account with:
   - **Email**: `admin@athletefile.com`
   - **Password**: `admin123`

6. **After creation**, you'll be redirected to the sign-in form

7. **Sign in** with the admin credentials:
   - Email: `admin@athletefile.com`
   - Password: `admin123`

8. **You'll now have full admin access** to the dashboard

## Important Notes

- **Only one admin account** can be created
- **Admin credentials** can be changed later through the dashboard
- **Student accounts** can be created separately through "Student Registration"
- **Database setup** is required before creating the admin account

## Troubleshooting

If you get "Invalid login credentials":
1. Make sure you've run the database schema first
2. Try creating the admin account again through the setup screen
3. Check that the email and password are exactly as shown above

## Security

- Change the default admin password after first login
- The admin account has full system access
- Only one admin account is allowed for security




