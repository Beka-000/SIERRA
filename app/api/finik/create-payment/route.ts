// app/api/finik/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createFinikPayment, CreatePaymentData } from '@/lib/finik';
import { getCurrentSession } from '@/lib/auth';

/**
 * POST /api/finik/create-payment
 * Создает платеж в Finik с фиксированной ценой 5 сомов
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Получение данных из запроса
    const body = await request.json();
    const { orderId, orderDescription } = body;

    // 3. Валидация данных
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // 4. Создание данных для платежа с фиксированной ценой 5 сомов
    const paymentData: CreatePaymentData = {
      amount: 5, // Фиксированная цена 5 сомов
      orderId,
      orderDescription: orderDescription || 'Оплата заказа Sierra Coffee',
      userId: session.userId,
    };

    console.log('[FINIK] Creating payment:', {
      orderId,
      amount: 5,
      userId: session.userId,
    });

    // 5. Создание платежа в Finik
    const paymentUrl = await createFinikPayment(paymentData);

    console.log('[FINIK] Payment URL generated:', paymentUrl);

    // 6. Возврат URL платежной страницы
    return NextResponse.json({
      success: true,
      paymentUrl,
      amount: 5,
      orderId,
    });

  } catch (error) {
    console.error('[FINIK] Error creating payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
