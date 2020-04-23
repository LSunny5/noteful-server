module.exports = {
    PORT: process.env.PORT || 8000,
    API_TOKEN: process.env.API_TOKEN || 'false-api-token',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_URL: process.env.DB_URL || 'postgresql://admin@localhost/noteful',
    TEST_DB_URL: process.env.TEST_DB_URL || 'postgresql://admin@localhost/noteful-test',
  }