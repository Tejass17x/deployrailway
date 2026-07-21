const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./connection');
const profileService = require('../../modules/profile/service/profile.service');

async function verify() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected!');

    // 1. Try resolving by clean SEO slug
    const targetSlug = 'abhishek-prasad';
    console.log(`\nTesting retrieval for slug: "${targetSlug}"`);
    const profileByCleanSlug = await profileService.getProfileBySlug(targetSlug);
    console.log('SUCCESS! Resolved name:', profileByCleanSlug.fullName);

    // 2. Try resolving by old profileSlug
    const oldSlug = 'abhishek-prasad-rc_EMMX3X'; // Supposedly the old profileSlug or similar
    console.log(`\nTesting retrieval for old/arbitrary fallback value: "${oldSlug}"`);
    try {
      const profileByOldSlug = await profileService.getProfileBySlug(oldSlug);
      console.log('SUCCESS! Resolved name:', profileByOldSlug.fullName);
    } catch (err) {
      console.log('Expected fail or fallback if no user has this profileSlug anymore:', err.message);
    }

    // 3. Try resolving by email
    const email = 'abhishek.prasad@test.com'; // We know Abhishek's email
    console.log(`\nTesting retrieval for email: "${email}"`);
    const profileByEmail = await profileService.getProfileBySlug(email);
    console.log('SUCCESS! Resolved name:', profileByEmail.fullName);

    console.log('\nAll tests completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed:', err);
    process.exit(1);
  }
}

verify();
