require('dotenv').config();

//console.log ('connected to : ' + process.env.DATABASE_URL)

module.exports = {
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "connectionString": (process.env.NODE_ENV === 'test')
     ? process.env.TEST_DATABASE_URL
     : process.env.DATABASE_URL_URL,
     "ssl": !!process.env.SSL,
}