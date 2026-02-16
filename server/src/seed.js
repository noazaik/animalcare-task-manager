const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Seeding database...');

  // Check if already seeded
  if (db.findUserByUsername('admin')) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.createUser({
    username: 'admin',
    password: adminPassword,
    role: 'ADMIN'
  });
  console.log('Created admin user');

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  db.createUser({
    username: 'user',
    password: userPassword,
    role: 'USER'
  });
  console.log('Created regular user');

  // Create sample tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = [
    {
      title: 'האכלת בעלי החיים',
      description: 'האכלת כל בעלי החיים בבוקר',
      dueDate: today.toISOString(),
      startTime: '06:00',
      endTime: '07:00',
      recurrence: 'DAILY'
    },
    {
      title: 'ניקוי הכלובים',
      description: 'ניקוי יסודי של כל הכלובים',
      dueDate: today.toISOString(),
      startTime: '08:00',
      endTime: '10:00',
      recurrence: 'DAILY'
    },
    {
      title: 'בדיקת מים',
      description: 'בדיקה והחלפת מי שתייה',
      dueDate: today.toISOString(),
      startTime: '07:00',
      endTime: '07:30',
      recurrence: 'DAILY'
    },
    {
      title: 'ביקור וטרינר',
      description: 'ביקור שבועי של הוטרינר',
      dueDate: today.toISOString(),
      startTime: '10:00',
      endTime: '12:00',
      recurrence: 'WEEKLY'
    },
    {
      title: 'הזמנת מזון',
      description: 'הזמנת מזון חודשית',
      dueDate: today.toISOString(),
      startTime: '09:00',
      endTime: '09:30',
      recurrence: 'MONTHLY'
    }
  ];

  tasks.forEach(task => {
    db.createTask(task);
  });

  console.log(`Created ${tasks.length} sample tasks`);
  console.log('Database seeded successfully!');
}

seed().catch(console.error);
