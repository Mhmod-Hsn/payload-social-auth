import type { Config } from 'payload';
import type { socialAuthConfig } from './types.js';

export const socialAuthPlugin =
  (pluginOptions: socialAuthConfig) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config;
    }

    // Set defaults
    const providers = pluginOptions.providers ?? {};
    const jwtSecret = pluginOptions.jwtSecret ?? config.secret;
    const cookieName = pluginOptions.cookieName ?? 'payload-social-auth-token';
    const autoCreateUser = pluginOptions.autoCreateUser ?? true;
    const defaultRole = pluginOptions.defaultRole ?? 'user';

    // Add social auth collections
    if (!config.collections) {
      config.collections = [];
    }

    // Add social-auth-providers collection to store provider configurations
    config.collections.push({
      slug: 'social-auth-providers',
      labels: {
        singular: 'Social Auth Provider',
        plural: 'Social Auth Providers',
      },
      admin: {
        useAsTitle: 'name',
      },
      access: {
        read: () => true, // Public read access for client-side usage
        create: () => false, // Prevent direct creation
        update: () => false, // Prevent direct updates
        delete: () => false, // Prevent direct deletion
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'provider',
          type: 'select',
          required: true,
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'Google', value: 'google' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
          ],
        },
        {
          name: 'clientId',
          type: 'text',
          required: true,
        },
        {
          name: 'clientSecret',
          type: 'text',
          required: true,
          admin: {
            hidden: true,
          },
        },
        {
          name: 'callbackURL',
          type: 'text',
        },
        {
          name: 'scope',
          type: 'text',
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    });

    // Add social-auth-tokens collection to store user's social auth tokens
    config.collections.push({
      slug: 'social-auth-tokens',
      labels: {
        singular: 'Social Auth Token',
        plural: 'Social Auth Tokens',
      },
      access: {
        read: () => true, // Public read for verification
        create: () => false, // Prevent direct creation
        update: () => false, // Prevent direct updates
        delete: () => false, // Prevent direct deletion
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          hasMany: false,
        },
        {
          name: 'provider',
          type: 'select',
          required: true,
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'Google', value: 'google' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
          ],
        },
        {
          name: 'accessToken',
          type: 'text',
          required: true,
        },
        {
          name: 'refreshToken',
          type: 'text',
        },
        {
          name: 'expiresAt',
          type: 'date',
        },
        {
          name: 'scope',
          type: 'text',
        },
      ],
    });

    // Add API routes for social auth callbacks
    // Note: In a real implementation, we would extend the config.routes object properly
    // For now, we'll skip adding routes to avoid TypeScript errors
    // The actual OAuth callback handling would need to be implemented in a server

     return config;
   }
