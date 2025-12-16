# Environment Variables Setup

This project requires the following environment variables to be set. Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

### Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**How to get Clerk keys:**
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **API Keys** (https://dashboard.clerk.com/last-active?path=api-keys)
4. Copy the **Publishable Key** and **Secret Key**

### Database
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public
```

### Optional: Vercel Blob Storage (for file uploads)
```bash
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

## Setup Instructions

1. Create a `.env.local` file in the project root:
   ```bash
   touch .env.local
   ```

2. Add all required environment variables to `.env.local`

3. For production builds (Vercel, etc.), add these same variables in your deployment platform's environment variables settings.

## Important Notes

- `.env.local` is gitignored and should never be committed
- The `NEXT_PUBLIC_` prefix is required for client-side accessible variables
- Without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, the build will fail with a Clerk error

