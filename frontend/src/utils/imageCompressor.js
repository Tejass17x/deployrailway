/**
 * Client-side image compression, resize, and validation utility.
 * Automatically converts JPG/PNG to WebP and strips EXIF data via canvas.
 *
 * Presets:
 *   avatar  — 512×512 (square crop), quality 0.85
 *   banner  — 1920×480 (wide crop), quality 0.85
 *   general — 800×800 (proportional), quality 0.80
 *
 * @param {File} file - The original uploaded file.
 * @param {'avatar'|'banner'|'general'} preset - Compression preset to use.
 * @returns {Promise<File>} Compressed WebP file ready for upload.
 */

const PRESETS = {
  avatar: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    maxSizeBytes: 5 * 1024 * 1024,  // 5MB input limit
    crop: true   // Center-crop to square
  },
  banner: {
    maxWidth: 1920,
    maxHeight: 480,
    quality: 0.85,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB input limit
    crop: false  // Proportional resize
  },
  general: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.80,
    maxSizeBytes: 5 * 1024 * 1024,
    crop: false
  }
};

export const compressImage = (file, presetName = 'general') => {
  return new Promise((resolve, reject) => {
    const preset = PRESETS[presetName] || PRESETS.general;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('Invalid image type. Only JPG, PNG, and WEBP are supported.'));
    }

    // Validate file size
    if (file.size > preset.maxSizeBytes) {
      const maxMB = (preset.maxSizeBytes / (1024 * 1024)).toFixed(0);
      return reject(new Error(`File is too large. Maximum allowed size is ${maxMB}MB.`));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (preset.crop) {
          // Center-crop to the target aspect ratio (square for avatar)
          const targetAspect = preset.maxWidth / preset.maxHeight;
          const sourceAspect = width / height;

          let sx = 0, sy = 0, sWidth = width, sHeight = height;

          if (sourceAspect > targetAspect) {
            // Image is wider than target — crop sides
            sWidth = Math.round(height * targetAspect);
            sx = Math.round((width - sWidth) / 2);
          } else if (sourceAspect < targetAspect) {
            // Image is taller than target — crop top/bottom
            sHeight = Math.round(width / targetAspect);
            sy = Math.round((height - sHeight) / 2);
          }

          canvas.width = preset.maxWidth;
          canvas.height = preset.maxHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, preset.maxWidth, preset.maxHeight);
        } else {
          // Proportional resize — fit within maxWidth × maxHeight
          if (width > preset.maxWidth) {
            height = Math.round((height * preset.maxWidth) / width);
            width = preset.maxWidth;
          }
          if (height > preset.maxHeight) {
            width = Math.round((width * preset.maxHeight) / height);
            height = preset.maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Always output as WebP — smallest size, best quality, EXIF stripped
        const outputType = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas compression failed. Please try a different image.'));
            }

            // Build output filename
            const originalName = file.name;
            const lastDotIndex = originalName.lastIndexOf('.');
            const namePrefix = lastDotIndex !== -1
              ? originalName.substring(0, lastDotIndex)
              : originalName;

            const compressedFile = new File([blob], `${namePrefix}_${presetName}.webp`, {
              type: outputType,
              lastModified: Date.now()
            });

            console.info(
              `[ImageCompressor] ${presetName}: ${(file.size / 1024).toFixed(1)} KB → ${(compressedFile.size / 1024).toFixed(1)} KB (${canvas.width}×${canvas.height})`
            );

            resolve(compressedFile);
          },
          outputType,
          preset.quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image. The file may be corrupted.'));
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
  });
};

// Convenience exports
export const compressAvatar = (file) => compressImage(file, 'avatar');
export const compressBanner = (file) => compressImage(file, 'banner');
