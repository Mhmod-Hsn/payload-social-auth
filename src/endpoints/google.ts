import type { Endpoint } from 'payload';

import { handleOAuthSuccess, type ProviderConfig } from './helpers.js';

export const createGoogleEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/google/callback`;
        const scope = config.scope || 'openid email profile';
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
        
        return Response.redirect(googleAuthUrl);
      },
      method: 'get',
      path: '/oauth/google',
    },
    {
      handler: async (req) => {
        const url = new URL(req.url || '', `http://localhost`);
        const code = url.searchParams.get('code');

        if (!code) {
          return Response.json({ error: 'No code provided' }, { status: 400 });
        }
        
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/google/callback`;
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return Response.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
        }

        let googleUser;
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });
          googleUser = await userRes.json();
        } catch (fetchErr: any) {
          return Response.json({ error: `Failed to fetch user data from Google: ${fetchErr.message}` }, { status: 500 });
        }

        const email = googleUser.email;
        if (!email) {
          return Response.json({ error: 'No email found on Google account' }, { status: 400 });
        }

        return handleOAuthSuccess(req, email, 'google', String(googleUser.sub));
      },
      method: 'get',
      path: '/oauth/google/callback',
    }
  ];
};
