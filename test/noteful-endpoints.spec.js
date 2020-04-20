const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray, makeFoldersArray, makeMaliciousFolder, makeMaliciousNote } = require('./noteful-fixtures')

describe('Noteful Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))
    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    describe('Folder Endpoints', () => {
        describe(`GET /api/folders`, () => {
            context(`Given no folders`, () => {
                it(`responds with 200 and an empty list`, () => {
                    return supertest(app)
                        .get('/api/folders')
                        .expect(200, [])
                })
            })

            context('Given there are folders in the database', () => {
                const testFolders = makeFoldersArray();

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it('responds with 200 and all of the articles', () => {
                    return supertest(app)
                        .get('/api/folders')
                        .expect(200, testFolders)
                })
            })
        })

        describe(`POST /api/folders`, () => {
            const testFolders = makeFoldersArray();
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            //FIX THIS TEST ****************************************************
            it(`creates a folder, responding with 201 and the new folder`, () => {
                const newFolder = {
                    title: 'New Folder 1',
                }
                return supertest(app)
                    .post('/api/folders')
                    .send(newFolder)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newFolder.title)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                    })
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${res.body.id}`)
                            .expect(res.body)
                    )
            })

            const requiredFields = ['title']

            requiredFields.forEach(field => {
                const newFolder = {
                    title: 'Test new Folder',
                }

                it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                    delete newFolder[title]

                    return supertest(app)
                        .post('/api/folders')
                        .send(newFolder)
                        .expect(400, {
                            error: { message: `Missing '${field}' in request body` }
                        })
                })
            })

            it('removes XSS attack content from response', () => {
                const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
                return supertest(app)
                    .post(`/api/folders`)
                    .send(maliciousFolder)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedFolder.title)
                        expect(res.body.content).to.eql(expectedFolder.content)
                    })
            })
        })

        describe(`DELETE /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .delete(`/api/folders/${folderId}`)
                        .expect(404, { error: { message: `Folder doesn't exist` } })
                })
            })

            context('Given there are folders in the database', () => {
                const testFolders = makeFoldersArray()

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it('responds with 204 and removes the folder', () => {
                    const idToRemove = 2
                    const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/folders/${idToRemove}`)
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/folders`)
                                .expect(expectedFolders)
                        )
                })
            })
        })

        describe(`PATCH /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .patch(`/api/folders/${folderId}`)
                        .expect(404, { error: { message: `Folder doesn't exist` } })
                })
            })

            context('Given there are folders in the database', () => {
                const testFolders = makeFoldersArray()

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it('responds with 204 and updates the article', () => {
                    const idToUpdate = 2
                    const updateFolder = {
                        title: 'updated folder title',
                    }
                    const expectedFolder = {
                        ...testFolders[idToUpdate - 1],
                        ...updateFolder
                    }
                    return supertest(app)
                        .patch(`/api/folders/${idToUpdate}`)
                        .send(updateFolder)
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/folders/${idToUpdate}`)
                                .expect(expectedFolder)
                        )
                })

                it(`responds with 400 when no required fields supplied`, () => {
                    const idToUpdate = 2
                    return supertest(app)
                        .patch(`/api/folders/${idToUpdate}`)
                        .send({ irrelevantField: 'foo' })
                        .expect(400, {
                            error: {
                                message: `Request body must contain either 'title', 'style' or 'content'`
                            }
                        })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const updateFolder = {
                        title: 'updated folder title',
                    }
                    const expectedFolder = {
                        ...testFolders[idToUpdate - 1],
                        ...updateFolder
                    }

                    return supertest(app)
                        .patch(`/api/folders/${idToUpdate}`)
                        .send({
                            ...updateFolder,
                            fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/folders/${idToUpdate}`)
                                .expect(expectedFolder)
                        )
                })
            })
        })
    })

    describe('Notes Endpoints', () => {
        describe(`GET /api/notes`, () => {
            context(`Given no notes`, () => {
                it(`responds with 200 and an empty list`, () => {
                    return supertest(app)
                        .get('/api/notes')
                        .expect(200, [])
                })
            })

            context('Given there are notes in the database', () => {
                const testNotes = makeNotesArray();

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })

                it('responds with 200 and all of the articles', () => {
                    return supertest(app)
                        .get('/api/notes')
                        .expect(200, testNotes)
                })
            })
        })

        describe(`GET /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .get(`/api/notes/${noteId}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context('Given there are notes in the database', () => {
                const testNotes = makeNotesArray();

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })
                it('responds with 200 and the specified note', () => {
                    const noteId = 2
                    const expectedNote = testNotes[noteId - 1]
                    return supertest(app)
                        .get(`/api/notes/${noteId}`)
                        .expect(200, expectedNote)
                })
            })

            context(`Given an XSS attack article`, () => {
                const testNotes = makeNotesArray();
                const { maliciousNote, expectedNote } = makeMaliciousNote()

                beforeEach('insert malicious note', () => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })

                it('removes XSS attack content', () => {
                    return supertest(app)
                        .get(`/api/notes/${maliciousNote.id}`)
                        .expect(200)
                        .expect(res => {
                            expect(res.body.title).to.eql(expectedNote.title)
                            expect(res.body.content).to.eql(expectedNote.content)
                        })
                })
            })
        })

        describe(`POST /api/notes`, () => {
            const testNotes = makeNotesArray();
            beforeEach('insert notes', () => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })

            it(`creates a note, responding with 201 and the new note`, () => {
                const newNote = {
                    title: 'Test new article',
                    content: 'Test new article content...',
                    modified: '2019-12-12 03:30:02',
                    folder_id: 1,
                }
                return supertest(app)
                    .post('/api/notes')
                    .send(newNote)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newNote.title)
                        expect(res.body.content).to.eql(newNote.content)
                        expect(res.body.modified).to.eql(newNote.modified)
                        expect(res.body.folder_id).to.eql(newNote.folder_id)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                        const expected = new Intl.DateTimeFormat('en-US').format(new Date())
                        const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.modified))
                        expect(actual).to.eql(expected)
                    })
                    .then(res =>
                        supertest(app)
                            .get(`/api/notes/${res.body.id}`)
                            .expect(res.body)
                    )
            })

            const requiredFields = ['title', 'content', 'folder_id']

            requiredFields.forEach(field => {
                const newNote = {
                    title: 'Test new article',
                    content: 'Test new article content...',
                    folder_id: 2,
                }

                it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                    delete newNote[field]

                    return supertest(app)
                        .post('/api/notes')
                        .send(newNote)
                        .expect(400, {
                            error: { message: `Missing '${field}' in request body` }
                        })
                })
            })

            it('removes XSS attack content from response', () => {
                const { maliciousNote, expectedNote } = makeMaliciousNote()
                return supertest(app)
                    .post(`/api/notes`)
                    .send(maliciousNote)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedNote.title)
                        expect(res.body.content).to.eql(expectedNote.content)
                    })
            })
        })

        describe(`DELETE /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .delete(`/api/articles/${noteId}`)
                        .expect(404, { error: { message: `Article doesn't exist` } })
                })
            })

            context('Given there are articles in the database', () => {
                const testNotes = makeNotesArray();

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })

                it('responds with 204 and removes the note', () => {
                    const idToRemove = 2
                    const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/notes/${idToRemove}`)
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/notes`)
                                .expect(expectedNotes)
                        )
                })
            })
        })

        describe(`PATCH /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .patch(`/api/notes/${noteId}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context('Given there are notes in the database', () => {
                const testNotes = makeNotesArray();

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })

                it('responds with 204 and updates the note', () => {
                    const idToUpdate = 2
                    const updateNote = {
                        title: 'updated note title',
                        content: 'updated note content',
                        modified: '2019-6-6 03:30:02',
                        folder_id: idToUpdate,
                    }
                    const expectedNote = {
                        ...testNotes[idToUpdate - 1],
                        ...updateNote
                    }
                    return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send(updateNote)
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/notes/${idToUpdate}`)
                                .expect(expectedNote)
                        )
                })

                it(`responds with 400 when no required fields supplied`, () => {
                    const idToUpdate = 2
                    return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send({ irrelevantField: 'foo' })
                        .expect(400, {
                            error: {
                                message: `Request body must contain either 'title', 'content' or 'folder id'`
                            }
                        })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const updateNote = {
                        title: 'updated note title',
                    }
                    const expectedNote = {
                        ...testNotes[idToUpdate - 1],
                        ...updateNote
                    }

                    return supertest(app)
                        .patch(`/api/articles/${idToUpdate}`)
                        .send({
                            ...updateNote,
                            fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/notes/${idToUpdate}`)
                                .expect(expectedNote)
                        )
                })
            })
        })
    })
})