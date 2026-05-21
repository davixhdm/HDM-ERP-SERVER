require('../dnsSet');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('../models/master/Admin');
const { hashPassword } = require('../utils/hashPassword');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hdm_erp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

const log = (msg) => console.log(`${green}${msg}${reset}`);
const warn = (msg) => console.log(`${yellow}${msg}${reset}`);
const error = (msg) => console.log(`${red}${msg}${reset}`);
const info = (msg) => console.log(`${cyan}${msg}${reset}`);
const header = (msg) => console.log(`\n${bold}${cyan}═══ ${msg} ═══${reset}\n`);

// ---------------------------------------------------------------------------
// Super Admin Management
// ---------------------------------------------------------------------------
const listAdmins = async () => {
  header('SUPER ADMINS');
  const admins = await Admin.find().select('-password');
  if (!admins.length) {
    warn('No super admins found.');
    return;
  }
  admins.forEach((a, i) => {
    console.log(`  ${green}${i + 1}.${reset} ${a.email} — ${a.name} [${a.isActive ? 'Active' : 'Inactive'}]`);
    console.log(`     Last login: ${a.lastLogin || 'Never'}`);
    console.log(`     Created: ${a.createdAt}`);
  });
};

const createAdmin = async () => {
  header('CREATE SUPER ADMIN');
  const email = await question('  Email: ');
  const existing = await Admin.findOne({ email });
  if (existing) {
    warn('  Admin with this email already exists.');
    return;
  }
  const name = await question('  Name: ');
  const password = await question('  Password: ');

  await Admin.create({ email, name, password });
  log('  ✅ Super admin created successfully.');
};

const manageAdmin = async () => {
  await listAdmins();
  const admins = await Admin.find();
  if (!admins.length) return;

  const choice = await question(`\n  Select admin number (1-${admins.length}) or 0 to cancel: `);
  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= admins.length) {
    warn('  Cancelled.');
    return;
  }

  const admin = admins[idx];
  header(`MANAGE: ${admin.email}`);
  console.log(`  ${green}1.${reset} Toggle active status [currently: ${admin.isActive ? 'Active' : 'Inactive'}]`);
  console.log(`  ${green}2.${reset} Reset password`);
  console.log(`  ${green}3.${reset} Delete admin`);
  console.log(`  ${green}0.${reset} Back`);

  const action = await question('\n  Choose: ');
  switch (action) {
    case '1':
      admin.isActive = !admin.isActive;
      await admin.save();
      log(`  ✅ Admin ${admin.isActive ? 'activated' : 'deactivated'}.`);
      break;
    case '2': {
      const newPass = await question('  New password: ');
      admin.password = newPass;
      await admin.save();
      log('  ✅ Password reset.');
      break;
    }
    case '3': {
      const confirm = await question('  Type DELETE to confirm: ');
      if (confirm === 'DELETE') {
        await Admin.findByIdAndDelete(admin._id);
        log('  ✅ Admin deleted.');
      } else {
        warn('  Cancelled.');
      }
      break;
    }
    default:
      warn('  Cancelled.');
  }
};

// ---------------------------------------------------------------------------
// Database Management
// ---------------------------------------------------------------------------
const listCollections = async () => {
  header('DATABASE COLLECTIONS');
  const collections = await mongoose.connection.db.listCollections().toArray();
  if (!collections.length) {
    warn('No collections found.');
    return;
  }
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`  ${green}•${reset} ${col.name} ${yellow}(${count} documents)${reset}`);
  }
};

const dropCollections = async () => {
  header('DROP COLLECTIONS');
  const collections = await mongoose.connection.db.listCollections().toArray();
  if (!collections.length) {
    warn('No collections to drop.');
    return;
  }

  console.log(`${yellow}  Select collections to drop (comma-separated numbers, or "all"):${reset}\n`);
  collections.forEach((c, i) => console.log(`  ${green}${i + 1}.${reset} ${c.name}`));
  console.log(`  ${red}0.${reset} Cancel`);

  const input = await question('\n  > ');
  if (input === '0') { warn('  Cancelled.'); return; }

  let targets = [];
  if (input.toLowerCase() === 'all') {
    targets = collections;
  } else {
    const nums = input.split(',').map(n => parseInt(n.trim()) - 1);
    targets = nums.filter(n => n >= 0 && n < collections.length).map(n => collections[n]);
  }

  if (!targets.length) { warn('  No valid selection.'); return; }

  console.log(`\n${red}  You are about to DROP:${reset}`);
  targets.forEach(c => console.log(`    ${red}• ${c.name}${reset}`));
  const confirm = await question(`\n  ${red}Type DROP to confirm:${reset} `);
  if (confirm !== 'DROP') { warn('  Cancelled.'); return; }

  for (const col of targets) {
    await mongoose.connection.db.dropCollection(col.name);
    log(`  ✅ Dropped: ${col.name}`);
  }
  log('  ✅ Done.');
};

const dropEntireDB = async () => {
  header('⚠️  DROP ENTIRE DATABASE');
  const dbName = mongoose.connection.db.databaseName;
  console.log(`${red}  You are about to DROP the ENTIRE database: ${bold}${dbName}${reset}`);
  console.log(`${red}  This action CANNOT be undone.${reset}\n`);
  const confirm = await question(`  ${red}Type the database name to confirm:${reset} `);
  if (confirm !== dbName) { warn('  Cancelled.'); return; }

  await mongoose.connection.db.dropDatabase();
  log(`  ✅ Database "${dbName}" dropped.`);
  log('  Restart the server to reconnect.');
};

// ---------------------------------------------------------------------------
// Main Menu
// ---------------------------------------------------------------------------
const mainMenu = async () => {
  while (true) {
    console.log(`\n${bold}${cyan}╔══════════════════════════════════════╗${reset}`);
    console.log(`${bold}${cyan}║        HDM ERP — ADMIN TOOL          ║${reset}`);
    console.log(`${bold}${cyan}╠══════════════════════════════════════╣${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}1.${reset} List super admins                ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}2.${reset} Create super admin               ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}3.${reset} Manage super admin               ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}4.${reset} List collections                 ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}5.${reset} Drop collections                 ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${red}6.${reset} Drop entire database             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}  ${green}0.${reset} Exit                             ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}╚══════════════════════════════════════╝${reset}`);

    const choice = await question('\n  > ');

    try {
      switch (choice) {
        case '1': await listAdmins(); break;
        case '2': await createAdmin(); break;
        case '3': await manageAdmin(); break;
        case '4': await listCollections(); break;
        case '5': await dropCollections(); break;
        case '6': await dropEntireDB(); break;
        case '0':
          log('\n  Goodbye! 👋\n');
          rl.close();
          await mongoose.connection.close();
          process.exit(0);
        default:
          warn('  Invalid option.');
      }
    } catch (err) {
      error(`  Error: ${err.message}`);
    }
  }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
(async () => {
  console.log(`${green}${bold}`);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          HDM ERP — ADMIN TOOL               ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`${reset}`);

  try {
    await mongoose.connect(MONGODB_URI);
    log(`Connected to: ${MONGODB_URI}\n`);
    await mainMenu();
  } catch (err) {
    error(`Connection failed: ${err.message}`);
    rl.close();
    process.exit(1);
  }
})();