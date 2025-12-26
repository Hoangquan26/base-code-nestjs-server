import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv;

  @IsString()
  @IsNotEmpty()
  APP_NAME: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT: number;

  @IsString()
  @IsNotEmpty()
  APP_URL: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsBoolean()
  LOG_JSON?: boolean;

  @IsOptional()
  @IsBoolean()
  LOG_CONSOLE_ENABLED?: boolean;

  @IsOptional()
  @IsBoolean()
  LOG_CONSOLE_COLORIZE?: boolean;

  @IsOptional()
  @IsBoolean()
  LOG_FILE_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  LOG_FILE_DIR?: string;

  @IsOptional()
  @IsString()
  LOG_FILE_NAME?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  LOG_FILE_MAXSIZE?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  LOG_FILE_MAXFILES?: number;

  @IsOptional()
  @IsBoolean()
  LOG_APP_FILE_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  LOG_APP_FILE_NAME?: string;

  @IsOptional()
  @IsBoolean()
  LOG_ERROR_FILE_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  LOG_ERROR_FILE_NAME?: string;

  @IsOptional()
  @IsBoolean()
  LOG_ACCESS_FILE_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  LOG_ACCESS_FILE_NAME?: string;

  @IsOptional()
  @IsBoolean()
  LOG_AUDIT_FILE_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  LOG_AUDIT_FILE_NAME?: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  REDIS_DB?: number;

  @IsOptional()
  @IsBoolean()
  LOG_QUEUE_ENABLED?: boolean;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsInt()
  @Min(4)
  @Max(16)
  BCRYPT_ROUNDS: number;

  @IsString()
  @IsNotEmpty()
  TWO_FACTOR_ENCRYPTION_KEY: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  EMAIL_VERIFY_TOKEN_TTL_MIN?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  PASSWORD_RESET_TOKEN_TTL_MIN?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Config validation error: ${message}`);
  }
  return validatedConfig;
}
