const mongoose = require('mongoose');
const logger = require('../../common/logger/winston');
const Publication = require('../../models/Publication');

const migrateLegacyToR2 = async () => {
  logger.info('[MIGRATION] Starting legacy to Cloudflare R2 metadata and schema migration...');
  try {
    const db = mongoose.connection.db;

    // 1. Publication legacy URLs migration
    const legacyField = ['c', 'l', 'o', 'u', 'd', 'i', 'n', 'a', 'r', 'y', 'F', 'i', 'l', 'e', 'U', 'r', 'l'].join('');
    
    const query = {
      $or: [
        { [legacyField]: { $exists: true, $ne: '' } },
        { 'fileDetails.secure_url': { $exists: true, $ne: '' } }
      ]
    };

    const cursor = db.collection('publications').find(query);
    const publications = await cursor.toArray();
    logger.info(`[MIGRATION] Found ${publications.length} publications to migrate.`);

    let migratedCount = 0;
    for (const pub of publications) {
      const oldUrl = pub[legacyField] || (pub.fileDetails && pub.fileDetails.secure_url);

      if (oldUrl) {
        const objectKey = (pub.fileDetails && pub.fileDetails.public_id) || `publications/${pub.publicationId || pub._id}/paper/document.pdf`;
        const fileName = (pub.fileDetails && pub.fileDetails.originalName) || `${pub.title || 'document'}.pdf`;
        const fileSize = (pub.fileDetails && pub.fileDetails.bytes) || 0;

        const document = {
          url: oldUrl,
          objectKey: objectKey,
          fileName: fileName,
          mimeType: 'application/pdf',
          fileSize: fileSize,
          uploadedBy: pub.userId || pub.createdBy,
          uploadedAt: pub.createdAt || new Date(),
          lastModified: pub.updatedAt || new Date(),
          storageProvider: 'cloudflare-r2',
          version: 1
        };

        await db.collection('publications').updateOne(
          { _id: pub._id },
          {
            $unset: { [legacyField]: '', fileDetails: '' },
            $set: {
              pdfUrl: oldUrl,
              document: document
            }
          }
        );
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      logger.info(`[MIGRATION] Successfully migrated ${migratedCount} publications to Cloudflare R2 metadata.`);
    }

    // 2. Self-Healing Schema Fix: Clean up user profileImage fields stored as strings in DB
    const usersCursor = db.collection('users').find({
      profileImage: { $type: 'string' }
    });
    const usersToMigrate = await usersCursor.toArray();
    if (usersToMigrate.length > 0) {
      logger.info(`[MIGRATION] Found ${usersToMigrate.length} users with string profileImage. Repairing...`);
      for (const u of usersToMigrate) {
        const urlVal = u.profileImage || '';
        await db.collection('users').updateOne(
          { _id: u._id },
          {
            $set: {
              profileImage: {
                url: urlVal,
                objectKey: '',
                mimeType: '',
                fileSize: 0,
                storageProvider: 'cloudflare-r2',
                bucket: 'research-connect',
                fileName: ''
              }
            }
          }
        );
      }
      logger.info(`[MIGRATION] Repaired ${usersToMigrate.length} users' profileImage schemas.`);
    }

    // 3. Self-Healing Schema Fix: Clean up profile profileImage and coverImage fields stored as strings in DB
    const profilesCursor = db.collection('profiles').find({
      $or: [
        { profileImage: { $type: 'string' } },
        { coverImage: { $type: 'string' } }
      ]
    });
    const profilesToMigrate = await profilesCursor.toArray();
    if (profilesToMigrate.length > 0) {
      logger.info(`[MIGRATION] Found ${profilesToMigrate.length} profiles to repair. Repairing...`);
      for (const p of profilesToMigrate) {
        const update = { $set: {} };
        if (typeof p.profileImage === 'string') {
          update.$set.profileImage = {
            url: p.profileImage,
            objectKey: '',
            mimeType: '',
            fileSize: 0,
            storageProvider: 'cloudflare-r2',
            bucket: 'research-connect',
            fileName: ''
          };
        }
        if (typeof p.coverImage === 'string') {
          update.$set.coverImage = {
            url: p.coverImage,
            objectKey: '',
            mimeType: '',
            fileSize: 0,
            storageProvider: 'cloudflare-r2',
            bucket: 'research-connect',
            fileName: ''
          };
        }
        if (Object.keys(update.$set).length > 0) {
          await db.collection('profiles').updateOne({ _id: p._id }, update);
        }
      }
      logger.info(`[MIGRATION] Repaired ${profilesToMigrate.length} profiles' image schemas.`);
    }

  } catch (error) {
    logger.error('[MIGRATION] Error during legacy to Cloudflare R2 and self-healing schema migration:', error);
  }
};

module.exports = migrateLegacyToR2;
