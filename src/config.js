module.exports = {
    PORT: process.env.PORT || 8000,
    API_TOKEN: process.env.API_TOKEN || 'false-api-token',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL_URL || 'postgresql://admin@localhost/noteful',
    TEST_DATABASE_URL_URL: process.env.TEST_DATABASE_URL_URL || 'postgresql://admin@localhost/noteful-test',
  }