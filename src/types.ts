export interface socialAuthConfig {
  /** Enable/disable the plugin */
  disabled?: boolean;
  
  /** Social providers configuration */
  providers: {
    /** GitHub OAuth configuration */
    github?: {
      clientId: string;
      clientSecret: string;
      /** Optional callback URL, defaults to /api/auth/github/callback */
      callbackURL?: string;
      /** Optional scope, defaults to 'read:user,user:email' */
      scope?: string;
    };
    
    /** Google OAuth configuration */
    google?: {
      clientId: string;
      clientSecret: string;
      /** Optional callback URL, defaults to /api/auth/google/callback */
      callbackURL?: string;
      /** Optional scope, defaults to 'openid email profile' */
      scope?: string;
    };
    
    /** Facebook OAuth configuration */
    facebook?: {
      clientId: string;
      clientSecret: string;
      /** Optional callback URL, defaults to /api/auth/facebook/callback */
      callbackURL?: string;
      /** Optional scope, defaults to 'email,public_profile' */
      scope?: string;
    };
    
    /** Twitter OAuth configuration */
    twitter?: {
      clientId: string;
      clientSecret: string;
      /** Optional callback URL, defaults to /api/auth/twitter/callback */
      callbackURL?: string;
      /** Optional scope, defaults to 'tweet.read users.read offline.access' */
      scope?: string;
    };
    
    /** LinkedIn OAuth configuration */
    linkedin?: {
      clientId: string;
      clientSecret: string;
      /** Optional callback URL, defaults to /api/auth/linkedin/callback */
      callbackURL?: string;
      /** Optional scope, defaults to 'r_liteprofile r_emailaddress' */
      scope?: string;
    };
  };
  
  /** JWT secret for signing auth tokens (optional if using Payload's secret) */
  jwtSecret?: string;
  
  /** Cookie name for storing auth state */
  cookieName?: string;
  
  /** Whether to automatically create users if they don't exist */
  autoCreateUser?: boolean;
  
  /** Default role for newly created social auth users */
  defaultRole?: string;
  
  /** Custom callback after successful social auth */
  onAuthSuccess?: (user: any, provider: string) => Promise<void> | void;
  
  /** Custom callback after failed social auth */
  onAuthFailure?: (error: any, provider: string) => Promise<void> | void;
}