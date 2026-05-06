import type { Endpoint } from 'payload';
import { type ProviderConfig, handleOAuthSuccess } from './helpers.js';

export const createLinkedinEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/linkedin/callback`;
        const scope = config.scope || 'openid profile email';
        const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        return Response.redirect(linkedinAuthUrl);
      },
      method: 'get',
      path: '/oauth/linkedin',
    },
    {
      handler: async (req) => {
        const url = new URL(req.url || '', `http://localhost`);
        const code = url.searchParams.get('code');

        if (!code) {
          return Response.json({ error: 'No code provided' }, { status: 400 });
        }
        
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/linkedin/callback`;
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        });

        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          body: params.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        });
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return Response.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
        }

        let linkedinUser;
        try {
          const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });
          linkedinUser = await userRes.json();
        } catch (fetchErr: any) {
          return Response.json({ error: `Failed to fetch user data from LinkedIn: ${fetchErr.message}` }, { status: 500 });
        }

        const email = linkedinUser.email;
        if (!email) {
          return Response.json({ error: 'No email found on LinkedIn account' }, { status: 400 });
        }

        return handleOAuthSuccess(req, email, 'linkedin', String(linkedinUser.sub));
      },
      method: 'get',
      path: '/oauth/linkedin/callback',
    }
  ];
};
