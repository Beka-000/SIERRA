/**
 * Тест входа в админку
 */

async function testAdminLogin() {
  const baseUrl = "http://localhost:3000";
  
  console.log("🧪 Тест входа администратора...\n");

  try {
    // 1. Тест логина (получение OTP)
    console.log("1️⃣ Отправка email и пароля...");
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "kojomkulov2004@gmail.com",
        password: "admin1234!",
      }),
    });

    const loginData = await loginRes.json();
    console.log(`   Статус: ${loginRes.status}`);
    console.log(`   Ответ:`, loginData);

    if (!loginRes.ok) {
      console.log("   ❌ Ошибка при логине");
      return;
    }

    // Извлекаем OTP cookie
    const cookies = loginRes.headers.get("set-cookie");
    console.log(`   ✓ Cookies установлены`);

    if (!cookies?.includes("sc_otp=")) {
      console.log("   ❌ OTP cookie не найден");
      return;
    }

    console.log("\n2️⃣ OTP отправлен в Telegram");
    console.log("   💡 Проверьте Telegram и введите код в браузере\n");
    console.log("   Далее:");
    console.log("   1. Откройте http://localhost:3000/admin/login");
    console.log("   2. Введите email и пароль");
    console.log("   3. Введите OTP код из Telegram");
    console.log("   4. Вы должны попасть в /admin/dashboard\n");

    // 3. Проверяем API session (без авторизации должна вернуть 401)
    console.log("3️⃣ Проверка API session (без cookie)...");
    const sessionRes = await fetch(`${baseUrl}/api/admin/auth/session`);
    console.log(`   Статус: ${sessionRes.status}`);
    console.log(`   Ожидаемый статус: 401 (без авторизации)\n`);

  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

testAdminLogin();
