"use client";

import { useState, useCallback } from "react";

// Валидный кыргызский номер: +996 + ровно 9 цифр
export const KG_PHONE_RE = /^\+996\d{9}$/;

/**
 * Нормализует сырую строку к виду +996XXXXXXXXX:
 * - Убирает всё нецифровое кроме ведущего +
 * - Добавляет +996 если нет
 * - Убирает лишний 0 сразу после +996 (+9960555… → +996555…)
 * - Ограничивает до 9 цифр после +996
 *
 * Возвращает { raw, display, isValid }
 *   raw     — строка без пробелов, напр. +996555123456
 *   display — с пробелами для показа: +996 555 123 456
 *   isValid — соответствует KG_PHONE_RE
 */
export function normalizePhone(input: string): {
  raw: string;
  display: string;
  isValid: boolean;
} {
  // 1. Убираем всё кроме цифр и первого +
  let cleaned = input.replace(/[^\d+]/g, "");

  // 2. Убираем все + кроме первого символа
  cleaned = cleaned.replace(/(?!^)\+/g, "");

  // 3. Извлекаем только цифры
  let digits = cleaned.replace(/\D/g, "");

  // 4. Нормализуем по вариантам начала
  if (cleaned.startsWith("+996")) {
    // Есть код — берём то, что после него
    digits = digits.slice(3); // убираем 996
  } else if (digits.startsWith("996")) {
    // 996 без плюса
    digits = digits.slice(3);
  }
  // Иначе digits уже содержит то, что после кода (или вместо него)

  // 5. Если первая цифра — 0, убираем его (+9960555… или 0555…)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 6. Ограничиваем 9 цифрами
  digits = digits.slice(0, 9);

  const raw = "+996" + digits;

  // 7. Форматируем для отображения: +996 XXX XXX XXX
  let display = "+996";
  if (digits.length > 0) display += " " + digits.slice(0, 3);
  if (digits.length > 3) display += " " + digits.slice(3, 6);
  if (digits.length > 6) display += " " + digits.slice(6, 9);

  const isValid = KG_PHONE_RE.test(raw);

  return { raw, display, isValid };
}

/**
 * Хук для управления полем ввода телефона.
 *
 * Возвращает:
 *   value       — отображаемая строка (с пробелами, напр. +996 555 123 456)
 *   rawValue    — без пробелов (+996555123456), для отправки на сервер
 *   isValid     — boolean
 *   isDirty     — пользователь уже вводил (для показа ошибок)
 *   errorMsg    — строка ошибки или ""
 *   onChange    — обработчик для input onChange
 *   onBlur      — обработчик для input onBlur (помечает поле dirty)
 *   reset       — сброс к начальному состоянию
 */
export function usePhoneInput(initial = "") {
  const { display: initDisplay, raw: initRaw } = normalizePhone(
    initial || "+996"
  );

  const [displayValue, setDisplayValue] = useState<string>(
    initial ? initDisplay : "+996"
  );
  const [rawValue, setRawValue] = useState<string>(
    initial ? initRaw : "+996"
  );
  const [isDirty, setIsDirty] = useState(false);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Разрешаем пользователю стереть поле до пустого или частичного
      if (input === "" || input === "+") {
        setDisplayValue("+996");
        setRawValue("+996");
        setIsDirty(true);
        return;
      }

      // Защита: не даём стереть +996 — минимум префикс остаётся
      if (!input.startsWith("+") && input.length < 4) {
        // Вводят цифры без префикса — добавляем
        const { raw, display } = normalizePhone(input);
        setDisplayValue(display);
        setRawValue(raw);
        setIsDirty(true);
        return;
      }

      const { raw, display } = normalizePhone(input);
      setDisplayValue(display);
      setRawValue(raw);
      setIsDirty(true);
    },
    []
  );

  const onBlur = useCallback(() => {
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setDisplayValue("+996");
    setRawValue("+996");
    setIsDirty(false);
  }, []);

  const digits = rawValue.slice(4); // цифры после +996
  const isValid = KG_PHONE_RE.test(rawValue);

  // Показываем ошибку только если поле dirty И есть хоть один символ после +996
  const showError = isDirty && digits.length > 0 && !isValid;
  const showEmpty = isDirty && digits.length === 0;

  let errorMsg = "";
  if (showEmpty) {
    errorMsg = "Введите номер телефона";
  } else if (showError) {
    const remaining = 9 - digits.length;
    if (remaining > 0) {
      errorMsg = `Ещё ${remaining} ${remaining === 1 ? "цифра" : remaining < 5 ? "цифры" : "цифр"}`;
    } else {
      errorMsg = "Формат: +996 XXX XXX XXX";
    }
  }

  return {
    value: displayValue,
    rawValue,
    isValid,
    isDirty,
    errorMsg,
    onChange,
    onBlur,
    reset,
    // Удобно для проверки перед отправкой
    validate: () => {
      setIsDirty(true);
      return isValid;
    },
  };
}
