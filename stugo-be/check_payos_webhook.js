import dotenv from 'dotenv';
import { getPayOS } from './src/config/payos.js';

dotenv.config();

const payos = getPayOS();
console.log('webhooks methods:', Object.keys(payos.webhooks || {}));
const proto = Object.getPrototypeOf(payos.webhooks || {});
console.log('webhooks proto:', Object.getOwnPropertyNames(proto));
