export default ({ config }) => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  
  // Log API key status for debugging
  console.log('🔑 API Key status:', apiKey ? 'Configured' : 'Missing');
  
  if (!apiKey) {
    console.warn('⚠️ GOOGLE_VISION_API_KEY not set in environment');
  }
  
  return {
    ...config,
    extra: {
      ...config.extra,
      GOOGLE_VISION_API_KEY: apiKey || undefined,
      OCR_API_KEY: process.env.OCR_API_KEY || undefined,
      API_URL: process.env.API_URL || undefined,
    },
  };
};


