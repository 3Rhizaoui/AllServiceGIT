import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Post('create-intent')
  createIntent(@CurrentUser() user: any, @Body() body: any) {
    return this.payments.createIntent(user.sub, String(body.booking_id));
  }

  @Post('webhook')
  webhook(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    const raw = req.body as any;
    return this.payments.handleWebhook(Buffer.isBuffer(raw) ? raw : Buffer.from(JSON.stringify(raw)), signature);
  }
}
