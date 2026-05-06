import type { Endpoint } from 'payload';

import { handleOAuthSuccess, type ProviderConfig } from './helpers.js';

export const createFacebookEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/facebook/callback`;
        const scope = config.scope || 'email,public_profile';
        const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        return Response.redirect(facebookAuthUrl);
      },
      method: 'get',
      path: '/oauth/facebook',
    },
    {
      handler: async (req) => {
        const url = new URL(req.url || '', `http://localhost`);
        const code = url.searchParams.get('code');

        if (!code) {
          return Response.json({ error: 'No code provided' }, { status: 400 });
        }
        
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/facebook/callback`;
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${config.clientSecret}&code=${code}`);
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return Response.json({ error: tokenData.error.message }, { status: 400 });
        }

        let facebookUser;
        try {
          const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
          facebookUser = await userRes.json();
        } catch (fetchErr: any) {
          return Response.json({ error: `Failed to fetch user data from Facebook: ${fetchErr.message}` }, { status: 500 });
        }

        const email = facebookUser.email || `${facebookUser.id}@facebook.com`;

        return handleOAuthSuccess(req, email, 'facebook', String(facebookUser.id));
      },
      method: 'get',
      path: '/oauth/facebook/callback',
    }
  ];
};
