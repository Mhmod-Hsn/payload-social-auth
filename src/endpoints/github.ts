import type { Endpoint } from 'payload';

import { handleOAuthSuccess, type ProviderConfig } from './helpers.js';

export const createGithubEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/github/callback`;
        const scope = config.scope || 'read:user,user:email';
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        return Response.redirect(githubAuthUrl);
      },
      method: 'get',
      path: '/oauth/github',
    },
    {
      handler: async (req) => {
        const url = new URL(req.url || '', `http://localhost`);
        const code = url.searchParams.get('code');

        if (!code) {
          return Response.json({ error: 'No code provided' }, { status: 400 });
        }
        
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
          }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return Response.json({ error: tokenData.error_description }, { status: 400 });
        }

        let githubUser;
        let emails;
        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: { 
              Authorization: `Bearer ${tokenData.access_token}`,
              'User-Agent': 'payload-social-auth'
            },
          });
          githubUser = await userRes.json();

          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: { 
              Authorization: `Bearer ${tokenData.access_token}`,
              'User-Agent': 'payload-social-auth'
            },
          });
          emails = await emailRes.json();
        } catch (fetchErr: any) {
          return Response.json({ error: `Failed to fetch user data from GitHub: ${fetchErr.message}` }, { status: 500 });
        }

        if (!Array.isArray(emails)) {
          return Response.json({ details: emails, error: 'GitHub returned invalid email list' }, { status: 400 });
        }

        const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;

        if (!primaryEmail) {
          return Response.json({ error: 'No email found on GitHub account' }, { status: 400 });
        }

        return handleOAuthSuccess(req, primaryEmail, 'github', String(githubUser.id));
      },
      method: 'get',
      path: '/oauth/github/callback',
    }
  ];
};
