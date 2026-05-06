import type { Config } from 'payload';

import path from 'path';
import { fileURLToPath } from 'url';

import type { socialAuthConfig } from './types.js';

import {
  createFacebookEndpoints,
  createGithubEndpoints,
  createGoogleEndpoints,
  createLinkedinEndpoints,
  createTwitterEndpoints,
} from './endpoints/oauth.js';

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
        facebook: !!pluginOptions.providers?.facebook,
        github: !!pluginOptions.providers?.github,
        google: !!pluginOptions.providers?.google,
        linkedin: !!pluginOptions.providers?.linkedin,
        twitter: !!pluginOptions.providers?.twitter,
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
    if (pluginOptions.providers?.google) {
      endpoints.push(...createGoogleEndpoints(pluginOptions.providers.google));
    }
    if (pluginOptions.providers?.facebook) {
      endpoints.push(...createFacebookEndpoints(pluginOptions.providers.facebook));
    }
    if (pluginOptions.providers?.linkedin) {
      endpoints.push(...createLinkedinEndpoints(pluginOptions.providers.linkedin));
    }
    if (pluginOptions.providers?.twitter) {
      endpoints.push(...createTwitterEndpoints(pluginOptions.providers.twitter));
    }

    config.endpoints = [
      ...(config.endpoints || []),
      ...endpoints,
    ];

    // 4. Inject social fields and override email field on auth collections
    config.collections = (config.collections || []).map((collection) => {
      if (collection.auth) {
        let newFields = [...collection.fields];

        if (!newFields.some((field) => 'name' in field && field.name === 'socialProvider')) {
          newFields.push({
            name: 'socialProvider',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              hidden: true,
            },
          });
        }

        if (!newFields.some((field) => 'name' in field && field.name === 'socialId')) {
          newFields.push({
            name: 'socialId',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              hidden: true,
            },
          });
        }

        if (!newFields.some((field) => 'name' in field && field.name === 'socialProviders')) {
          newFields.push({
            name: 'socialProviders',
            type: 'array',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            fields: [
              {
                name: 'provider',
                type: 'text',
                required: true,
              },
              {
                name: 'id',
                type: 'text',
                required: true,
              },
            ],
          });
        }

        const hasEmailField = newFields.some(
          (field) => 'name' in field && field.name === 'email'
        );

        if (!hasEmailField) {
          newFields.push({
            name: 'email',
            type: 'email',
            access: {
              update: ({ doc }) => {
                // If socialProvider is present, disable email editing
                return !doc?.socialProvider;
              },
            },
            required: true,
            unique: true,
          });
        } else {
          newFields = newFields.map((field) => {
            if ('name' in field && field.name === 'email') {
              return {
                ...field,
                access: {
                  ...(field as any).access,
                  update: ({ doc }) => {
                    return !doc?.socialProvider;
                  },
                },
              };
            }
            return field;
          });
        }

        return {
          ...collection,
          fields: newFields,
        };
      }
      return collection;
    });

    return config;
  };
