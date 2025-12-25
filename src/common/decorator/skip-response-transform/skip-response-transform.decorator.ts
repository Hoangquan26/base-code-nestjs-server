import { SetMetadata } from '@nestjs/common'

export const SKIP_RESPONSE_TRANSFORM = 'SKIP_RESPONSE_TRANSFORM'

export const SkipResponseTransform = () =>
  SetMetadata(SKIP_RESPONSE_TRANSFORM, true)
