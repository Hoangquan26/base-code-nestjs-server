# Logger (nest-winston)

Tài liệu này mô tả logger custom dùng `nest-winston` trong dự án. Mục tiêu:
- Một entrypoint logger thống nhất cho toàn hệ thống.
- Định dạng log nhất quán (JSON ở prod, đẹp ở dev).
- Hỗ trợ log file có rotation.
- Dễ set context theo module/service.

## Kiến trúc

- LoggerModule (global): cấu hình WinstonModule theo env.
  - file: `src/common/logger/logger.module.ts`
- AppLogger (service): wrapper implement LoggerService của Nest.
  - file: `src/common/logger/logger.service.ts`
- createLoggerOptions (factory): build transports + format cho winston.
  - file: `src/common/logger/logger.config.ts`
- Logger config loader: đọc biến môi trường LOG_*.
  - file: `src/config/logger.config.ts`
- HttpLoggerMiddleware: tạo requestId + ghi access log.
  - file: `src/common/logger/middleware/http-logger.middleware.ts`
- Bootstrap hook: đăng ký AppLogger vào Nest.
  - file: `src/main.ts`

## Cách hoạt động

1) App khởi động với `bufferLogs: true` để giữ log sớm.
2) AppLogger được `resolve` và đăng ký qua `app.useLogger(appLogger)`.
3) HttpLoggerMiddleware sinh `requestId` (nếu chưa có) và log access.
4) Winston xuất log theo cấu hình:
   - JSON cho structured logging (mặc định ở production).
   - Pretty format cho dev.
   - Console transport bật mặc định.
   - File transport bật khi cấu hình.
5) Mọi log có metadata mặc định:
   - `service`: tên app
   - `env`: NODE_ENV hiện tại

## Cấu hình (ENV)

Tất cả biến đều optional, hệ thống sẽ dùng default nếu không có.

- LOG_LEVEL (default: debug ở dev, info ở prod)
- LOG_JSON (default: false ở dev, true ở prod)
- LOG_CONSOLE_ENABLED (default: true)
- LOG_CONSOLE_COLORIZE (default: true ở dev, false ở prod)
- LOG_FILE_ENABLED (default: false)
- LOG_FILE_DIR (default: logs)
- LOG_FILE_NAME (default: app.log)
- LOG_FILE_MAXSIZE (default: 10485760 bytes)
- LOG_FILE_MAXFILES (default: 5)
- LOG_APP_FILE_ENABLED (default: true nếu LOG_FILE_ENABLED=true)
- LOG_APP_FILE_NAME (default: app.log)
- LOG_ERROR_FILE_ENABLED (default: true nếu LOG_FILE_ENABLED=true)
- LOG_ERROR_FILE_NAME (default: error.log)
- LOG_ACCESS_FILE_ENABLED (default: true nếu LOG_FILE_ENABLED=true)
- LOG_ACCESS_FILE_NAME (default: access.log)
- LOG_AUDIT_FILE_ENABLED (default: true nếu LOG_FILE_ENABLED=true)
- LOG_AUDIT_FILE_NAME (default: audit.log)

Luu y:
- `LOG_FILE_ENABLED` la default chung cho file log.
- Neu set `LOG_*_FILE_ENABLED` rieng, gia tri rieng se duoc uu tien (override).

Ví dụ:

```
LOG_LEVEL=info
LOG_JSON=true
LOG_CONSOLE_ENABLED=true
LOG_FILE_ENABLED=true
LOG_FILE_DIR=logs
LOG_FILE_MAXSIZE=10485760
LOG_FILE_MAXFILES=10
LOG_APP_FILE_ENABLED=true
LOG_APP_FILE_NAME=app.log
LOG_ERROR_FILE_ENABLED=true
LOG_ERROR_FILE_NAME=error.log
LOG_ACCESS_FILE_ENABLED=true
LOG_ACCESS_FILE_NAME=access.log
LOG_AUDIT_FILE_ENABLED=true
LOG_AUDIT_FILE_NAME=audit.log
```

## Định dạng log

Pretty format (dev):

```
2025-12-26 09:06:45.123 info [AuthService] User logged in {"userId":"..."}
```

JSON format (prod):

