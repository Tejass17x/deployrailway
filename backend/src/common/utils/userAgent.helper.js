const parseBrowser = (ua) => {
  if (!ua) return 'Unknown';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';
  if (/edge/i.test(ua)) return 'Edge';
  return 'Other';
};

const parsePlatform = (ua) => {
  if (!ua) return 'Unknown';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
};

const getDeviceType = (ua) => {
  if (!ua) return 'desktop';
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
  if (/ipad|playbook|silk|tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

const getClientInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  const browser = parseBrowser(ua);
  const device = getDeviceType(ua);
  const os = parsePlatform(ua);
  
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || (req.socket ? req.socket.remoteAddress : '') || '',
    userAgent: ua,
    browser,
    device,
    os,
    location: req.headers['x-app-location'] || 'Unknown'
  };
};

module.exports = {
  parseBrowser,
  parsePlatform,
  getDeviceType,
  getClientInfo
};
