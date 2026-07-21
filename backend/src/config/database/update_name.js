const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./connection');

async function updateName() {
  try {
    await connectDB();
    console.log('Connected!');

    const User = mongoose.model('User');

    const targetEmail = 'codewithsushil7236@gmail.com';
    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.error(`No user found with email: ${targetEmail}`);
      process.exit(1);
    }

    console.log(`\nFound user: ${user.fullName} (${user.email})`);
    console.log(`Current slug: ${user.slug}`);
    console.log(`Current profileSlug: ${user.profileSlug}`);

    // Update name fields
    user.firstName = 'Sushil Kumar';
    user.lastName = 'Kushwaha';
    user.fullName = 'Sushil Kumar Kushwaha';

    // Generate new clean slug
    const baseSlug = 'sushil-kumar-kushwaha';

    // Check for collision with other users
    const collision = await User.findOne({ slug: baseSlug, _id: { $ne: user._id } });
    const finalSlug = collision ? `${baseSlug}-2` : baseSlug;

    user.slug = finalSlug;
    user.profileSlug = finalSlug;
    user.profileUrl = `/profile/${finalSlug}`;
    user.publicProfileUrl = `https://researchconnect.com/profile/${finalSlug}`;

    await user.save();

    console.log(`\n✅ Name updated to: ${user.fullName}`);
    console.log(`✅ New slug: ${user.slug}`);
    console.log(`✅ New profileUrl: ${user.profileUrl}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

updateName();
