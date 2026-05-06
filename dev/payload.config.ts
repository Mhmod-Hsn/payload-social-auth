import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import { socialAuthPlugin } from '../src/index.js';
import { testEmailAdapter } from './helpers/testEmailAdapter.js';
import { seed } from './seed.js';

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  const isTesting = process.env.NODE_ENV === 'test'
  if (isTesting) {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'users',
        auth: true, 
        fields: [],
      },
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
    ],
    db: isTesting ? mongooseAdapter({
      url: process.env.DATABASE_URL || `mongodb://localhost:27017/payloadmemory`,
    }) : sqliteAdapter({
      client: {
        url: `file:${path.resolve(dirname, 'payload.db')}`,
      },
    }),
 
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      socialAuthPlugin({
      providers: {
        github: {
          callbackURL: 'http://localhost:3000/api/oauth/github/callback',
          clientId: process.env.GITHUB_CLIENT_ID || 'dummy_github_id',
          clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_github_secret',
        },
        google: {
          callbackURL: 'http://localhost:3000/api/oauth/google/callback',
          clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_google_id',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret',
        },
        linkedin: {
          callbackURL: 'http://localhost:3000/api/oauth/linkedin/callback',
          clientId: process.env.LINKEDIN_CLIENT_ID || 'dummy_linkedin_id',
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'dummy_linkedin_secret',
        },
        facebook: {
          callbackURL: 'http://localhost:3000/api/oauth/facebook/callback',
          clientId: process.env.FACEBOOK_CLIENT_ID || 'dummy_facebook_id',
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'dummy_facebook_secret',
        },
        twitter: {
          callbackURL: 'http://localhost:3000/api/oauth/twitter/callback',
          clientId: process.env.TWITTER_CLIENT_ID || 'dummy_twitter_id',
          clientSecret: process.env.TWITTER_CLIENT_SECRET || 'dummy_twitter_secret',
        },
      },
    }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
 