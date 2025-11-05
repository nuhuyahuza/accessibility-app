export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
      OCR_API_KEY: process.env.OCR_API_KEY,
      API_URL: process.env.API_URL,
    },
  };
};


