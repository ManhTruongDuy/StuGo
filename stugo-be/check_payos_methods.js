import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPayOS } from './src/config/payos.js';

dotenv.config();

const payos = getPayOS();
console.log('paymentRequests keys:', Object.keys(payos.paymentRequests || {}));
const proto = Object.getPrototypeOf(payos.paymentRequests || {});
console.log('paymentRequests proto keys:', Object.getOwnPropertyNames(proto));
