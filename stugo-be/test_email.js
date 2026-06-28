import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const testEmail = async () => {
  console.log('Testing SMTP connection with:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  try {
    const transporter = createTransporter();

    // verify connection configuration
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Server is ready to take our messages');

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: 'truongduymanhtest@gmail.com',
      subject: 'Test Email từ StuGo Backend',
      html: '<h1>Đây là email test</h1><p>Nếu bạn nhận được email này, SMTP đã hoạt động bình thường!</p>',
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ' + info.messageId);
  } catch (error) {
    console.error('Error during email sending:');
    console.error(error);
  }
};

testEmail();
