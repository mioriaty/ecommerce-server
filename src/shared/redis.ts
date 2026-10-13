import { Redis } from 'ioredis';
import Redlock from 'redlock';
import envConfig from './config.js';

export const redis = new Redis(envConfig.REDIS_URL);
export const redlock = new Redlock([redis], {
  retryCount: 3,
  retryDelay: 200 // time in ms
});
