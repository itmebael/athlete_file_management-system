# EmailJS Configuration for Athlete File Management System

To enable email notifications for announcements, follow these steps:

## 1. Create an EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/) and sign up for a free account.

## 2. Add an Email Service
1. In the EmailJS dashboard, go to the **Email Services** tab.
2. Click **Add New Service**.
3. Select **Gmail** (or your preferred provider).
4. Connect your account and click **Create Service**.
5. Copy the **Service ID** (e.g., `service_xxxxx`).

## 3. Create an Email Template
1. Go to the **Email Templates** tab.
2. Click **Create New Template**.
3. In the template editor, design your email. Use the following variables in double curly braces `{{ }}`:

   **Subject Line:**
   ```
   New Announcement: {{announcement_title}}
   ```

   **Content:**
   ```html
   <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
     <h2 style="color: #4F46E5;">New Announcement Posted</h2>
     <p>Dear {{to_name}},</p>
     
     <p>A new announcement has been posted on the Athlete File Management System.</p>
     
     <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
       <h3 style="margin-top: 0;">{{announcement_title}}</h3>
       <p style="white-space: pre-wrap;">{{announcement_content}}</p>
       <p style="font-size: 12px; color: #666; margin-top: 10px;">Posted on: {{date}}</p>
     </div>
     
     <p>Please log in to your dashboard to view more details.</p>
     
     <p>Best regards,<br>
     SSU APMS Admin Team</p>
   </div>
   ```

4. Click **Save**.
5. Copy the **Template ID** (e.g., `template_xxxxx`).

## 4. Get Your Public Key
1. Go to the **Account** page (click on your name/avatar in the top right).
2. Copy your **Public Key** (User ID).

## 5. Configure Environment Variables
1. Create a file named `.env.local` in the root of your project (if it doesn't exist).
2. Add the following lines, replacing the placeholders with your actual keys:

```env
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
```

3. Restart your development server (`npm run dev`) for the changes to take effect.

## Note on Usage
The free tier of EmailJS has a monthly limit (usually 200 emails). Since the system attempts to email *all* students when an announcement is created, be mindful of this limit during testing.
