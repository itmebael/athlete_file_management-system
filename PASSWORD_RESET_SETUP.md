# Password Reset & Email Confirmation with 6-Digit Token Setup

This guide explains how to configure Supabase to send 6-digit tokens in both password reset and email confirmation emails.

## Step 1: Configure Supabase Email Template

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Find the **Reset Password** template
4. Replace the template with the following code:

Use the following email template code to show the token:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p><strong>Your reset token is:</strong></p>
<p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">{{ .Token }}</p>

<p>You can either:</p>
<ul>
  <li>Click the link above to automatically reset your password</li>
  <li>Or copy the token above and enter it in the reset form</li>
  <li>Or enter the last 6 characters of the token as a code</li>
</ul>
```

**Note:** 
- `{{ .ConfirmationURL }}` is the clickable reset link
- `{{ .Token }}` is the full reset token that users can copy
- The app accepts both the full token and the last 6 digits as a code

**Alternative Template (More User-Friendly):**

If you want to show the 6-digit code explicitly in the email, use this template:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>Your 6-digit reset code will be automatically filled when you click the link above.</p>
<p>Alternatively, you can manually enter the last 6 characters from the token in the link.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

## Step 2: Configure Signup Confirmation Email Template

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Find the **Confirm Signup** template
4. Replace the template with the following code:

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

**Note:** 
- `{{ .ConfirmationURL }}` is the clickable confirmation link
- `{{ .Token }}` is the full confirmation token that users can copy
- The app accepts both the full token and the last 6 digits as a code


## Step 3: Configure Redirect URL

In your Supabase Dashboard:
1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Set **Redirect URLs** to include: `http://localhost:3000/**`

## Step 4: How It Works

### Password Reset Flow:
1. User clicks "Forgot Password" and enters their email
2. Supabase sends an email with a reset link containing a token
3. User clicks the link (or manually enters the 6-digit code from the token)
4. The app extracts the last 6 digits from the token
5. User enters the code and new password
6. Password is reset using Supabase's `updateUser` method

### Signup Confirmation Flow:
1. User fills out the registration form and submits
2. Supabase sends a confirmation email with a token
3. User clicks the confirmation link (or manually enters the 6-digit code)
4. The app extracts the last 6 digits from the token
5. User enters the code to verify their email
6. Account is confirmed and user can sign in

## Current Implementation

The app currently:
- **Password Reset:**
  - Sends password reset email via `resetPasswordForEmail()`
  - Automatically extracts 6-digit code from token when link is clicked
  - Allows manual entry of 6-digit code
  - Validates and resets password

- **Email Confirmation:**
  - Sends confirmation email during signup via `signUp()`
  - Automatically extracts 6-digit code from token when link is clicked
  - Allows manual entry of 6-digit code
  - Verifies email and completes account setup

## Testing

### Test Password Reset:
1. Click "Forgot Password" on the login screen
2. Enter your email address
3. Check your email for the reset link
4. Click the link OR manually extract the last 6 digits from the token
5. Enter the code and new password
6. Password should be reset successfully

### Test Email Confirmation:
1. Click "Sign up" on the login screen
2. Fill out the registration form
3. Submit the form
4. Check your email for the confirmation code
5. Click the confirmation link OR manually enter the 6-digit code
6. Email should be confirmed and you can sign in

