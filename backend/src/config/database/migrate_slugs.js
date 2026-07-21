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
    const users = await User.find({ isDeleted: { $ne: true } });
    console.log(`Found ${users.length} active users to migrate.`);

    const usedSlugs = new Set();

    for (const user of users) {
      const cleanFirst = (user.firstName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      const cleanLast = (user.lastName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      let baseSlug = `${cleanFirst}-${cleanLast}`
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      if (!baseSlug) {
        baseSlug = 'researcher';
      }

      let finalSlug = baseSlug;
      let counter = 1;

      // Ensure uniqueness within the migration run and database
      while (true) {
        if (!usedSlugs.has(finalSlug)) {
          const exists = await User.findOne({ slug: finalSlug, _id: { $ne: user._id } });
          if (!exists) {
            break;
          }
        }
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
      }

      usedSlugs.add(finalSlug);

      user.slug = finalSlug;
      
      // Update profileSlug as well to ensure clean slugs are used by default
      user.profileSlug = finalSlug;
      user.profileUrl = `/profile/${finalSlug}`;
      user.publicProfileUrl = `https://researchconnect.com${user.profileUrl}`;

      await user.save();
      console.log(`Migrated user: ${user.fullName} -> slug: ${finalSlug}`);
    }

    console.log('Migration completed successfully!');
    await mongoose.disconnect();
    console.log('Disconnected!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
