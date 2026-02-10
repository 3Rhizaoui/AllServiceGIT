import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Le JwtGuard met req.user = payload JWT
 * On expose un décorateur pour le récupérer facilement dans les controllers.
 */
export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

/**
 * Alias pour compat avec tes controllers existants :
 * import { CurrentUser } from '../auth/user.decorator'
 */
export const CurrentUser = User;