```
{
  "level": "info",
  "message": "User logged in",
  "context": "AuthService",
  "timestamp": "2025-12-26 09:06:45.123",
  "service": "base_code_nestjs_server",
  "env": "production",
  "userId": "..."
}
```

## Cách dùng trong code

Inject AppLogger và set context trong constructor (tùy chọn):

```
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(AuthService.name);
  }

  login() {
    this.logger.log('User logged in', AuthService.name);
    this.logger.warn('Suspicious login attempt');
    this.logger.error('Login failed', 'stack trace');
  }
}
```

Lưu ý:
- AppLogger là transient-scoped. Nếu resolve thủ công, dùng `app.resolve(AppLogger)`.
- Tham số thứ 2 trong `log()` có thể override context.

## Ví dụ và hướng dẫn ghi log theo từng loại

### App log (info/warn/debug)

Mục đích:
- Theo dõi luong xu ly binh thuong, canh bao nhe, debug khi dev.

Khi nao dung:
- info: su kien quan trong trong flow (dang ky, thanh toan thanh cong).
- warn: tinh huong bat thuong nhung chua la loi (retry, timeout tam thoi).
- debug: thong tin chi tiet chi can o dev.

Nen co:
- thong tin ngan gon, ro rang
- metadata can thiet: `userId`, `orderId`, `requestId`, `provider`

Khong nen co:
- PII/secret (password, token, key)

```
this.logger.log('User registered', { userId: user.id, requestId });
this.logger.warn('Retry external API', { provider: 'stripe', attempt: 2, requestId });
this.logger.debug('Cache hit', { key, requestId });
```

### Error log (error/fatal)

Muc dich:
- Phat hien loi, phuc vu alert va debug.

Khi nao dung:
- error: exception trong request/worker.
- fatal: app khong the tiep tuc (rat hien, chi khi crash).

Nen co:
- message ro rang
- `requestId` neu co
- stack trace khi co loi

Khong nen co:
- PII/secret

```
try {
  // ...
} catch (err) {
  this.logger.error(
    'Create order failed',
    err instanceof Error ? err.stack : undefined,
  );
}
```

### Access log (HTTP request)

Muc dich:
- Theo doi tat ca request/response, phuc vu tracing va performance.

Cach dung:
- Access log da duoc middleware tu dong ghi sau moi request.

Metadata nen co:
- `requestId`, `method`, `path`, `statusCode`, `durationMs`, `ip`, `userAgent`

Neu muon ghi them thong tin bo sung theo nghiep vu:

```
this.logger.access('POST /orders', {
  requestId,
  userId,
  statusCode: 201,
  durationMs: 123,
});
```

### Audit log (hanh dong nhay cam)

Muc dich:
- Luu vet thao tac nhay cam de truy vet (phan quyen, xoa du lieu, doi mat khau).

Khi nao dung:
- Thay doi quyen/role
- Xoa/restore du lieu quan trong
- Doi email, doi mat khau, khoa tai khoan

Nen co:
- `actorId`: ai thuc hien
- `targetId`: doi tuong bi tac dong
- `action`: mo ta hanh dong
- `before` va `after` neu can
- `requestId` neu co

```
this.logger.audit('User role updated', {
  actorId: adminId,
  targetUserId: userId,
  fromRole: 'USER',
  toRole: 'ADMIN',
  requestId,
});
```

## Phân loại log ra file

Khi `LOG_FILE_ENABLED=true`, hệ thống tách file:
- `app.log`: info/warn/debug chung (không bao gồm access/audit).
- `error.log`: error/fatal.
- `access.log`: HTTP request.
- `audit.log`: hành động nhạy cảm.

Rotation:
- LOG_FILE_MAXSIZE: dung lượng tối đa trước khi roll file.
- LOG_FILE_MAXFILES: số file giữ lại tối đa.

## RequestId / TraceId (tùy chọn)

Middleware sẽ tự set `req.requestId` nếu chưa có (ưu tiên `x-request-id` header).

Bạn có thể truyền `requestId` vào meta để log có trace:

```
this.logger.log('Request completed', { requestId });
```

## Các file liên quan

- `src/common/logger/logger.service.ts`
- `src/common/logger/logger.config.ts`
- `src/common/logger/logger.module.ts`
- `src/config/logger.config.ts`
- `src/main.ts`
- `.env.example`
