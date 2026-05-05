import type { Config } from 'payload';

import path from 'path';
import { fileURLToPath } from 'url';

import type { socialAuthConfig } from './types.js';

import { createGithubEndpoints } from './endpoints/oauth.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const socialAuthPlugin =
  (pluginOptions: socialAuthConfig) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config;
    }

    // 1. Pass active providers to custom config so the Server Component can read it
    config.custom = {
      ...config.custom,
      socialAuth: {
        github: !!pluginOptions.providers?.github,
        google: !!pluginOptions.providers?.google,
      },
    };

    const configDir = process.env.PAYLOAD_CONFIG_PATH 
      ? path.dirname(path.resolve(process.env.PAYLOAD_CONFIG_PATH))
      : path.resolve(process.cwd(), './dev');

    const componentPath = path.relative(
      configDir,
      path.resolve(dirname, './components/SocialLoginButtons.tsx')
    );

    // 2. Inject UI Component
    config.admin = {
      ...config.admin,
      components: {
        ...config.admin?.components,
        beforeLogin: [
          ...(config.admin?.components?.beforeLogin || []),
          componentPath + '#SocialLoginButtons',
        ],
      },
    };

    // 3. Register OAuth Endpoints dynamically based on config options
    const endpoints = [];
    
    if (pluginOptions.providers?.github) {
      endpoints.push(...createGithubEndpoints(pluginOptions.providers.github));
    }

    config.endpoints = [
      ...(config.endpoints || []),
      ...endpoints,
    ];

    return config;
  };
