const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./connection');

async function diagnose() {
  await connectDB();
  const User = mongoose.model('User');

  const users = await User.find({}).select('firstName lastName fullName email slug profileSlug username isDeleted').lean();
  console.log(`\nTotal users in DB: ${users.length}\n`);

  for (const u of users) {
    console.log({
      name: u.fullName || `${u.firstName} ${u.lastName}`,
      email: u.email,
      slug: u.slug || '(none)',
      profileSlug: u.profileSlug || '(none)',
      username: u.username || '(none)',
      isDeleted: u.isDeleted || false
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch(err => { console.error(err); process.exit(1); });
