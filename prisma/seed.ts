import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Создание ролей
  console.log('📝 Creating roles...');
  
  const roles = [
    { code: 'admin', title: 'Администратор', permissions: {} },
    { code: 'manager', title: 'Менеджер', permissions: {} },
    { code: 'staff', title: 'Сотрудник', permissions: {} },
    { code: 'client', title: 'Клиент', permissions: {} },
    { code: 'guest', title: 'Гость', permissions: {} },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles created');

  // 2. Создание категорий меню
  console.log('📝 Creating menu categories...');

  const categories = [
    {
      title: 'Кофе',
      description: 'Авторские кофейные напитки на основе эспрессо',
      sortOrder: 1,
    },
    {
      title: 'Чай и напитки',
      description: 'Премиальные сорта чая и освежающие напитки',
      sortOrder: 2,
    },
    {
      title: 'Завтраки',
      description: 'Сытные и полезные завтраки для отличного начала дня',
      sortOrder: 3,
    },
    {
      title: 'Десерты',
      description: 'Домашние десерты от нашего кондитера',
      sortOrder: 4,
    },
    {
      title: 'Выпечка',
      description: 'Свежая выпечка каждое утро',
      sortOrder: 5,
    },
    {
      title: 'Блюда',
      description: 'Основные блюда и закуски',
      sortOrder: 6,
    },
  ];

  const createdCategories: Record<string, any> = {};

  for (const category of categories) {
    const existing = await prisma.menuCategory.findFirst({
      where: { title: category.title },
    });

    if (existing) {
      createdCategories[category.title] = existing;
    } else {
      const created = await prisma.menuCategory.create({
        data: category,
      });
      createdCategories[category.title] = created;
    }
  }

  console.log('✅ Categories created');

  // 3. Создание продуктов
  console.log('📝 Creating products...');

  const products = [
    // КОФЕ
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Эспрессо',
      description: 'Классический итальянский эспрессо из 100% арабики',
      price: 80,
      weightOrVolume: '30 мл',
      calories: 5,
      composition: 'Кофе арабика',
      isAvailable: true,
      isRecommended: false,
    },
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Капучино',
      description: 'Эспрессо с нежной молочной пенкой',
      price: 120,
      weightOrVolume: '200 мл',
      calories: 80,
      composition: 'Эспрессо, молоко цельное',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Флэт уайт',
      description: 'Двойной эспрессо с бархатистым молоком — идеальный баланс',
      price: 140,
      weightOrVolume: '180 мл',
      calories: 95,
      composition: 'Двойной эспрессо, молоко цельное',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Латте',
      description: 'Мягкий кофейный напиток с большим количеством молока',
      price: 130,
      weightOrVolume: '300 мл',
      calories: 120,
      composition: 'Эспрессо, молоко цельное',
      isAvailable: true,
      isRecommended: false,
    },
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Американо',
      description: 'Классический американо — эспрессо с горячей водой',
      price: 90,
      weightOrVolume: '200 мл',
      calories: 5,
      composition: 'Эспрессо, вода горячая',
      isAvailable: true,
      isRecommended: false,
    },
    {
      categoryId: createdCategories['Кофе'].id,
      title: 'Раф кофе',
      description: 'Нежный кофейный напиток со сливками и ванилью',
      price: 150,
      weightOrVolume: '250 мл',
      calories: 180,
      composition: 'Эспрессо, сливки 10%, ванильный сахар',
      isAvailable: true,
      isRecommended: true,
    },

    // ЧАЙ И НАПИТКИ
    {
      categoryId: createdCategories['Чай и напитки'].id,
      title: 'Матча латте',
      description: 'Японский церемониальный матча с овсяным молоком',
      price: 150,
      weightOrVolume: '300 мл',
      calories: 110,
      composition: 'Порошок матча, молоко овсяное, мёд',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Чай и напитки'].id,
      title: 'Имбирный чай',
      description: 'Согревающий чай с имбирём, лимоном и мёдом',
      price: 120,
      weightOrVolume: '400 мл',
      calories: 45,
      composition: 'Имбирь свежий, лимон, мёд, вода',
      isAvailable: true,
      isRecommended: false,
    },
    {
      categoryId: createdCategories['Чай и напитки'].id,
      title: 'Облепиховый чай',
      description: 'Витаминный чай с облепихой и апельсином',
      price: 130,
      weightOrVolume: '400 мл',
      calories: 60,
      composition: 'Облепиха, апельсин, мёд, чёрный чай',
      isAvailable: true,
      isRecommended: true,
    },

    // ЗАВТРАКИ
    {
      categoryId: createdCategories['Завтраки'].id,
      title: 'Авокадо-тост',
      description: 'Хрустящий бриошь, крем-авокадо, яйцо пашот, микрозелень',
      price: 280,
      weightOrVolume: '250 г',
      calories: 420,
      composition: 'Хлеб бриошь, авокадо, яйцо, микрозелень, специи',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Завтраки'].id,
      title: 'Ореховая каша',
      description: 'Овсяная каша на кокосовом молоке с карамелизированными орехами',
      price: 180,
      weightOrVolume: '300 г',
      calories: 380,
      composition: 'Овсяные хлопья, молоко кокосовое, орехи микс, мёд, корица',
      isAvailable: true,
      isRecommended: false,
    },
    {
      categoryId: createdCategories['Завтраки'].id,
      title: 'Сырники',
      description: 'Домашние сырники со сметаной и ягодным соусом',
      price: 200,
      weightOrVolume: '250 г',
      calories: 350,
      composition: 'Творог, мука, яйцо, сахар, сметана, ягодный соус',
      isAvailable: true,
      isRecommended: true,
    },

    // ДЕСЕРТЫ
    {
      categoryId: createdCategories['Десерты'].id,
      title: 'Тарт с лимоном',
      description: 'Хрустящее песочное тесто, шёлковый лимонный крем, итальянская меренга',
      price: 160,
      weightOrVolume: '120 г',
      calories: 280,
      composition: 'Мука, масло, лимоны, яйца, сахар',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Десерты'].id,
      title: 'Чизкейк Нью-Йорк',
      description: 'Классический американский чизкейк на печенье Орео',
      price: 180,
      weightOrVolume: '140 г',
      calories: 420,
      composition: 'Сливочный сыр, печенье Орео, сливки, сахар',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Десерты'].id,
      title: 'Тирамису',
      description: 'Итальянский десерт с маскарпоне и кофейной пропиткой',
      price: 190,
      weightOrVolume: '150 г',
      calories: 380,
      composition: 'Маскарпоне, савоярди, эспрессо, какао',
      isAvailable: true,
      isRecommended: false,
    },

    // ВЫПЕЧКА
    {
      categoryId: createdCategories['Выпечка'].id,
      title: 'Круассан классический',
      description: 'Слоёный французский круассан, выпекается ежедневно',
      price: 100,
      weightOrVolume: '70 г',
      calories: 230,
      composition: 'Мука, масло сливочное, дрожжи, молоко, сахар',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Выпечка'].id,
      title: 'Круассан с шоколадом',
      description: 'Воздушный круассан с бельгийским шоколадом',
      price: 120,
      weightOrVolume: '80 г',
      calories: 290,
      composition: 'Мука, масло сливочное, шоколад бельгийский',
      isAvailable: true,
      isRecommended: true,
    },
    {
      categoryId: createdCategories['Выпечка'].id,
      title: 'Синнабон',
      description: 'Ароматная булочка с корицей и сливочным кремом',
      price: 140,
      weightOrVolume: '150 г',
      calories: 420,
      composition: 'Мука, корица, сахар, сливочный сыр, масло',
      isAvailable: true,
      isRecommended: false,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('✅ Products created');

  // 4. Создание модификаторов для кофе
  console.log('📝 Creating product modifiers...');

  const coffeeProducts = await prisma.product.findMany({
    where: {
      category: {
        title: 'Кофе',
      },
    },
  });

  const modifiers = [
    { title: 'Молоко соевое', priceDelta: 20 },
    { title: 'Молоко овсяное', priceDelta: 20 },
    { title: 'Молоко кокосовое', priceDelta: 25 },
    { title: 'Дополнительная порция эспрессо', priceDelta: 30 },
    { title: 'Сироп ванильный', priceDelta: 15 },
    { title: 'Сироп карамельный', priceDelta: 15 },
    { title: 'Сироп ореховый', priceDelta: 15 },
  ];

  for (const coffeeProduct of coffeeProducts) {
    for (const modifier of modifiers) {
      await prisma.productModifier.create({
        data: {
          productId: coffeeProduct.id,
          ...modifier,
        },
      });
    }
  }

  console.log('✅ Modifiers created');

  // 5. Создание админа (опционально)
  console.log('📝 Creating admin user...');

  const adminRole = await prisma.role.findUnique({
    where: { code: 'admin' },
  });

  if (adminRole) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@sierracoffee.kg' },
      update: {},
      create: {
        roleId: adminRole.id,
        name: 'Администратор',
        email: 'admin@sierracoffee.kg',
        phone: '+996700000000',
        passwordHash: hashedPassword,
      },
    });
  }

  console.log('✅ Admin user created (email: admin@sierracoffee.kg, password: admin123)');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${roles.length} roles`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${coffeeProducts.length * modifiers.length} modifiers`);
  console.log('   - 1 admin user');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
