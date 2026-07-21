const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { connectDB } = require('../../config/database/connection');

const SearchService = require('./service/search.service');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Institution = require('../../models/Institution');
const PublicationKeyword = require('../../models/PublicationKeyword');

async function run() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected!');

  try {
    // 1. Create mock keyword mappings if none exist
    console.log('Ensuring dummy data is ready...');
    let kw = await PublicationKeyword.findOne();
    if (!kw) {
      const pubId = new mongoose.Types.ObjectId();
      await PublicationKeyword.create({
        publicationId: pubId,
        keyword: 'machine learning'
      });
      console.log('Created test keyword mapping.');
    }

    // 2. Ensure an institution exists
    let inst = await Institution.findOne();
    if (!inst) {
      await Institution.create({
        name: 'Stanford University',
        country: 'United States',
        website: 'https://stanford.edu'
      });
      console.log('Created test institution.');
    }

    console.log('\n--- Test 1: Combined search ("machine") ---');
    const combined = await SearchService.combinedSearch({ q: 'machine' });
    console.log('Combined search result keys:', Object.keys(combined));
    console.log('Publications found:', combined.publications?.length);
    console.log('Keywords found:', combined.keywords?.length);
    console.log('Institutions found:', combined.institutions?.length);

    console.log('\n--- Test 2: Search Keywords ("learning") ---');
    const kwSearch = await SearchService.searchKeywords({ q: 'learning' });
    console.log('Keywords results:', kwSearch.results);
    console.log('Keywords total count:', kwSearch.total);

    console.log('\n--- Test 3: Search Institutions ("Stanford") ---');
    const instSearch = await SearchService.searchInstitutions({ q: 'Stanford' });
    console.log('Institutions results:', instSearch.results);
    console.log('Institutions total count:', instSearch.total);

    console.log('\n=============================');
    console.log('🎉 ALL Search tests ran successfully!');
    console.log('=============================');
  } catch (err) {
    console.error('Test execution failed: ', err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
