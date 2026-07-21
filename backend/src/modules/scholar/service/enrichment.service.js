/**
 * enrichment.service.js
 *
 * Metadata Enrichment Service for the Google Scholar Import Pipeline.
 *
 * Responsibilities:
 *  1. DOI Lookup — given a title (+ year + authors), attempts to find a DOI via Crossref,
 *     OpenAlex, and Semantic Scholar in sequence. Returns the first DOI found.
 *  2. Metadata Retrieval — given a DOI, fetches full metadata from Crossref, OpenAlex,
 *     Semantic Scholar, and Unpaywall to fill missing abstract, pdfURL, journal, volume, issue,
 *     pages, publisher, and keywords.
 *  3. Merge Strategy — only fills fields that are MISSING in the source publication object;
 *     never overwrites values that came from Google Scholar.
 *  4. Mock Mode — when SerpAPI key is 'demoserpapikey', returns deterministic mock enrichment
 *     data so local development and tests work without real API calls.
 *  5. Resilience — all external calls are wrapped with a 2.5s timeout and a try-catch fallback;
 *     failures are logged but never crash the import pipeline.
 *
 * Usage (within scholar.service.js):
 *   const enrichmentService = require('./enrichment.service');
 *   const doi = await enrichmentService.lookupDOI(title, year, authors);
 *   const metadata = await enrichmentService.fetchMetadata(doi, title);
 *   const enriched = enrichmentService.merge(publicationObject, metadata);
 */

const axios = require('axios');
const logger = require('../../../common/logger/winston');
const environment = require('../../../config/environment');

/** Request timeout in milliseconds for all external enrichment API calls */
const REQUEST_TIMEOUT_MS = 8000; // Increased to 8 seconds to handle slower responses

/** Rate limiting: minimum delay between requests to external APIs (ms) */
const RATE_LIMIT_DELAY_MS = 2000; // 2 seconds between requests to avoid 429 errors

class EnrichmentService {
  constructor() {
    this.isMockMode = !environment.serpApi?.key || environment.serpApi.key === 'demoserpapikey';
    this.politeEmail = environment.email?.user || 'help.research.connect@gmail.com';
    this.doiCache = new Map();
    this.metadataCache = new Map();
    this.lastRequestTime = 0; // Track last request time for rate limiting
  }

