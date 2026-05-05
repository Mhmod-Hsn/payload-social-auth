import { test, expect } from 'vitest';
import type { Config } from 'payload';
import { socialAuthPlugin } from '../src/index';

test('should add social auth collections when plugin is enabled', () => {
  // Create a minimal config
  const config: Config = {
    admin: {},
    collections: [],
    routes: undefined,
    // Required fields
    secret: 'test-secret',
    typescript: {
      outputFile: './payload-types.ts'
    }
  };
  
  // Apply the social auth plugin
  const pluginOptions = {
    providers: {
      github: {
        clientId: 'test-github-client-id',
        clientSecret: 'test-github-client-secret',
      },
      google: {
        clientId: 'test-google-client-id',
        clientSecret: 'test-google-client-secret',
      },
    },
  };
  
  const modifiedConfig = socialAuthPlugin(pluginOptions)(config);
  
  // Check that social auth collections were added
  const collectionSlugs = modifiedConfig.collections?.map(c => c.slug) || [];
  expect(collectionSlugs).toContain('social-auth-providers');
  expect(collectionSlugs).toContain('social-auth-tokens');
});

test('should not modify config when plugin is disabled', () => {
  // Create a minimal config
  const config: Config = {
    admin: {},
    collections: [{ slug: 'test-collection', fields: [] }],
    routes: [{ path: '/test', method: 'get', handler: () => {} }],
    // Required fields
    secret: 'test-secret',
    typescript: {
      outputFile: './payload-types.ts'
    }
  };
  
  const originalCollections = [...config.collections!];
  const originalRoutes = [...config.routes!];
  
  // Apply the social auth plugin with disabled: true
  const pluginOptions = {
    disabled: true,
    providers: {
      github: {
        clientId: 'test-github-client-id',
        clientSecret: 'test-github-client-secret',
      },
    },
  };
  
  const modifiedConfig = socialAuthPlugin(pluginOptions)(config);
  
  // Check that config is unchanged
  expect(modifiedConfig.collections).toEqual(originalCollections);
  expect(modifiedConfig.routes).toEqual(originalRoutes);
});