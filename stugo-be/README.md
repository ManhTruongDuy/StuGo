# StuGo Backend API

Backend API cho nền tảng StuGo - kết nối sinh viên với nhà xe, nhà trọ và quán ăn.

## Cấu trúc thư mục

```
stugo-be/
├── src/
│   ├── controllers/     # Business logic handlers
│   ├── models/          # Mongoose schemas
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middlewares
│   └── index.js         # Entry point
├── .env                 # Environment variables
├── .env.example         # Example env file
└── package.json
```

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Chạy production
npm start
```

## Environment Variables

Tạo file `.env` dựa trên `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stugo
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# PayOS
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
```

## PayOS Integration

Dự án sử dụng [PayOS](https://payos.vn) để xử lý thanh toán:

1. Đăng ký tài khoản tại [PayOS](https://my.payos.vn)
2. Lấy Client ID, API Key, Checksum Key từ Dashboard
3. Cập nhật vào file `.env`

### Webhook

Cấu hình webhook URL trong PayOS Dashboard:
```
https://your-domain.com/api/payments/webhook
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Đăng nhập Google OAuth
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### Services
- `GET /api/services` - Lấy danh sách dịch vụ
- `GET /api/services/:id` - Chi tiết dịch vụ
- `POST /api/services` - Tạo dịch vụ mới (Partner)
- `PUT /api/services/:id` - Cập nhật dịch vụ
- `DELETE /api/services/:id` - Xóa dịch vụ
- `GET /api/services/popular` - Dịch vụ phổ biến
- `GET /api/services/nearby` - Dịch vụ gần đây

### Bookings
- `GET /api/bookings` - Danh sách đặt chỗ
- `GET /api/bookings/:id` - Chi tiết đặt chỗ
- `POST /api/bookings` - Tạo đặt chỗ mới
- `PATCH /api/bookings/:id/confirm` - Xác nhận đặt chỗ
- `PATCH /api/bookings/:id/complete` - Hoàn thành đặt chỗ
- `POST /api/bookings/:id/cancel` - Hủy đặt chỗ

### Users
- `GET /api/users` - Danh sách users (Admin)
- `GET /api/users/:id` - Chi tiết user
- `PUT /api/users/:id` - Cập nhật profile
- `PATCH /api/users/:id/status` - Thay đổi trạng thái (Admin)

### Payments (PayOS)
- `POST /api/payments` - Tạo link thanh toán
- `GET /api/payments` - Lịch sử thanh toán
- `GET /api/payments/:orderCode` - Chi tiết thanh toán
- `GET /api/payments/:orderCode/status` - Kiểm tra trạng thái
- `POST /api/payments/:orderCode/cancel` - Hủy thanh toán
- `POST /api/payments/webhook` - PayOS webhook

### Complaints
- `GET /api/complaints` - Danh sách khiếu nại
- `POST /api/complaints` - Tạo khiếu nại
- `POST /api/complaints/:id/respond` - Phản hồi (Admin)
- `POST /api/complaints/:id/resolve` - Xử lý (Admin)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Google OAuth
- **Payment**: PayOS
- **Validation**: express-validator

## License

ISC
