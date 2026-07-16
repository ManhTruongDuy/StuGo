import nodemailer from 'nodemailer';
import { promises as dns } from 'node:dns';

let smtpWarningPrinted = false;

const getSmtpConfig = () => {
  const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || null;
  const host = process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST || (brevoKey ? 'smtp-relay.brevo.com' : null);
  const portRaw = process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || (host ? '587' : null);
  const user = process.env.SMTP_USER || process.env.BREVO_SMTP_USER || (brevoKey ? 'apikey' : null);
  const pass = process.env.SMTP_PASS || process.env.BREVO_SMTP_PASS || brevoKey;
  const from = process.env.SMTP_FROM || process.env.BREVO_SMTP_FROM || null;
  const port = portRaw ? parseInt(portRaw, 10) : null;

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: String(portRaw) === '465',
  };
};

const getMissingSmtpVars = () => {
  const config = getSmtpConfig();
  const missing = [];
  if (!config.host) missing.push('SMTP_HOST/BREVO_SMTP_HOST');
  if (!config.port || Number.isNaN(config.port)) missing.push('SMTP_PORT/BREVO_SMTP_PORT');
  if (!config.user) missing.push('SMTP_USER/BREVO_SMTP_USER');
  if (!config.pass) missing.push('SMTP_PASS/BREVO_SMTP_PASS/BREVO_API_KEY');
  if (!config.from) missing.push('SMTP_FROM/BREVO_SMTP_FROM');
  return missing;
};

const isEmailConfigured = () => getMissingSmtpVars().length === 0;

const logSmtpWarning = () => {
  if (smtpWarningPrinted) return;
  const missing = getMissingSmtpVars();
  if (missing.length > 0) {
    console.warn(`[Email Service] SMTP is not configured. Missing: ${missing.join(', ')}. Email will be skipped.`);
  }
  smtpWarningPrinted = true;
};

const getSmtpCandidates = () => {
  const config = getSmtpConfig();
  const host = config.host;
  const rawPort = config.port || 587;
  const candidates = [{ port: rawPort, secure: rawPort === 465 }];

  // Gmail often works better on 465 in some cloud networks.
  if (host === 'smtp.gmail.com' && rawPort === 587) {
    candidates.push({ port: 465, secure: true });
  }

  return candidates;
};

const resolveSmtpHost = async (host) => {
  try {
    const ipv4List = await dns.resolve4(host);
    if (Array.isArray(ipv4List) && ipv4List.length > 0) {
      return {
        connectHost: ipv4List[0],
        servername: host,
      };
    }
  } catch (error) {
    // Fall back to original host if IPv4 resolution fails.
  }

  return {
    connectHost: host,
    servername: host,
  };
};

const createTransporter = (host, port, secure, servername) => {
  const config = getSmtpConfig();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      servername,
    },
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!isEmailConfigured()) {
      logSmtpWarning();
      return false;
    }

    const config = getSmtpConfig();

    const mailOptions = {
      from: config.from,
      to,
      subject,
      html: htmlContent,
    };

    let lastError = null;
    const resolved = await resolveSmtpHost(config.host);
    for (const candidate of getSmtpCandidates()) {
      try {
        const transporter = createTransporter(
          resolved.connectHost,
          candidate.port,
          candidate.secure,
          resolved.servername
        );
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent to ${to}: ${info.messageId} via ${config.host}:${candidate.port}`);
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unknown SMTP error');
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error);
    return false;
  }
};

export const verifyEmailConnection = async () => {
  const config = getSmtpConfig();
  const missingVars = getMissingSmtpVars();

  if (missingVars.length > 0) {
    return {
      ok: false,
      configured: false,
      missingVars,
      host: config.host || null,
      port: config.port ? String(config.port) : null,
      secure: config.secure,
      message: 'SMTP is not fully configured'
    };
  }

  try {
    const timeoutMs = 12000;
    let lastError = null;
    const resolved = await resolveSmtpHost(config.host);

    for (const candidate of getSmtpCandidates()) {
      try {
        const transporter = createTransporter(
          resolved.connectHost,
          candidate.port,
          candidate.secure,
          resolved.servername
        );
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`SMTP verification timeout after ${timeoutMs}ms`)), timeoutMs);
          })
        ]);

        return {
          ok: true,
          configured: true,
          missingVars: [],
          host: config.host,
          port: String(candidate.port),
          secure: candidate.secure,
          message: 'SMTP connection is healthy'
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('SMTP verification failed');
  } catch (error) {
    return {
      ok: false,
      configured: true,
      missingVars: [],
      host: config.host,
      port: config.port ? String(config.port) : null,
      secure: config.secure,
      message: error.message || 'SMTP verification failed',
      code: error.code || null
    };
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
    </table>
    
    <p style="margin-top: 20px;">Cảm ơn bạn đã lựa chọn StuGo.</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'https://stu-go.vercel.app'}/account" class="btn">Xem lịch sử đặt chỗ</a>
    </div>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendRefundEmail = async (email, name, amount, bankInfo, isApproved, reason) => {
  const subject = isApproved ? 'Xác nhận hoàn tiền thành công - StuGo' : 'Thông báo từ chối hoàn tiền - StuGo';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Yêu cầu hoàn tiền của bạn đã được xử lý.</p>
    <table class="data-table">
      <tr>
        <th>Trạng thái</th>
        <td class="highlight">${isApproved ? 'Đã phê duyệt' : 'Từ chối'}</td>
      </tr>
      ${isApproved ? `
      <tr>
        <th>Số tiền hoàn</th>
        <td>${amount.toLocaleString('vi-VN')}đ</td>
      </tr>
      <tr>
        <th>Tài khoản nhận</th>
        <td>${bankInfo.bankName} - ${bankInfo.bankAccount} (${bankInfo.bankAccountName})</td>
      </tr>
      ` : ''}
      <tr>
        <th>Lí do / Ghi chú</th>
        <td>${reason || 'Hoàn tiền theo chính sách hệ thống'}</td>
      </tr>
    </table>
    <p style="margin-top: 20px;">Trân trọng,<br><strong>Đội ngũ StuGo</strong></p>
  `;
  return sendEmail(email, subject, baseTemplate(content));
};

export const sendHealthCheckEmail = async (email, name = 'Admin') => {
  const subject = '[StuGo] Email Health Check';
  const content = `
    <h2 style="color: #111827; margin-top: 0;">Xin chào ${name},</h2>
    <p>Đây là email kiểm tra kết nối SMTP/Brevo từ hệ thống StuGo.</p>
    <table class="data-table">
      <tr><th>Thời gian</th><td>${new Date().toISOString()}</td></tr>
      <tr><th>Môi trường</th><td>${process.env.NODE_ENV || 'development'}</td></tr>
      <tr><th>Provider</th><td>${process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY ? 'Brevo SMTP' : 'Generic SMTP'}</td></tr>
    </table>
    <p style="margin-top: 16px;">Nếu bạn nhận được email này, cấu hình gửi mail đang hoạt động.</p>
  `;

  return sendEmail(email, subject, baseTemplate(content));
};

export default {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPremiumWelcomeEmail,
  sendBookingSuccessEmail,
  sendRefundEmail,
  sendHealthCheckEmail,
  verifyEmailConnection
};
