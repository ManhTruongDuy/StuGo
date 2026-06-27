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
    ul { padding-left: 20px; }
    li { margin-bottom: 10px; }
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
  </div>
</body>
</html>
`;

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Chào mừng bạn đến với StuGo!';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Chào mừng bạn đến với <strong>StuGo!</strong> 🎉</p>
    <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng của chúng tôi.</p>
    <p>StuGo là nền tảng hỗ trợ sinh viên tìm kiếm, so sánh và đặt vé xe liên tỉnh một cách nhanh chóng, minh bạch và thuận tiện.</p>
    <p>Với tài khoản StuGo, bạn có thể:</p>
    <p>🚌 Tìm kiếm các tuyến xe phù hợp.</p>
    <p>💺 So sánh nhà xe, giá vé và thời gian khởi hành.</p>
    <p>🎫 Đặt vé trực tuyến dễ dàng.</p>
    <p>📋 Quản lý lịch sử đặt vé.</p>
    <p>🎁 Nhận các ưu đãi và chương trình dành riêng cho thành viên.</p>
    <p>Chúng tôi rất vui khi được đồng hành cùng bạn trên những hành trình sắp tới.</p>
    <p>Nếu cần hỗ trợ, đừng ngần ngại liên hệ với đội ngũ StuGo. Mọi thông tin liên hệ:</p>
    <p>
      <strong>TEL:</strong> 0962758608<br>
      <strong>Email:</strong> stugo.service@gmail.com
    </p>
    <p>Trân trọng,<br><strong>Đội ngũ StuGo</strong></p>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendPaymentSuccessEmail = async (email, name) => {
  const subject = 'Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của StuGo';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Đội ngũ StuGo xin chân thành cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
    <p>Giao dịch của bạn đã được ghi nhận thành công. Sự lựa chọn của bạn là động lực để StuGo không ngừng cải thiện chất lượng sản phẩm và mang đến trải nghiệm tốt hơn cho cả khách hàng và đối tác.</p>
    <p>Chúng tôi hy vọng StuGo sẽ luôn là người bạn đồng hành đáng tin cậy trong những chuyến đi sắp tới cũng như các nhu cầu sử dụng dịch vụ của bạn.</p>
    <p>Nếu trong quá trình sử dụng bạn có bất kỳ thắc mắc hoặc góp ý nào, đừng ngần ngại liên hệ với đội ngũ StuGo. Mọi ý kiến của bạn đều là cơ sở quan trọng giúp chúng tôi tiếp tục hoàn thiện nền tảng.</p>
    <p>Một lần nữa, xin chân thành cảm ơn bạn đã đồng hành cùng StuGo.</p>
    <p>Kính chúc bạn sức khỏe, thành công và có nhiều trải nghiệm tuyệt vời!</p>
    <p>Mọi thông tin liên hệ:</p>
    <p>
      <strong>TEL:</strong> 0962758608<br>
      <strong>Email:</strong> stugo.service@gmail.com
    </p>
    <p>Trân trọng,<br><strong>Đội ngũ StuGo</strong><br><em>Đồng hành cùng sinh viên trên mọi hành trình.</em></p>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendPremiumWelcomeEmail = async (email, name) => {
  const subject = 'Chúc mừng! Bạn đã trở thành thành viên StuGo Premium';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>🎉 <strong>Chúc mừng!</strong></p>
    <p>Tài khoản của bạn đã được nâng cấp thành công lên StuGo Premium.</p>
    <p>Là thành viên Premium, bạn sẽ được hưởng nhiều quyền lợi đặc biệt như:</p>
    <p>⭐ Ưu tiên hỗ trợ khách hàng.</p>
    <p>🎁 Nhận các ưu đãi và khuyến mãi độc quyền.</p>
    <p>🔔 Thông báo sớm về các tuyến xe mới và chương trình ưu đãi.</p>
    <p>💙 Trải nghiệm dịch vụ tốt hơn với nhiều tiện ích dành riêng cho thành viên Premium.</p>
    <p>Cảm ơn bạn đã tin tưởng và đồng hành cùng StuGo.</p>
    <p>Chúng tôi hy vọng StuGo Premium sẽ mang đến cho bạn những trải nghiệm di chuyển thuận tiện và tiết kiệm hơn.</p>
    <p>Mọi thông tin liên hệ:</p>
    <p>
      <strong>TEL:</strong> 0962758608<br>
      <strong>Email:</strong> stugo.service@gmail.com
    </p>
    <p>Trân trọng,<br><strong>Đội ngũ StuGo</strong></p>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendBookingSuccessEmail = async (email, name, bookingData) => {
  const subject = 'Xác nhận Đặt dịch vụ thành công - StuGo';
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

export default {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPremiumWelcomeEmail,
  sendBookingSuccessEmail
};
