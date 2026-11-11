# Shopping Online Project

Dự án website thương mại điện tử với 3 thành phần: `server` (Express API), `client-customer` (giao diện khách hàng React) và `client-admin` (giao diện quản trị React).

---

## 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản 18+ (khuyên dùng Node 20 hoặc 24 LTS)
- **MongoDB**: MongoDB Atlas Cluster hoặc MongoDB Community Server cục bộ

---

## 2. Cổng hoạt động (Default Ports)

- **Backend Server**: Cổng `3000` (`http://localhost:3000`)
- **Customer Client**: Cổng `3001` (`http://localhost:3001`)
- **Admin Client**: Cổng `3002` (`http://localhost:3002/admin`)

---

## 3. Cấu hình biến môi trường (`.env`)

1. Vào thư mục `server`:
   ```bash
   cd server
   ```
2. Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   # Trên Windows PowerShell:
   Copy-Item .env.example .env
   ```
3. Mở file `.env` và điền thông tin cấu hình:
   - `PORT=3000`
   - `MONGODB_URI=<chuỗi kết nối MongoDB Atlas hoặc local>`
   - `DB_DATABASE=shoppingonline`
   - `JWT_SECRET=<chuỗi bí mật ký JWT>`
   - `JWT_EXPIRES=3600000`
   - `EMAIL_USER` & `EMAIL_PASS` (Gmail App Password để gửi email kích hoạt, nếu cần)
   - `CLIENT_URL=http://localhost:3001`
   - `DEV_AUTO_ACTIVATE=false` (hoặc `true` nếu muốn tự động kích hoạt tài khoản đăng ký ở môi trường dev)

> **Lưu ý bảo mật:** Tuyệt đối không commit file `.env` lên GitHub hoặc chia sẻ chuỗi kết nối chứa mật khẩu.

---

## 4. Cài đặt và Khởi chạy

Mở 3 terminal riêng biệt để chạy 3 dịch vụ:

### A. Khởi chạy Server (Backend API)
```bash
cd server
npm install
npm start
# Hoặc chế độ dev tự reload:
npm run dev
```

### B. Khởi chạy Customer Client
```bash
cd client-customer
npm install
npm start
```
Truy cập: [http://localhost:3001](http://localhost:3001)

### C. Khởi chạy Admin Client
```bash
cd client-admin
npm install
npm start
```
Truy cập: [http://localhost:3002/admin](http://localhost:3002/admin)

---

## 5. Tài khoản Admin mẫu

Hệ thống có sẵn tài khoản quản trị mẫu trong cơ sở dữ liệu:
- **Tên đăng nhập (Username):** `admin`
- **Mật khẩu (Password):** `123`

