import configPromise from '@payload-config';
import { getPayload } from 'payload';
import React from 'react';

const sharedButtonStyles: React.CSSProperties = {
  maxWidth: 'fit-content',
  textAlign: 'center',
  textDecoration: 'none',
}

export const SocialLoginButtons: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });
  const providers = payload.config.custom?.socialAuth || {};

  const githubEnabled = providers.github;
  const googleEnabled = providers.google;

  // If no providers are enabled, render nothing
  if (!githubEnabled && !googleEnabled) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>


      {githubEnabled && (
        <a 
          className="btn btn--style-secondary btn--size-medium" 
          href="/api/oauth/github"
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          GitHub
        </a>
      )}

      {googleEnabled && (
        <a 
          className="btn btn--style-secondary btn--size-medium" 
          href="/api/oauth/google"
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          Google
        </a>
      )}   
      
      <div style={{ alignItems: 'center', color: 'var(--theme-elevation-400)', display: 'flex', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--theme-elevation-200)', flex: 1, height: '1px' }} />
        <span style={{ fontSize: '0.8rem', padding: '0 10px', textTransform: 'uppercase' }}>Or continue with</span>
        <div style={{ backgroundColor: 'var(--theme-elevation-200)', flex: 1, height: '1px' }} />
      </div>
    </div>
  );
};
