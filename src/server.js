const knex = require('knex');
const app = require('./app')
const { PORT, DATABASE_URL } = require('./config')

console.log(DATABASE_URL + 'this is the url connecting to');

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
})

app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})