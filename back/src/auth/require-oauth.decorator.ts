import { SetMetadata } from '@nestjs/common';

export const OAUTH_PROVIDER_KEY = 'oauthProvider';

export type OauthProviderName = 'google' | 'github';

export const RequireOauthProvider = (provider: OauthProviderName) =>
  SetMetadata(OAUTH_PROVIDER_KEY, provider);
