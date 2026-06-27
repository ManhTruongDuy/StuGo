import dotenv from 'dotenv';
dotenv.config();

import emailService from './src/services/email.service.js';

const test = async () => {
  console.log('Testing sendWelcomeEmail...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  try {
    const result = await emailService.sendWelcomeEmail('truongduymanhtest@gmail.com', 'Truong Duy Manh');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

test();
