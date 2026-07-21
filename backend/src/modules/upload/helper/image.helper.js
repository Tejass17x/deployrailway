const sharp = require('sharp');

/**
 * Compress and optimize avatar images
 * @param {Buffer} buffer - Raw image buffer
 * @returns {Promise<Buffer>} - Compressed WebP buffer
 */
const compressAvatar = async (buffer) => {
  return await sharp(buffer)
    .resize(512, 512, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 80 })
    .toBuffer();
};

/**
 * Compress and optimize banner images
 * @param {Buffer} buffer - Raw image buffer
 * @returns {Promise<Buffer>} - Compressed WebP buffer
 */
const compressBanner = async (buffer) => {
  return await sharp(buffer)
    .resize(1920, 480, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 80 })
    .toBuffer();
};

/**
 * Generate a thumbnail version of an avatar
 * @param {Buffer} buffer - Raw image buffer
 * @returns {Promise<Buffer>} - Compressed WebP thumbnail buffer
 */
const generateThumbnail = async (buffer) => {
  return await sharp(buffer)
    .resize(150, 150, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 75 })
    .toBuffer();
};

module.exports = {
  compressAvatar,
  compressBanner,
  generateThumbnail
};
