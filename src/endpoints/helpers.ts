import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface ProviderConfig {
  callbackURL?: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export async function handleOAuthSuccess(
  req: any,
  email: string,
  provider: string,
  socialId: string
): Promise<Response> {
  console.log(`[OAuth Callback] Processing success for ${provider}:`, { email, socialId });

  // 1. Find or Create the Payload User
  const users = await req.payload.find({
    collection: 'users',
    where: { email: { equals: email } },
  });

  let user = users.docs[0];
  if (!user) {
    user = await req.payload.create({
      collection: 'users',
      data: {
        email,
        password: crypto.randomBytes(20).toString('hex'), // Random complex password
        socialId,
        socialProvider: provider,
        socialProviders: [
          {
            id: socialId,
            provider,
          }
        ]
      },
    });
    console.log(`[OAuth Callback] Created new user with ${provider}:`, { id: user.id, email: user.email });
  } else {
    console.log(`[OAuth Callback] Found existing user:`, { id: user.id, email: user.email });
    
    const existingProviders = Array.isArray((user).socialProviders) 
      ? [...(user).socialProviders] 
      : [];
      
    // Auto-migrate legacy user if array is empty but single fields exist
    if (existingProviders.length === 0 && (user).socialProvider) {
      existingProviders.push({
        id: (user).socialId,
        provider: (user).socialProvider,
      });
    }

    const hasThisProvider = existingProviders.some(
      (p: any) => p.provider === provider && p.id === socialId
    );

    const updateData: Record<string, any> = {};

    if (!hasThisProvider) {
      updateData.socialProviders = [
        ...existingProviders,
        {
          id: socialId,
          provider,
        }
      ];
      console.log(`[OAuth Callback] Linking additional provider ${provider} to existing user:`, { id: user.id });
    }

    // For backward compatibility, if the legacy socialProvider isn't set, set it
    if (!(user).socialProvider) {
      updateData.socialProvider = provider;
      updateData.socialId = socialId;
    }

    if (Object.keys(updateData).length > 0) {
      user = await req.payload.update({
        id: user.id,
        collection: 'users',
        data: updateData,
      });
    }
  }

  // 2. Generate Payload Session JWT
  const usersCollection = req.payload.config.collections.find(c => c.slug === 'users');
  const expiresIn = (usersCollection?.auth)?.tokenExpiration || 7200;
  
  const useSessions = (usersCollection?.auth)?.useSessions !== false;
  let sid: string | undefined;
  if (useSessions) {
    sid = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    
    const session = { id: sid, createdAt: now, expiresAt };
    
    const existingSessions = Array.isArray((user).sessions) ? (user).sessions : [];
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
    });
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

  // 3. Redirect securely to Admin Dashboard with Cookie using a new Response to avoid immutable headers TypeError
  return new Response(null, {
    headers: {
      Location: new URL('/admin', req.url).toString(),
      'Set-Cookie': cookieValue,
    },
    status: 302,
  });
}
