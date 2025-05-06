# Supabase Authentication Setup

This guide will help you set up Supabase authentication with both Google OAuth and email/password for the A2A Client application.

## Troubleshooting

If authentication is not working, try these steps:

1. Visit http://localhost:5173/supabase-test to test your Supabase connection directly
2. Make sure your .env.local file is properly set up (see Step 4 below)
3. Check that your redirect URLs in Supabase match exactly what the application is using
4. Verify your Google OAuth configuration in the Google Cloud Console
5. Check browser console for any errors
6. Make sure email confirmation is set up correctly if you're using password authentication

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Take note of your project URL and anon key from the Project Settings > API section

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set up the OAuth consent screen if prompted
6. For "Application type", select "Web application"
7. Add your authorized domain (e.g., `localhost` for development)
8. Add authorized redirect URIs:
   - `https://YOUR_SUPABASE_PROJECT_URL/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for local development)
9. Take note of your Client ID and Client Secret

## Step 3: Configure Supabase Authentication

### Google Authentication
1. In the Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Enter the Client ID and Client Secret from Google
4. Save the configuration

### Email/Password Authentication
1. In the Supabase dashboard, go to Authentication > Providers
2. Make sure Email provider is enabled
3. Configure email settings:
   - Choose whether to require email confirmation
   - Set up SMTP settings if you want to send real emails
   - For development, you can use Supabase's built-in email service

### Email Templates
1. Customize email templates in Authentication > Email Templates
2. You can customize the following templates:
   - Confirmation email
   - Invitation email
   - Magic link email
   - Reset password email

## Step 4: Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**IMPORTANT**: After creating or modifying the .env.local file, you must restart your development server for the changes to take effect.

## Step 5: Run the Application

```bash
npm install
npm run dev
```

Visit the application at `http://localhost:5173` and you should now be able to log in with Google or email/password!

## Helper Script

We've included a helper script to set up your environment variables:

```bash
node setup-env.js
```

This interactive script will guide you through setting up your Supabase credentials.

## Additional Configuration

### URL Redirects
Make sure your URL redirects in the Supabase project match your development and production URLs:

1. Go to Authentication > URL Configuration
2. Add your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs (e.g., `http://localhost:5173/auth/callback`)

### Password Policies
You can configure password strength requirements in Authentication > Policies:
1. Set minimum password length
2. Require numbers, special characters, etc. 