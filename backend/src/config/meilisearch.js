const { MeiliSearch } = require('meilisearch');
const logger = require('../common/logger/winston');

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_KEY = process.env.MEILI_KEY || 'masterKey123456';

let meiliClient = null;
let isMeiliAvailable = false;

try {
  meiliClient = new MeiliSearch({
    host: MEILI_HOST,
    apiKey: MEILI_KEY
  });
  
  // Test connection asynchronously
  meiliClient.getHealth()
    .then((health) => {
      if (health.status === 'available') {
        isMeiliAvailable = true;
        logger.info(`🔍 Meilisearch connected successfully at: ${MEILI_HOST}`);
        // Initialize indexes
        initializeMeiliIndexes();
      }
    })
    .catch((err) => {
      logger.warn(`🔍 Meilisearch not responding at ${MEILI_HOST}. Caching offline fallback. Error: ${err.message}`);
    });
} catch (err) {
  logger.error('Failed to initialize Meilisearch client:', err);
}

const INDEXES = {
  publications: 'publications',
  users: 'users',
  projects: 'projects',
  institutions: 'institutions'
};

async function initializeMeiliIndexes() {
  try {
    for (const key of Object.keys(INDEXES)) {
      const indexName = INDEXES[key];
      // Create index if it does not exist
      await meiliClient.createIndex(indexName, { primaryKey: 'id' }).catch(() => {});
      logger.info(`Meilisearch index verified: ${indexName}`);
    }
  } catch (err) {
    logger.error('Failed verifying Meilisearch indexes:', err.message);
  }
}

const syncToMeili = async (indexName, document) => {
  if (!isMeiliAvailable || !meiliClient) return;
  try {
    const index = meiliClient.index(indexName);
    // Ensure document has standard 'id' mapped from '_id'
    const docToSync = { ...document, id: document._id?.toString() || document.id };
    await index.addDocuments([docToSync]);
    logger.info(`[MEILI SYNC] Synced document ${docToSync.id} to index ${indexName}`);
  } catch (err) {
    logger.error(`[MEILI SYNC ERROR] Failed syncing to index ${indexName}: ${err.message}`);
  }
};

const removeFromMeili = async (indexName, docId) => {
  if (!isMeiliAvailable || !meiliClient) return;
  try {
    const index = meiliClient.index(indexName);
    await index.deleteDocument(docId.toString());
    logger.info(`[MEILI DELETE] Deleted document ${docId} from index ${indexName}`);
  } catch (err) {
    logger.error(`[MEILI DELETE ERROR] Failed deleting from index ${indexName}: ${err.message}`);
  }
};

module.exports = {
  meiliClient,
  isMeiliAvailable: () => isMeiliAvailable,
  INDEXES,
  syncToMeili,
  removeFromMeili
};
