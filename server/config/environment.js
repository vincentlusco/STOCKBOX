const validateEnvironment = () => {
  const requiredEnv = {
    // Server Config
    PORT: process.env.PORT || '2008',
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    
    // Security
    JWT_SECRET: process.env.JWT_SECRET
  };

  const missingEnv = [];
  Object.entries(requiredEnv).forEach(([name, value]) => {
    if (!value) missingEnv.push(name);
  });

  return {
    status: missingEnv.length === 0,
    config: requiredEnv,
    missing: missingEnv
  };
};

module.exports = { validateEnvironment }; 