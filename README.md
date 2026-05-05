# Payload Social Auth Plugin

A social authentication plugin for Payload CMS that enables login with GitHub, Google, Facebook, Twitter, and LinkedIn.

## Installation

```bash
npm install payload-social-auth
# or
pnpm add payload-social-auth
```

## Usage

```javascript
import { buildConfig } from 'payload';
import { socialAuthPlugin } from 'payload-social-auth';

export default buildConfig({
  // ... your existing config
  plugins: [
    socialAuthPlugin({
      providers: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        // Add other providers as needed
      },
      jwtSecret: process.env.JWT_SECRET, // optional, defaults to Payload's secret
      cookieName: 'payload-social-auth-token', // optional
      autoCreateUser: true, // optional, defaults to true
      defaultRole: 'user', // optional, defaults to 'user'
      onAuthSuccess: async (user, provider) => {
        // Custom logic after successful authentication
        console.log(`User ${user.id} authenticated via ${provider}`);
      },
      onAuthFailure: async (error, provider) => {
        // Custom logic after failed authentication
        console.error(`Auth failed via ${provider}:`, error);
      }
    }),
  ],
});
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `disabled` | boolean | Enable/disable the plugin |
| `providers` | object | Configuration for social providers (github, google, facebook, twitter, linkedin) |
| `providers.[provider].clientId` | string | OAuth client ID |
| `providers.[provider].clientSecret` | string | OAuth client secret |
| `providers.[provider].callbackURL` | string | Optional callback URL |
| `providers.[provider].scope` | string | Optional OAuth scope |
| `jwtSecret` | string | JWT secret for signing tokens (optional) |
| `cookieName` | string | Cookie name for storing auth state (optional) |
| `autoCreateUser` | boolean | Whether to automatically create users (optional, defaults to true) |
| `defaultRole` | string | Default role for new users (optional, defaults to 'user') |
| `onAuthSuccess` | function | Callback after successful authentication |
| `onAuthFailure` | function | Callback after failed authentication |

## Provider Setup

### GitHub
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set callback URL to `https://your-domain.com/api/auth/github/callback`
4. Copy Client ID and Client Secret

### Google
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Set authorized redirect URI to `https://your-domain.com/api/auth/google/callback`
4. Copy Client ID and Client Secret

### Facebook
1. Go to https://developers.facebook.com/apps/
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs to `https://your-domain.com/api/auth/facebook/callback`
5. Copy App ID and App Secret

### Twitter
1. Go to https://developer.twitter.com/
2. Create a new project and app
3. Set Callback URI to `https://your-domain.com/api/auth/twitter/callback`
4. Copy API Key and API Secret Key

### LinkedIn
1. Go to https://www.linkedin.com/developers/
2. Create a new app
3. Set Redirect URL to `https://your-domain.com/api/auth/linkedin/callback`
4. Copy Client ID and Client Secret

## How It Works

1. The plugin adds two collections:
   - `social-auth-providers`: Stores provider configurations
   - `social-auth-tokens`: Stores user's social auth tokens

2. It adds API routes for OAuth callbacks:
   - `/api/auth/github/callback`
   - `/api/auth/google/callback`
   - `/api/auth/facebook/callback`
   - `/api/auth/twitter/callback`
   - `/api/auth/linkedin/callback`

3. When a user authenticates via a social provider:
   - The plugin handles the OAuth flow
   - Creates or finds a user in the `users` collection
   - Stores tokens in the `social-auth-tokens` collection
   - Returns a JWT for authentication

## License

MIT