require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { NODE_ENV } = require('./config')
const validateBearerToken = require('./validate-token');
const errorHandler = require('./error-handler');

const foldersRouter = require('../folders/folders-router');
const notesRouter = require('../notes/notes-router');

const app = express();

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', { skip: () => NODE_ENV === 'test' }))
app.use(helmet());
app.use(cors());
app.use(validateBearerToken);

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use('/api/folders', foldersRouter);
app.use('/api/notes', notesRouter);

app.use(errorHandler);

module.exports = app;