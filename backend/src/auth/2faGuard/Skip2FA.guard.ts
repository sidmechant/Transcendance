import { SetMetadata } from '@nestjs/common';

export const SKIP_2FA_GUARD_KEY = 'skip2faGuard';
export const Skip2FAGuard = () => SetMetadata(SKIP_2FA_GUARD_KEY, true);