  /**
   * Sleep utility for rate limiting
   * @param {number} ms - Milliseconds to sleep
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for rate limit before making external API request
   */
  async _waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
      const waitTime = RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
      await this._sleep(waitTime);
    }
    this.lastRequestTime = Date.now();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Attempt to find a DOI for a publication by title + optional year + optional authors.
   * Queries Crossref → OpenAlex → Semantic Scholar in sequence.
   *
   * @param {string} title          — Publication title
   * @param {number} [year]         — Publication year (improves match quality)
   * @param {string} [authorString] — Comma-separated author names
   * @returns {Promise<string|null>} DOI string or null
   */
  async lookupDOI(title, year = null, authorString = '') {
    if (!title || title.trim().length < 5) return null;

    if (this.isMockMode) {
      return this._mockDOI(title);
    }

    const cacheKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (this.doiCache.has(cacheKey)) {
      return this.doiCache.get(cacheKey);
    }

    // Try each provider in order, return first DOI found
    const strategies = [
      () => this._crossrefDOI(title, year, authorString),
      () => this._openAlexDOI(title, year),
      () => this._semanticScholarDOI(title)
    ];

    for (const strategy of strategies) {
      try {
        const doi = await strategy();
        if (doi) {
          logger.info(`[Enrichment] DOI found for title "${title.substring(0, 60)}...": ${doi}`);
          this.doiCache.set(cacheKey, doi);
          return doi;
        }
      } catch (err) {
        logger.debug(`[Enrichment] DOI lookup strategy failed for "${title.substring(0, 45)}": ${err.message}`);
      }
    }

    this.doiCache.set(cacheKey, null);
    return null;
  }

  /**
   * Fetch enrichment metadata for a given DOI.
   * Queries Crossref → OpenAlex → Semantic Scholar → Unpaywall in sequence,
   * merging results so each provider fills only what the previous left empty.
   *
   * @param {string} doi   — Resolved DOI (e.g. '10.1145/3097983')
   * @param {string} title — Fallback title for Semantic Scholar lookup
   * @returns {Promise<EnrichmentMetadata>}
   */
  async fetchMetadata(doi, title = '') {
    if (!doi && !title) return {};

    if (this.isMockMode) {
      return this._mockMetadata(doi || title);
    }

    const cacheKey = doi ? this._normalizeDOI(doi) : `title:${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey);
    }

    let metadata = {};

    // Crossref
    if (doi) {
      try {
        const crossref = await this._crossrefMetadata(doi);
        metadata = this._mergeMetadata(metadata, crossref);
      } catch (err) {
        logger.debug(`[Enrichment] Crossref metadata fetch failed for DOI ${doi}: ${err.message}`);
      }
    }

    // OpenAlex
    if (doi) {
      try {
        const openalex = await this._openAlexMetadata(doi);
        metadata = this._mergeMetadata(metadata, openalex);
      } catch (err) {
        logger.debug(`[Enrichment] OpenAlex metadata fetch failed for DOI ${doi}: ${err.message}`);
      }
    }

    // Semantic Scholar (use title as fallback if DOI didn't return abstract)
    if (!metadata.abstract) {
      try {
        const semScholar = await this._semanticScholarMetadata(doi, title);
        metadata = this._mergeMetadata(metadata, semScholar);
      } catch (err) {
        logger.debug(`[Enrichment] Semantic Scholar metadata fetch failed: ${err.message}`);
      }
    }

    // Unpaywall (open-access PDF)
    if (doi && !metadata.pdfURL) {
      try {
        const unpaywall = await this._unpaywallMetadata(doi);
        metadata = this._mergeMetadata(metadata, unpaywall);
      } catch (err) {
        logger.debug(`[Enrichment] Unpaywall fetch failed for DOI ${doi}: ${err.message}`);
      }
    }

    this.metadataCache.set(cacheKey, metadata);
    return metadata;
  }

  /**
   * Merge enrichment metadata into a publication object.
   * Only fills fields that are EMPTY/MISSING in the original object.
   * Never overwrites existing values.
   *
   * @param {object} publication   — Publication object (from Google Scholar / DB)
   * @param {object} enrichedMeta  — Metadata from enrichment providers
   * @returns {object}             — Merged publication object
   */
  merge(publication, enrichedMeta) {
    if (!enrichedMeta || typeof enrichedMeta !== 'object') return publication;

    const fillIfMissing = (field, value) => {
      if (value !== undefined && value !== null && value !== '') {
        if (!publication[field] || publication[field] === '') {
          publication[field] = value;
        }
      }
    };

    fillIfMissing('doi', enrichedMeta.doi);
    fillIfMissing('abstract', enrichedMeta.abstract);
    fillIfMissing('pdfURL', enrichedMeta.pdfURL);
    fillIfMissing('journal', enrichedMeta.journal);
    fillIfMissing('volume', enrichedMeta.volume);
    fillIfMissing('issue', enrichedMeta.issue);
    fillIfMissing('pages', enrichedMeta.pages);
    fillIfMissing('publisher', enrichedMeta.publisher);
    fillIfMissing('openAccess', enrichedMeta.openAccess);
    fillIfMissing('publicationDate', enrichedMeta.publicationDate);
    fillIfMissing('issn', enrichedMeta.issn);
    fillIfMissing('isbn', enrichedMeta.isbn);
    fillIfMissing('publicationType', enrichedMeta.publicationType);

    // Keywords — merge arrays without duplicates
    if (enrichedMeta.keywords && Array.isArray(enrichedMeta.keywords) && enrichedMeta.keywords.length > 0) {
      const existing = Array.isArray(publication.keywords) ? publication.keywords : [];
      const merged = [...new Set([...existing, ...enrichedMeta.keywords])];
      if (merged.length > existing.length) {
        publication.keywords = merged;
      }
    }

    return publication;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: DOI Lookup Strategies
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Crossref DOI lookup by title + optional year/author filter.
   * Uses the /works endpoint with mailto for polite pool access.
   */
  async _crossrefDOI(title, year, authorString) {
    // Skip very short titles that cause 400 errors
    if (!title || title.trim().length < 10) {
      logger.debug(`[Enrichment] Skipping Crossref DOI lookup for short title: "${title}"`);
      return null;
    }

    await this._waitForRateLimit(); // Respect rate limits

    // Clean title for better matching
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanTitle.length < 10) {
      return null;
    }

    const params = {
      query: cleanTitle,
      rows: 1,
      mailto: this.politeEmail
    };
    if (year) params.filter = `from-pub-date:${year - 1},until-pub-date:${year + 1}`;

    try {
      const response = await axios.get('https://api.crossref.org/works', {
        params,
        timeout: REQUEST_TIMEOUT_MS
      });

      const items = response.data?.message?.items;
      if (!items || items.length === 0) return null;

      const item = items[0];
      const itemTitle = (item.title?.[0] || '').toLowerCase();
      const similarity = this._jaccardSimilarity(title.toLowerCase(), itemTitle);

      // Only accept if title similarity is high enough
      if (similarity < 0.70) return null;

      return item.DOI ? this._normalizeDOI(item.DOI) : null;
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] Crossref rate limit hit for "${title.substring(0, 40)}..." - backing off`);
        await this._sleep(5000); // 5 second backoff on rate limit
        return null;
      }
      // Handle 400 errors gracefully
      if (err.response?.status === 400) {
        logger.debug(`[Enrichment] Crossref 400 error for "${title.substring(0, 40)}..." - skipping`);
        return null;
      }
      throw err;
    }
  }

  /**
   * OpenAlex DOI lookup by title.
   */
  async _openAlexDOI(title, year) {
    await this._waitForRateLimit(); // Respect rate limits

    const params = {
      search: title,
      per_page: 1,
      mailto: this.politeEmail
    };
    if (year) params.filter = `publication_year:${year}`;

    try {
      const response = await axios.get('https://api.openalex.org/works', {
        params,
        timeout: REQUEST_TIMEOUT_MS
      });

      const results = response.data?.results;
      if (!results || results.length === 0) return null;

      const work = results[0];
      const workTitle = (work.title || '').toLowerCase();
      const similarity = this._jaccardSimilarity(title.toLowerCase(), workTitle);
      if (similarity < 0.70) return null;

      const doi = work.doi ? work.doi.replace('https://doi.org/', '') : null;
      return doi ? this._normalizeDOI(doi) : null;
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] OpenAlex rate limit hit for "${title.substring(0, 40)}..." - backing off`);
        await this._sleep(3000); // 3 second backoff on rate limit
        return null;
      }
      throw err;
    }
  }

  /**
   * Semantic Scholar DOI lookup by title.
   */
  async _semanticScholarDOI(title) {
    await this._waitForRateLimit(); // Respect rate limits

    try {
      const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params: {
          query: title,
          limit: 1,
          fields: 'title,externalIds'
        },
        timeout: REQUEST_TIMEOUT_MS
      });

      const papers = response.data?.data;
      if (!papers || papers.length === 0) return null;

      const paper = papers[0];
      const similarity = this._jaccardSimilarity(title.toLowerCase(), (paper.title || '').toLowerCase());
      if (similarity < 0.70) return null;

      const doi = paper.externalIds?.DOI;
      return doi ? this._normalizeDOI(doi) : null;
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] Semantic Scholar rate limit hit for DOI lookup - backing off`);
        await this._sleep(3000); // 3 second backoff on rate limit
        return null;
      }
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: Metadata Fetch Strategies
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch metadata from Crossref by DOI.
   */
  async _crossrefMetadata(doi) {
    await this._waitForRateLimit(); // Respect rate limits

    try {
      const response = await axios.get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
        params: { mailto: this.politeEmail },
        timeout: REQUEST_TIMEOUT_MS
      });

      const item = response.data?.message;
      if (!item) return {};

      const typeMap = {
        'journal-article': 'Journal Paper',
        'proceedings-article': 'Conference Paper',
        'proceedings': 'Conference Paper',
        'book-chapter': 'Book Chapter',
        'book': 'Book',
        'monograph': 'Book',
        'edited-book': 'Book'
      };

      return {
        doi: item.DOI ? this._normalizeDOI(item.DOI) : undefined,
        abstract: item.abstract ? this._stripHtmlTags(item.abstract) : undefined,
        journal: item['container-title']?.[0] || undefined,
        volume: item.volume || undefined,
        issue: item.issue || undefined,
        pages: item.page || undefined,
        publisher: item.publisher || undefined,
        isbn: item.ISBN?.[0] || undefined,
        issn: item.ISSN?.[0] || undefined,
        publicationType: typeMap[item.type] || undefined,
        publicationDate: item.published?.['date-parts']?.[0]
          ? new Date(`${item.published['date-parts'][0][0]}-${String(item.published['date-parts'][0][1] || 1).padStart(2, '0')}-01`)
          : undefined,
        keywords: (item.subject || []).slice(0, 10)
      };
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] Crossref metadata rate limit hit for DOI ${doi.substring(0, 30)}... - backing off`);
        await this._sleep(3000); // 3 second backoff on rate limit
        return {};
      }
      throw err;
    }
  }

  /**
   * Fetch metadata from OpenAlex by DOI.
   */
  async _openAlexMetadata(doi) {
    await this._waitForRateLimit(); // Respect rate limits

    try {
      const response = await axios.get(`https://api.openalex.org/works/https://doi.org/${doi}`, {
        params: { mailto: this.politeEmail },
        timeout: REQUEST_TIMEOUT_MS
      });

      const work = response.data;
      if (!work) return {};

      return {
        abstract: work.abstract_inverted_index
          ? this._invertedIndexToAbstract(work.abstract_inverted_index)
          : undefined,
        journal: work.host_venue?.display_name || undefined,
        openAccess: work.open_access?.is_oa || undefined,
        pdfURL: work.open_access?.oa_url || undefined,
        keywords: (work.concepts || []).slice(0, 8).map(c => c.display_name)
      };
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] OpenAlex metadata rate limit hit for DOI ${doi.substring(0, 30)}... - backing off`);
        await this._sleep(3000); // 3 second backoff on rate limit
        return {};
      }
      throw err;
    }
  }

  /**
   * Fetch metadata from Semantic Scholar.
   * Falls back to title search if DOI lookup returns 404.
   */
  async _semanticScholarMetadata(doi, title = '') {
    let paper = null;

    // Try by DOI first
    if (doi) {
      await this._waitForRateLimit(); // Respect rate limits
      try {
        const response = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(doi)}`, {
          params: { fields: 'title,abstract,year,fieldsOfStudy,openAccessPdf,externalIds' },
          timeout: REQUEST_TIMEOUT_MS
        });
        paper = response.data;
      } catch (err) {
        // Handle rate limiting specifically
        if (err.response?.status === 429) {
          logger.warn(`[Enrichment] Semantic Scholar DOI metadata rate limit hit - backing off`);
          await this._sleep(3000); // 3 second backoff on rate limit
          // Don't throw, continue to title search
        } else if (err.response?.status !== 404) {
          throw err;
        }
      }
    }

    // Fallback: search by title
    if (!paper && title) {
      await this._waitForRateLimit(); // Respect rate limits
      try {
        const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
          params: {
            query: title,
            limit: 1,
            fields: 'title,abstract,year,fieldsOfStudy,openAccessPdf'
          },
          timeout: REQUEST_TIMEOUT_MS
        });
        const papers = response.data?.data;
        if (papers && papers.length > 0) {
          const similarity = this._jaccardSimilarity(title.toLowerCase(), (papers[0].title || '').toLowerCase());
          if (similarity >= 0.70) paper = papers[0];
        }
      } catch (err) {
        // Handle rate limiting specifically
        if (err.response?.status === 429) {
          logger.warn(`[Enrichment] Semantic Scholar title search rate limit hit - backing off`);
          await this._sleep(3000); // 3 second backoff on rate limit
          return {};
        }
        throw err;
      }
    }

    if (!paper) return {};

    return {
      abstract: paper.abstract || undefined,
      pdfURL: paper.openAccessPdf?.url || undefined,
      keywords: (paper.fieldsOfStudy || []).slice(0, 8)
    };
  }

  /**
   * Fetch open-access PDF URL from Unpaywall.
   * Requires a valid DOI.
   */
  async _unpaywallMetadata(doi) {
    await this._waitForRateLimit(); // Respect rate limits

    try {
      const response = await axios.get(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}`, {
        params: { email: this.politeEmail },
        timeout: REQUEST_TIMEOUT_MS
      });

      const data = response.data;
      if (!data) return {};

      return {
        openAccess: data.is_oa || false,
        pdfURL: data.best_oa_location?.url_for_pdf || data.best_oa_location?.url || undefined
      };
    } catch (err) {
      // Handle rate limiting specifically
      if (err.response?.status === 429) {
        logger.warn(`[Enrichment] Unpaywall rate limit hit for DOI ${doi.substring(0, 30)}... - backing off`);
        await this._sleep(3000); // 3 second backoff on rate limit
        return {};
      }
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: Mock Data (used when SerpAPI key is 'demoserpapikey')
  // ─────────────────────────────────────────────────────────────────────────────

  _mockDOI(title) {
    // Generate a stable deterministic mock DOI based on title hash
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    return `10.9999/mock.${slug}`;
  }

  _mockMetadata(doiOrTitle) {
    const slug = (doiOrTitle || 'unknown').replace(/[^a-z0-9]+/g, '-').substring(0, 20);
    return {
      doi: doiOrTitle.startsWith('10.') ? doiOrTitle : this._mockDOI(doiOrTitle),
      abstract: `This is a mock abstract for demonstration purposes. The paper presents novel contributions to the field of artificial intelligence and machine learning, with applications in natural language processing and computer vision. The proposed methodology achieves state-of-the-art performance on standard benchmarks. (Mock enrichment — no real API key configured)`,
      pdfURL: `https://arxiv.org/pdf/mock/${slug}.pdf`,
      journal: 'Journal of Artificial Intelligence Research (Mock)',
      volume: '42',
      issue: '3',
      pages: '1-25',
      publisher: 'MIT Press (Mock)',
      openAccess: true,
      issn: '1076-9757',
      keywords: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Networks'],
      publicationDate: new Date('2023-01-01')
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: Utility Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Deep merge metadata objects — only fills undefined/empty fields from source into target.
   */
  _mergeMetadata(target, source) {
    if (!source || typeof source !== 'object') return target;
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        if (!result[key] || (Array.isArray(result[key]) && result[key].length === 0)) {
          result[key] = value;
        }
        continue;
      }
      if (result[key] === undefined || result[key] === null || result[key] === '') {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Normalize DOI to lowercase without URL prefix.
   */
  _normalizeDOI(doi) {
    return doi.replace(/^https?:\/\/doi\.org\//i, '').toLowerCase().trim();
  }

  /**
   * Jaccard similarity between two strings using word sets.
   */
  _jaccardSimilarity(str1, str2) {
    const tokenize = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
    const set1 = tokenize(str1);
    const set2 = tokenize(str2);
    if (set1.size === 0 || set2.size === 0) return 0;
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  /**
   * Strip HTML tags from a string (used for Crossref abstracts).
   */
  _stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Convert OpenAlex inverted index abstract to a plain string.
   * OpenAlex returns abstracts as { word: [positions] } maps.
   */
  _invertedIndexToAbstract(invertedIndex) {
    try {
      const entries = Object.entries(invertedIndex);
      const words = [];
      for (const [word, positions] of entries) {
        for (const pos of positions) {
          words[pos] = word;
        }
      }
      return words.filter(Boolean).join(' ');
    } catch {
      return '';
    }
  }
}

module.exports = new EnrichmentService();