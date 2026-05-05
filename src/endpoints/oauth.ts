import type { Endpoint } from 'payload';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface ProviderConfig {
  callbackURL?: string;
  clientId: string;
  clientSecret: string;
}

export const createGithubEndpoints = (config: ProviderConfig): Endpoint[] => {
  return [
    {
      handler: (req) => {
        const redirectUri = config.callbackURL || `${req.protocol}://${req.host}/api/oauth/github/callback`;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
        
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
        
        // 1. Exchange code for access token
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

        // 2. Fetch user profile and emails
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

        console.log('[OAuth Callback] Successfully authenticated with GitHub:', { primaryEmail });

        // 3. Find or Create the Payload User
        const users = await req.payload.find({
          collection: 'users',
          where: { email: { equals: primaryEmail } },
        });

        let user = users.docs[0];
        if (!user) {
          user = await req.payload.create({
            collection: 'users',
            data: {
              email: primaryEmail,
              password: crypto.randomBytes(20).toString('hex'), // Random complex password
              socialProvider: 'github',
              socialId: String(githubUser.id),
            },
          });
          console.log('[OAuth Callback] Created new user:', { id: user.id, email: user.email });
        } else {
          console.log('[OAuth Callback] Found existing user:', { id: user.id, email: user.email });
          if (!(user as any).socialProvider) {
            user = await req.payload.update({
              id: user.id,
              collection: 'users',
              data: {
                socialProvider: 'github',
                socialId: String(githubUser.id),
              },
            }) as any;
            console.log('[OAuth Callback] Linked existing user to GitHub:', { id: user.id });
          }
        }

        // 4. Generate Payload Session JWT
        const usersCollection = req.payload.config.collections.find(c => c.slug === 'users');
        const expiresIn = (usersCollection?.auth as any)?.tokenExpiration || 7200;
        
        // Check if useSessions is enabled (enabled by default in Payload v3)
        const useSessions = (usersCollection?.auth as any)?.useSessions !== false;
        let sid: string | undefined;
        if (useSessions) {
          sid = crypto.randomUUID();
          const now = new Date();
          const expiresAt = new Date(now.getTime() + expiresIn * 1000);
          
          const session = { id: sid, createdAt: now, expiresAt };
          
          const existingSessions = Array.isArray((user as any).sessions) ? (user as any).sessions : [];
          const activeSessions = existingSessions.filter((s: any) => {
            const exp = s.expiresAt instanceof Date ? s.expiresAt : new Date(s.expiresAt);
            return exp > now;
          });
          activeSessions.push(session);
          
          user = await req.payload.update({
            id: user.id,
            collection: 'users',
            data: {
              sessions: activeSessions,
            },
          }) as any;
          console.log('[OAuth Callback] Successfully added session to database:', { sid });
        }

        const jwtPayload: Record<string, any> = {
          id: user.id,
          collection: 'users',
          email: user.email,
        };
        if (sid) {
          jwtPayload.sid = sid;
        }

        const token = jwt.sign(
          jwtPayload,
          req.payload.secret,
          { expiresIn }
        );

        const cookieName = `${req.payload.config.cookiePrefix || 'payload'}-token`;
        const cookieValue = `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiresIn}`;
        console.log('[OAuth Callback] Setting auth cookie:', { cookieName, cookieValue });

        try {
          const cookieStore = await cookies();
          cookieStore.set(cookieName, token, {
            httpOnly: true,
            maxAge: expiresIn,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
          console.log('[OAuth Callback] Successfully set cookie via next/headers:', cookieName);
        } catch (cookieErr: any) {
          console.error('[OAuth Callback] Failed to set cookie via next/headers:', cookieErr.message);
        }

        // 5. Redirect securely to Admin Dashboard with Cookie using a new Response to avoid immutable headers TypeError
        return new Response(null, {
          headers: {
            Location: new URL('/admin', req.url).toString(),
            'Set-Cookie': cookieValue,
          },
          status: 302,
        });
      },
      method: 'get',
      path: '/oauth/github/callback',
    }
  ];
};
