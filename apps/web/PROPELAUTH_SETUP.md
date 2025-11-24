# PropelAuth Setup Guide

## Environment Variables

Add these to your `.env` file (root of project):

```bash
# PropelAuth Configuration
NEXT_PUBLIC_PROPELAUTH_AUTH_URL=https://your-auth-url.propelauthtest.com
PROPELAUTH_API_KEY=your_api_key_here
PROPELAUTH_VERIFIER_KEY=your_verifier_key_here

# Special Key for Unlimited Game Creation (optional)
# This key can be shared with community members to bypass the 5-game limit
SPECIAL_KEY=your-secret-key-here
```

## Getting Your PropelAuth Credentials

1. **Sign up at PropelAuth**: https://www.propelauth.com/
2. **Create a new project**
3. **Get your Auth URL**:
   - Go to your project dashboard
   - Copy the "Auth URL" (e.g., `https://12345.propelauthtest.com`)
   - Set as `NEXT_PUBLIC_PROPELAUTH_AUTH_URL`

4. **Get your API Key**:
   - Go to "Backend Integration" in your PropelAuth dashboard
   - Copy the "API Key"
   - Set as `PROPELAUTH_API_KEY`

5. **Get your Verifier Key**:
   - Same location as API Key
   - Copy the "Verifier Key"  
   - Set as `PROPELAUTH_VERIFIER_KEY`

## Configure Allowed Domains

In your PropelAuth dashboard:
1. Go to "Configuration" → "Frontend Integration"
2. Add allowed domains:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)

## User Metadata for Payment Plans

PropelAuth supports custom user metadata. To track payment plans:

### Option 1: Use PropelAuth Organizations (Recommended)
- Create organizations for "Free" and "Paid" tiers
- Check user's organization membership

### Option 2: Custom Metadata
Add custom properties to users:
```typescript
{
  "plan": "free" | "paid",
  "gamesCreated": number,
  "subscriptionId": string // for Stripe/payment integration
}
```

## Implementation Notes

### Current Setup
- **Free Users**: Can create 5 games (tracked in localStorage)
- **Logged In Users**: Unlimited games
- **Auth Modal**: Shows after 5 games, friendly signup flow

### Future Payment Integration
When adding payments:
1. Add `plan` field to user metadata in PropelAuth
2. Update auth checks to verify `user.plan === 'paid'`
3. Integrate Stripe/payment provider
4. Update PropelAuth metadata on successful payment

## Special Key System

For users who hit the 5-game limit, they can request a special key to create unlimited games:

### How it works:
1. User creates 5 games and hits the limit
2. Modal appears prompting them to join Discord
3. They can request a special key in Discord
4. Admin provides the special key (set in `SPECIAL_KEY` env variable)
5. User enters the key in the modal
6. Key is validated against the server and stored in localStorage
7. User can now create unlimited games

### Setting up the special key:
```bash
# In your .env file
SPECIAL_KEY=my-super-secret-key-123
```

The special key is checked on both client and server side to ensure users can bypass the free tier limits.

Example:
```typescript
const { user } = useAuthInfo();
const isPaidUser = user?.metadata?.plan === 'paid';
const canCreateUnlimited = isLoggedIn && (isPaidUser || user?.metadata?.plan === 'free');
```

## Testing

1. Start the app: `npm run dev`
2. Go to `http://localhost:3000/create`
3. Try creating 6 games without logging in
4. Auth modal should appear after the 5th attempt
5. Click "Create Free Account" to test signup flow

## Deployment

When deploying to production:
1. Update PropelAuth allowed domains
2. Set environment variables in Vercel/deployment platform
3. Update redirect URLs in code if needed

