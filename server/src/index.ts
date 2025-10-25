import dotenv from 'dotenv';
import { createHubServer } from './hub.js';

dotenv.config();

createHubServer({
  host: process.env.SIGNAL_HOST || '0.0.0.0',
  port: Number(process.env.SIGNAL_PORT || 8787),
  corsOrigin: process.env.CORS_ORIGIN || '*',
});
