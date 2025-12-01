# Where to Put the Email Templates in Supabase

## Step-by-Step Guide

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one if you haven't)

### Step 2: Navigate to Email Templates

1. In your Supabase project dashboard, look at the left sidebar
2. Click on **"Authentication"** (it has a key icon 🔑)
3. In the Authentication submenu, click on **"Email Templates"**

### Step 3: Configure Password Reset Template

1. In the Email Templates page, you'll see several template options
2. Find and click on **"Reset Password"** template
3. You'll see a code editor with the current template
4. Replace the entire template with this code:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p><strong>Your reset token is:</strong></p>
<p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">{{ .Token }}</p>

<p>You can either:</p>
<ul>
  <li>Click the link above to automatically reset your password</li>
  <li>Or copy the token above and paste it in the reset form</li>
  <li>Or enter the last 6 characters of the token as a code</li>
</ul>
```

5. Click **"Save"** or **"Update"** button at the bottom

### Step 4: Configure Signup Confirmation Template

1. Still in the Email Templates page
2. Find and click on **"Confirm Signup"** template
3. Replace the entire template with this code:

```html
<h2>Confirm Your Signup</h2>

<p>Click the link below to confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>

<p><strong>Your confirmation token is:</strong></p>
<p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">{{ .Token }}</p>

<p>You can either:</p>
<ul>
  <li>Click the link above to automatically confirm your email</li>
  <li>Or copy the token above and paste it in the confirmation form</li>
  <li>Or enter the last 6 characters of the token as a code</li>
</ul>
```

4. Click **"Save"** or **"Update"** button at the bottom

## Visual Guide

```
Supabase Dashboard
├── Your Project
    ├── Authentication (left sidebar)
        ├── Email Templates ← CLICK HERE
            ├── Reset Password ← Put password reset template here
            ├── Confirm Signup ← Put signup confirmation template here
            ├── Magic Link
            ├── Change Email Address
            └── Invite User
```

## Important Notes

- **{{ .Token }}** - This is a Supabase variable that contains the full token/URL
- **{{ .ConfirmationURL }}** - Alternative variable for the confirmation link URL
- The app will automatically extract the last 6 digits from the token
- Make sure to save after making changes
- Test by sending yourself a password reset or signup confirmation email

## Alternative: More User-Friendly Templates

If you want to provide clearer instructions to users, use these templates instead:

### Password Reset (Shows Token):
```html
<h2>Reset Password</h2>

<p>Click the link below to reset your password:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p><strong>Your reset token is:</strong></p>
<p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">{{ .Token }}</p>

<p>You can either:</p>
<ul>
  <li>Click the link above to automatically reset your password</li>
  <li>Or copy the token above and paste it in the reset form</li>
  <li>Or enter the last 6 characters of the token as a code</li>
</ul>

<p>If you didn't request this, you can safely ignore this email.</p>
```

### Signup Confirmation (User-Friendly):
```html
<h2>Confirm Your Signup</h2>

<p>Click the link below to confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>

<p>Your 6-digit confirmation code will be automatically filled when you click the link above.</p>
<p>Alternatively, you can manually enter the last 6 characters from the token in the link.</p>

<p>If you didn't create an account, you can safely ignore this email.</p>
```

## Troubleshooting

**Can't find Email Templates?**
- Make sure you're in the correct project
- Check that you have admin/owner permissions
- Look for "Authentication" in the left sidebar, not "Settings"

**Template not working?**
- Make sure you saved the changes
- Check that you're using the correct variable names ({{ .Token }} or {{ .ConfirmationURL }})
- Test by sending a password reset or signup email

**Need to customize the design?**
- You can add HTML styling, CSS, or use Supabase's template variables
- Check Supabase documentation for available template variables

