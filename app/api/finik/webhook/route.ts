// app/api/finik/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyFinikWebhook, 
  isTimestampValid, 
  FinikWebhookData 
} from '@/lib/finik';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/finik/webhook
 * Обрабатывает webhook от Finik после завершения платежа
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Получение заголовков
    const signature = request.headers.get('signature');
    const timestamp = request.headers.get('x-api-timestamp');
    const host = request.headers.get('host');

    console.log('[FINIK_WEBHOOK] Received webhook:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      host,
    });

    if (!signature || !timestamp) {
      console.error('[FINIK_WEBHOOK] Missing signature or timestamp');
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 400 }
      );
    }

    // 2. Проверка актуальности timestamp (защита от replay-атак)
    if (!isTimestampValid(timestamp)) {
      console.error('[FINIK_WEBHOOK] Timestamp is too old or invalid');
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    // 3. Получение тела запроса
    const body: FinikWebhookData = await request.json();

    console.log('[FINIK_WEBHOOK] Webhook data:', {
      id: body.id,
      transactionId: body.transactionId,
      status: body.status,
      amount: body.amount,
    });

    // 4. Подготовка заголовков для верификации
    const headers: Record<string, string> = {
      'host': host || '',
    };

    // 5. Верификация подписи
    const webhookPath = '/api/finik/webhook';
    const isValid = await verifyFinikWebhook(
      signature, 
      timestamp, 
      body as any, 
      headers, 
      webhookPath
    );
    
    if (!isValid) {
      console.error('[FINIK_WEBHOOK] Invalid signature');
      
      // В продакшене всегда отклоняем невалидные подписи
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      console.warn('[FINIK_WEBHOOK] Continuing despite invalid signature (development mode)');
    }

    // 6. Извлечение метаданных
    let metadata: { 
      userId?: string; 
      orderId?: string; 
      paymentId?: string 
    } = {};
    
    try {
      if (body.data && body.data.metadata) {
        if (typeof body.data.metadata === 'string') {
          metadata = JSON.parse(body.data.metadata);
        } else {
          metadata = body.data.metadata as typeof metadata;
        }
      }
    } catch (error) {
      console.error('[FINIK_WEBHOOK] Error parsing metadata:', error);
    }

    console.log('[FINIK_WEBHOOK] Metadata:', metadata);

    // 7. Обработка успешного платежа
    if (body.status === 'SUCCEEDED' || body.status === 'succeeded') {
      const { userId, orderId } = metadata;

      if (!userId || !orderId) {
        console.error('[FINIK_WEBHOOK] Missing userId or orderId in metadata');
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        );
      }

      console.log(`[FINIK_WEBHOOK] ✓ Payment succeeded:`, {
        orderId,
        userId,
        amount: body.amount,
        transactionId: body.transactionId,
      });

      // 8. Обновление заказа в БД
      try {
        // Находим заказ
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          console.error('[FINIK_WEBHOOK] Order not found:', orderId);
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        // Обновляем статус заказа
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CONFIRMED', // Меняем статус на подтвержденный
          },
        });

        // Создаем запись о платеже
        await prisma.payment.create({
          data: {
            orderId: orderId,
            provider: 'finik',
            providerPaymentId: body.transactionId,
            status: 'success',
            amount: body.amount,
            idempotencyKey: body.id,
            webhookPayload: body as any,
          },
        });

        console.log(`[FINIK_WEBHOOK] ✓ Order ${orderId} updated successfully`);

      } catch (dbError) {
        console.error('[FINIK_WEBHOOK] Database error:', dbError);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }
    } 
    // 9. Обработка неудачного платежа
    else if (body.status === 'FAILED' || body.status === 'failed') {
      const { userId, orderId } = metadata;
      console.error('[FINIK_WEBHOOK] ✗ Payment failed:', { userId, orderId, transactionId: body.transactionId });
      
      // Можно обновить статус заказа на "failed" если нужно
      if (orderId) {
        try {
          await prisma.payment.create({
            data: {
              orderId: orderId,
              provider: 'finik',
              providerPaymentId: body.transactionId || '',
              status: 'failed',
              amount: body.amount,
              idempotencyKey: body.id,
              webhookPayload: body as any,
            },
          });
        } catch (error) {
          console.error('[FINIK_WEBHOOK] Error saving failed payment:', error);
        }
      }
    }

    // 10. Возврат успешного ответа
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[FINIK_WEBHOOK] Error processing webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
