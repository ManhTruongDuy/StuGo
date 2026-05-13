import 'dotenv/config';
import { PayOS } from '@payos/node';

// Khởi tạo PayOS với object config (v2.x)
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// Log để verify (chỉ hiển thị khi không phải production)
if (process.env.NODE_ENV !== 'production') {
  console.log('PayOS init:', {
    clientId: !!process.env.PAYOS_CLIENT_ID,
    hasApiKey: !!process.env.PAYOS_API_KEY,
    hasChecksumKey: !!process.env.PAYOS_CHECKSUM_KEY,
    hasPaymentRequests: !!payOS.paymentRequests,
  });

  if (payOS.paymentRequests) {
    console.log('paymentRequests methods:', Object.keys(payOS.paymentRequests));
  }
}

/**
 * Get PayOS instance
 * @returns {PayOS} PayOS instance
 */
export const getPayOS = () => {
  return payOS;
};

/**
 * Validate PayOS configuration
 * @throws {Error} If required PayOS environment variables are missing
 */
export const validatePayOSConfig = () => {
  const requiredVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required PayOS environment variables: ${missingVars.join(', ')}`
    );
  }

  console.log('✅ PayOS configuration validated');
};

export default payOS;
