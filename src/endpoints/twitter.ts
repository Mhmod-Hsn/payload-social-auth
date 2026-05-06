import type { Endpoint } from 'payload';

import crypto from 'crypto';
import { cookies } from 'next/headers';

import { handleOAuthSuccess, type ProviderConfig } from './helpers.js';

export const createTwitterEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: async (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/twitter/callback`;
        const scope = config.scope || 'tweet.read users.read offline.access';
        
        const state = crypto.randomBytes(16).toString('hex');
        const codeVerifier = crypto.randomBytes(32).toString('hex').slice(0, 43);
        
        const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeVerifier}&code_challenge_method=plain`;
        
        try {
          const cookieStore = await cookies();
          cookieStore.set('twitter_state', state, { httpOnly: true, maxAge: 300, path: '/' });
          cookieStore.set('twitter_code_verifier', codeVerifier, { httpOnly: true, maxAge: 300, path: '/' });
        } catch (cookieErr: any) {
          console.error('[Twitter Auth] Failed to set state/verifier cookies:', cookieErr.message);
        }
        
        return new Response(null, {
          headers: {
            Location: twitterAuthUrl,
            'Set-Cookie': [
              `twitter_state=${state}; Max-Age=300; Path=/; HttpOnly`,
              `twitter_code_verifier=${codeVerifier}; Max-Age=300; Path=/; HttpOnly`
            ].join(', '),
          },
          status: 302,
        });
      },
      method: 'get',
      path: '/oauth/twitter',
    },
    {
      handler: async (req) => {
        const url = new URL(req.url || '', `http://localhost`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) {
          return Response.json({ error: 'No code provided' }, { status: 400 });
        }

        let cookieState;
        let codeVerifier;
        try {
          const cookieStore = await cookies();
          cookieState = cookieStore.get('twitter_state')?.value;
          codeVerifier = cookieStore.get('twitter_code_verifier')?.value;
        } catch (e) {
          // Fallback or skip if not readable
        }

        if (state && cookieState && state !== cookieState) {
          return Response.json({ error: 'Invalid state parameter' }, { status: 400 });
        }

        const verifier = codeVerifier || 'static_code_verifier_fallback_if_cookies_disabled';
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/twitter/callback`;

        const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        const params = new URLSearchParams({
          code,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        });

        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
          body: params.toString(),
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        });
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return Response.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
        }

        let twitterUser;
        try {
          const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username', {
            headers: { 
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });
          const resJson = await userRes.json();
          twitterUser = resJson.data;
        } catch (fetchErr: any) {
          return Response.json({ error: `Failed to fetch user data from Twitter: ${fetchErr.message}` }, { status: 500 });
        }

        if (!twitterUser) {
          return Response.json({ error: 'Failed to retrieve Twitter user info' }, { status: 400 });
        }

        const email = twitterUser.email || `${twitterUser.username}@twitter.com`;

        return handleOAuthSuccess(req, email, 'twitter', String(twitterUser.id));
      },
      method: 'get',
      path: '/oauth/twitter/callback',
    }
  ];
};
