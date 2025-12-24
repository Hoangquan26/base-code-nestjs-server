# NestJS Base Code - Company Standard Roadmap

Base code NestJS chuẩn nội bộ để clone nhanh, phát triển nhanh, và đủ tiêu chuẩn production:
**maintain tốt - update dễ - scale ổn - sẵn sàng production**.

---

## Mục tiêu

- Chuẩn hóa kiến trúc NestJS cho tất cả dự án backend trong công ty
- Giảm technical debt khi dự án lớn dần
- Đồng nhất cách làm việc giữa junior và senior
- Sẵn sàng cho production (security, logging, CI/CD)

Đây là **framework nội bộ**, không phải demo project.

---

## Tech Stack

- Node.js 20 (LTS)
- NestJS 11
- TypeScript (strict)
- Prisma / TypeORM (theo dự án)
- Redis
- JWT Authentication
- Docker
- GitHub Actions CI/CD

---

## Cấu trúc thư mục chuẩn

```text
src/
  main.ts                 # Bootstrap ứng dụng
  app.module.ts

  config/                 # Quản lý config & env (typed)
    app.config.ts
    database.config.ts
    auth.config.ts
    redis.config.ts

  modules/                # Các module nghiệp vụ (theo domain)
    user/
      user.controller.ts
      user.service.ts
      user.module.ts
      dto/
      entities/

  common/                 # Dùng chung toàn hệ thống
    decorators/
    guards/
    interceptors/
    pipes/
    filters/
    errors/

  infra/                  # Hạ tầng kỹ thuật
    database/
    redis/
    queue/
    storage/

  libs/                   # Helper / shared libraries

test/
```

---

## Environment & Config

### ENV files

- `.env.example`
- `.env.development`
- `.env.production`

### Quy ước

- Không dùng trực tiếp `process.env`
- Chỉ đọc env qua `ConfigService`
- Validate env ngay khi app start (zod / class-validator)
- Config typed rõ ràng, dễ tra cứu

---

## Application Bootstrap (main.ts)

Bắt buộc có:

- Global `ValidationPipe`
- Global `ExceptionFilter`
- Global response transform interceptor
- Graceful shutdown
- CORS theo environment
- Trust proxy (nếu chạy sau nginx)

---

## Quy tắc kiến trúc

### Module

- 1 module = 1 domain nghiệp vụ
- Không import chéo module bừa bãi
- Logic dùng chung đặt ở `common/` hoặc `libs/`

### Layering

- **Controller**: nhận request, trả response
- **Service**: xử lý business logic
- **Repository/Infra**: DB, Redis, Queue

Không viết business logic trong controller.

---

## Database

- Không auto-sync schema ở production
- Migration có version rõ ràng
- Có helper transaction
- Pagination chuẩn hóa
- Soft delete khi nghiệp vụ yêu cầu

---

## Authentication & Authorization

### Authentication

- JWT access token
- Refresh token
- Token rotation
- Session / device tracking
- Login attempt tracking

### Authorization

- RBAC (Role-based)
- Guard-based authorization
- Decorator `@Roles()`

---

## Request Lifecycle

- **Guards**: Auth, Role
- **Pipes**: Validate, Parse
- **Interceptors**: Logging, Response transform, Timeout
- **Filters**: Global HttpException filter

---

## Error Handling Standard

Response thống nhất:

```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "traceId": "req-abc-123"
}
```

Nguyên tắc:

- Không expose internal error ở production
- Error code dùng enum thống nhất
- Có traceId để debug

---

## Logging

- Structured logging (JSON)
- Log level theo environment
- Request ID / Trace ID
- HTTP request logging
- Tách log lỗi riêng

---

## Cache & Redis

- Redis module global
- Cache key có convention
- TTL rõ ràng
- Helper invalidate cache
- Distributed lock helper

Use cases:

- Session
- Rate limit
- Ranking
- Queue buffer

---

## Queue & Background Jobs

- BullMQ / RabbitMQ
- Retry strategy
- Dead-letter queue
- Idempotent job
- Job monitoring

---

## Security Baseline

- Helmet
- Rate limiting
- Password hashing (bcrypt / argon2)
- Mask dữ liệu nhạy cảm trong log
- Input sanitization

---

## File & Storage

- Validate file upload (type, size)
- Local / S3 / MinIO dễ switch
- Signed URL support

---

## API Design Standard

- RESTful naming
- Versioning: `/api/v1`
- Pagination format thống nhất
- Response format thống nhất

---

## Swagger / API Docs

- Enable theo environment
- JWT auth trong Swagger
- DTO decorators đầy đủ
- Group theo module

---

## Testing

- Unit test cho Service
- Integration test cho Controller
- Mock database
- Test environment riêng
- Coverage config

---

## Docker & CI/CD

- Dockerfile multi-stage
- `docker-compose` local
- Healthcheck endpoint

GitHub Actions:

- Lint
- Test
- Build
- Docker build

---

## Observability (Optional)

- Prometheus metrics
- `/metrics` endpoint
- Request duration
- Error rate
- Uptime probe

---

## Team Convention

- Coding style thống nhất
- Commit message convention
- Branch strategy
- Release workflow
- Environment setup guide

Checklist trước khi release:

- Không hardcode config
- Không circular dependency
- Không business logic trong controller
- Log đầy đủ
- Ready for production

---

## Usage

```bash
git clone <base-code-repo>
cp .env.example .env.development
npm install
npm run start:dev
```
