import { ForbiddenException } from '@nestjs/common';
import { HttpMessages } from './i18n/http-messages';

export function assertUserIsActive(isActive: boolean): void {
  if (isActive === false) {
    throw new ForbiddenException(HttpMessages.accountBlocked);
  }
}
