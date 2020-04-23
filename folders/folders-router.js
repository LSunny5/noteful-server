const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../src/logger');
const FoldersService = require('./folders-service')
const {getFolderValidationError} = require('./validate-folder');

const foldersRouter = express.Router()
const jsonParser = express.json()

//check for xss
const serializeFolder = folder => ({
    id: folder.id,
    title: xss(folder.title),
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title } = req.body
        const newFolder = { title }

        for (const field of ['title']) {
            if (!req.body[field]) {
                logger.error({
                    message: `Missing '${field}' in request body`,
                    request: `${req.originalUrl}`,
                    method: `${req.method}`,
                    ip: `${req.ip}`
                });
                return res.status(400).send({
                    error: { message: `Missing '${field}' in request body` }
                });
            }
        }

        //validate the folder
        const error = getFolderValidationError(newFolder);
		if (error) {
			logger.error({
				message: `POST Validation Error`,
				request: `${req.originalUrl}`,
                method: `${req.method}`,
                ip: `${req.ip}`
			});
			return res.status(400).send(error);
		}

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist` }
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

    .patch(jsonParser, (req, res, next) => {
        const { title } = req.body
        const folderToUpdate = { title }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain a 'title'`
                }
            })
        }

        const error = getFolderValidationError(folderToUpdate);
		if (error) {
			logger.error({
				message: `PATCH Validation Error`,
				request: `${req.originalUrl}`,
                method: `${req.method}`,
                ip: `${req.ip}`s
			});
			return res.status(400).send(error);
		}

        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter