import nodemailer from 'nodemailer';

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

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error);
    return false;
  }
};

/**
 * Templates
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .highlight { color: #4f46e5; font-weight: 600; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { color: #6b7280; font-weight: 500; width: 40%; }
    .data-table td { font-weight: 600; color: #111827; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>StuGo</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Cảm ơn bạn đã đồng hành cùng StuGo!</p>
      <p>&copy; ${new Date().getFullYear()} StuGo. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Chào mừng bạn đến với StuGo! 🎉';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Chào mừng bạn đã gia nhập cộng đồng <strong>StuGo</strong>! Chúng tôi rất vui mừng khi có bạn đồng hành.</p>
    <p>Tại StuGo, chúng tôi cung cấp các dịch vụ tiện ích hàng đầu dành riêng cho học sinh, sinh viên như: đặt xe ghép, tìm phòng trọ, quán ăn, và vận chuyển.</p>
    <p>Hãy bắt đầu khám phá ngay hôm nay!</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'https://stu-go.vercel.app'}" class="btn">Khám phá StuGo</a>
    </div>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendBookingSuccessEmail = async (email, name, bookingData) => {
  const subject = 'Xác nhận Đặt dịch vụ thành công - StuGo ✅';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Cảm ơn bạn đã sử dụng dịch vụ của StuGo. Dưới đây là thông tin chi tiết về đơn đặt của bạn:</p>
    
    <table class="data-table">
      <tr>
        <th>Mã đơn hàng</th>
        <td>${bookingData.bookingCode || bookingData._id.toString().slice(-8).toUpperCase()}</td>
      </tr>
      <tr>
        <th>Dịch vụ</th>
        <td>${bookingData.serviceName}</td>
      </tr>
      <tr>
        <th>Ngày</th>
        <td>${new Date(bookingData.date).toLocaleDateString('vi-VN')}</td>
      </tr>
      ${bookingData.timeSlot ? `<tr><th>Khung giờ</th><td>${bookingData.timeSlot}</td></tr>` : ''}
      <tr>
        <th>Số lượng</th>
        <td>${bookingData.quantity}</td>
      </tr>
      <tr>
        <th>Tổng tiền</th>
        <td class="highlight">${bookingData.totalAmount.toLocaleString('vi-VN')}đ</td>
      </tr>
      <tr>
        <th>Cần cọc</th>
        <td class="highlight">${bookingData.depositAmount.toLocaleString('vi-VN')}đ</td>
      </tr>
    </table>
    
    <p style="margin-top: 20px;">Vui lòng hoàn tất thanh toán (nếu có) để chúng tôi giữ chỗ cho bạn.</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'https://stu-go.vercel.app'}/account" class="btn">Xem lịch sử đặt chỗ</a>
    </div>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendPaymentSuccessEmail = async (email, name, paymentData) => {
  const subject = 'Xác nhận Thanh toán thành công - StuGo 💳';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Chúng tôi đã nhận được khoản thanh toán của bạn. Dưới đây là chi tiết giao dịch:</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
      <h3 style="color: #166534; margin: 0; font-size: 24px;">+ ${paymentData.amount.toLocaleString('vi-VN')}đ</h3>
      <p style="color: #15803d; margin: 5px 0 0 0; font-weight: 500;">Giao dịch thành công</p>
    </div>

    <table class="data-table">
      <tr>
        <th>Mã thanh toán</th>
        <td>${paymentData.orderCode}</td>
      </tr>
      <tr>
        <th>Thời gian</th>
        <td>${new Date().toLocaleString('vi-VN')}</td>
      </tr>
      <tr>
        <th>Phương thức</th>
        <td>PayOS / Chuyển khoản</td>
      </tr>
    </table>
    
    <p style="margin-top: 20px;">Đơn đặt của bạn đã được xác nhận. Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.</p>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export default {
  sendWelcomeEmail,
  sendBookingSuccessEmail,
  sendPaymentSuccessEmail
};
