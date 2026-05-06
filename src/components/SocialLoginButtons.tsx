import configPromise from '@payload-config';
import { getPayload } from 'payload';
import React from 'react';

import { FacebookIcon, GithubIcon, GoogleIcon, LinkedinIcon, TwitterIcon } from './icons/index.js';
import classes from './SocialLoginButtons.module.css';

export const SocialLoginButtons: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });
  const providers = payload.config.custom?.socialAuth || {};

  const githubEnabled = !!providers.github;
  const googleEnabled = !!providers.google;
  const facebookEnabled = !!providers.facebook;
  const linkedinEnabled = !!providers.linkedin;
  const twitterEnabled = !!providers.twitter;

  // If no providers are enabled, render nothing
  if (!githubEnabled && !googleEnabled && !facebookEnabled && !linkedinEnabled && !twitterEnabled) {
    return null;
  }

  return (
    <div className={classes.container}>
      <div className={classes.buttons}>
        {githubEnabled && (
          <a 
            className={`btn btn--style-secondary btn--size-medium ${classes.button}`} 
            href="/api/oauth/github"
          >
            <GithubIcon />
            <span>GitHub</span>
          </a>
        )}

        {googleEnabled && (
          <a 
            className={`btn btn--style-secondary btn--size-medium ${classes.button}`} 
            href="/api/oauth/google"
          >
            <GoogleIcon />
            <span>Google</span>
          </a>
        )}

        {facebookEnabled && (
          <a 
            className={`btn btn--style-secondary btn--size-medium ${classes.button}`} 
            href="/api/oauth/facebook"
          >
            <FacebookIcon />
            <span>Facebook</span>
          </a>
        )}

        {linkedinEnabled && (
          <a 
            className={`btn btn--style-secondary btn--size-medium ${classes.button}`} 
            href="/api/oauth/linkedin"
          >
            <LinkedinIcon />
            <span>LinkedIn</span>
          </a>
        )}

        {twitterEnabled && (
          <a 
            className={`btn btn--style-secondary btn--size-medium ${classes.button}`} 
            href="/api/oauth/twitter"
          >
            <TwitterIcon />
            <span>Twitter</span>
          </a>
        )}
      </div>
      <div className={classes.divider}>
        <div className={classes.dividerLine} />
        <span className={classes.dividerText}>Or continue with email</span>
        <div className={classes.dividerLine} />
      </div>
    </div>
  );
};
