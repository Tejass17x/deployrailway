const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { connectDB } = require('./src/config/database/connection');
const mongoose = require('mongoose');

async function run() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  try {
    const db = mongoose.connection.db;

    console.log('--- USERS ---');
    const users = await db.collection('users').find({}).toArray();
    for (const u of users) {
      console.log(`User: ${u.username || u.email}, ID: ${u._id}`);
      console.log(`  profileImage: type=${typeof u.profileImage}, val=`, JSON.stringify(u.profileImage));
    }

    console.log('--- PROFILES ---');
    const profiles = await db.collection('profiles').find({}).toArray();
    for (const p of profiles) {
      console.log(`Profile UserID: ${p.userId}, ID: ${p._id}`);
      console.log(`  profileImage: type=${typeof p.profileImage}, val=`, JSON.stringify(p.profileImage));
      console.log(`  coverImage: type=${typeof p.coverImage}, val=`, JSON.stringify(p.coverImage));
    }
  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Connection closed.');
  }
}

run();
