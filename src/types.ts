export interface socialAuthConfig {
  /** Whether to automatically create users if they don't exist */
  autoCreateUser?: boolean;
  
  /** Cookie name for storing auth state */
  cookieName?: string;
  
  /** Default role for newly created social auth users */
  defaultRole?: string;
  
  /** Enable/disable the plugin */
  disabled?: boolean;
  
  /** JWT secret for signing auth tokens (optional if using Payload's secret) */
  jwtSecret?: string;
  
  /** Custom callback after failed social auth */
  onAuthFailure?: (error: any, provider: string) => Promise<void> | void;
  
  /** Custom callback after successful social auth */
  onAuthSuccess?: (user: any, provider: string) => Promise<void> | void;
  
  /** Social providers configuration */
  providers: {
    /** Facebook OAuth configuration */
    facebook?: {
      /** Optional callback URL, defaults to /api/auth/facebook/callback */
      callbackURL?: string;
      clientId: string;
      clientSecret: string;
      /** Optional scope, defaults to 'email,public_profile' */
      scope?: string;
    };
    
    /** GitHub OAuth configuration */
    github?: {
      /** Optional callback URL, defaults to /api/auth/github/callback */
      callbackURL?: string;
      clientId: string;
      clientSecret: string;
      /** Optional scope, defaults to 'read:user,user:email' */
      scope?: string;
    };
    
    /** Google OAuth configuration */
    google?: {
      /** Optional callback URL, defaults to /api/auth/google/callback */
      callbackURL?: string;
      clientId: string;
      clientSecret: string;
      /** Optional scope, defaults to 'openid email profile' */
      scope?: string;
    };
    
    /** LinkedIn OAuth configuration */
    linkedin?: {
      /** Optional callback URL, defaults to /api/auth/linkedin/callback */
      callbackURL?: string;
      clientId: string;
      clientSecret: string;
      /** Optional scope, defaults to 'r_liteprofile r_emailaddress' */
      scope?: string;
    };
    
    /** Twitter OAuth configuration */
    twitter?: {
      /** Optional callback URL, defaults to /api/auth/twitter/callback */
      callbackURL?: string;
      clientId: string;
      clientSecret: string;
      /** Optional scope, defaults to 'tweet.read users.read offline.access' */
      scope?: string;
    };
  };
}