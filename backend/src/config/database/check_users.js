const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./connection');

async function run() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected!');

    const User = mongoose.model('User');

    const users = await User.find({ isDeleted: { $ne: true } }).lean();
    console.log('Found users count:', users.length);
    users.forEach(u => {
      console.log({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        username: u.username,
        profileSlug: u.profileSlug,
        slug: u.slug
      });
    });

    await mongoose.disconnect();
    console.log('Disconnected!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
