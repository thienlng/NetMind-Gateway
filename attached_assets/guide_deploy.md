# Hướng dẫn Cập nhật và Migrate Database với Alembic

Tài liệu này hướng dẫn chi tiết cách cập nhật ứng dụng NetMind Gateway lên phiên bản mới và thực hiện migration database khi đã có một phiên bản đang chạy trên server.

## 1. Chuẩn bị (Trước khi cập nhật)

Luôn luôn sao lưu database trước khi thực hiện bất kỳ thay đổi nào về cấu trúc (schema).

```bash
# Ví dụ sao lưu database postgres từ docker
docker exec netmind-gateway-postgres pg_dump -U netmind netmind_db > backup_$(date +%Y%m%d).sql
```

## 2. Cập nhật mã nguồn (Git)

Di chuyển vào thư mục chứa dự án trên server và lấy mã nguồn mới nhất.

```bash
# Nếu bạn dùng git pull
git pull origin main

# Hoặc nếu bạn clone mới hoàn toàn
# git clone <repository_url>
# cd NetMind-Gateway
```

## 3. Cập nhật Biến môi trường (.env)

Kiểm tra và cập nhật các biến môi trường mới trong file `.env`. Đối với tính năng SSO và Alembic, hãy đảm bảo các biến sau đã được cấu hình:

```bash
# SSO Configuration
SSO_AUTH_URL=https://auth.viettel.vn/auth/login
SSO_LOGOUT_URL=https://auth.viettel.vn/auth/logout
SSO_APP_CODE=netmind
SSO_SERVICE_URL=https://netmind.viettel.vn/gateway/login
SSO_TICKET_API_URL=https://netmind.viettel.vn/vtnet-assistant/v1/api/ai/getUserInfoFromSsoTicket
SSO_TICKET_API_BEARER=your_bearer_token_here

# Đảm bảo DATABASE_URL chính xác để Alembic có thể kết nối
DATABASE_URL=postgresql://netmind:netmind_password@postgres:5432/netmind_db
```

## 4. Build lại Docker Images

Sau khi có mã nguồn mới, bạn cần build lại các image để bao gồm các thay đổi về code và dependencies (như `alembic`).

```bash
# Build lại image mà không dùng cache để đảm bảo mọi thứ mới nhất
docker-compose build --no-cache

# Khởi động lại các services
docker-compose up -d
```

## 5. Thực hiện Migration Database

Đây là bước quan trọng nhất để cập nhật cấu trúc bảng trong PostgreSQL mà không làm mất dữ liệu hiện có. Chúng ta sẽ chạy lệnh migrate ngay bên trong container của backend.

### Bước 5.1: Kiểm tra trạng thái hiện tại
```bash
docker exec netmind-gateway-backend uv run alembic -c artifacts/crm-backend/alembic.ini current
```

### Bước 5.2: Thực hiện nâng cấp lên phiên bản mới nhất (SSO fields)
```bash
docker exec netmind-gateway-backend uv run alembic -c artifacts/crm-backend/alembic.ini upgrade head
```

Lệnh này sẽ thực thi file migration `0001_add_sso_fields.py`, thực hiện các việc:
- Chuyển `password_hash` thành `nullable`.
- Thêm các cột mới: `department_name`, `department_fullname`, `staff_code`, `company_title`, `phone`, `auth_provider`, v.v.

### Bước 5.3: Xác nhận migration thành công
```bash
docker exec netmind-gateway-backend uv run alembic -c artifacts/crm-backend/alembic.ini history
```

## 6. Kiểm tra sau khi triển khai

1. Kiểm tra logs của backend để đảm bảo không có lỗi kết nối database:
   ```bash
   docker logs -f netmind-gateway-backend
   ```
2. Truy cập vào giao diện `/login` để kiểm tra nút "Login with Viettel SSO" đã xuất hiện.
3. Thử thực hiện login để đảm bảo user được tạo/cập nhật đúng trong database.

---

### Lưu ý quan trọng về Alembic:
- **Không bao giờ xóa thư mục `alembic/versions`**: Đây là lịch sử thay đổi của database.
- **Mỗi khi thay đổi `models.py`**: Bạn cần tạo một revision mới bằng lệnh `alembic revision --autogenerate -m "description"` (thường thực hiện ở môi trường dev trước khi đẩy lên server).
