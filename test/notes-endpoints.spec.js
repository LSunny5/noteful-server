const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray, makeMaliciousNote } = require('./note-fixtures')
const { makeFoldersArray } = require('./folder-fixtures');

describe('Notes Endpoints', function () {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))
    afterEach('cleanup', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))

    describe(`Unauthorized requests`, () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();

        beforeEach('insert notes', () => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes);
                });
        });

        it(`responds with 401 Unauthorized for GET /api/notes`, () => {
            return supertest(app)
                .get('/api/notes')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/notes`, () => {
            return supertest(app)
                .post('/api/notes')
                .send({
                    name: 'example note title',
                    content: 'content for example',
                    id_folder: 1
                })
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/notes/:note_id`, () => {
            const oneNote = testNotes[1];
            return supertest(app)
                .get(`/api/notes/${oneNote.id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/notes/:note_id`, () => {
            const oneNote = testNotes[1];
            return supertest(app)
                .delete(`/api/notes/${oneNote.id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/notes`, () => {
        context(`Given no notes`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            });
        });

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 200 and all of the notes', () => {
                return supertest(app)
                    .get('/api/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testNotes);
            });
        });

        /* context(`Given an XSS attack note`, () => {
            const testFolders = makeFoldersArray();
            const { maliciousNote, expectedNote } = makeMaliciousNote();

            beforeEach('insert malicious note', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert([maliciousNote]);
                    });
            });

            it('removes XSS attack note name or content', () => {
                return supertest(app)
                    .get(`/api/notes`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedNote.name);
                        expect(res.body[0].content).to.eql(expectedNote.content);
                    });
            });
        }); */
    });

    describe(`GET /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 200 and the specified note', () => {
                const noteId = 2;
                const expectedNote = testNotes[noteId - 1];
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedNote)
            })
        })

        /* context(`Given an XSS attack note`, () => {
            const testFolders = makeFoldersArray();
            const { maliciousNote, expectedNote } = makeMaliciousNote()

            beforeEach('insert malicious note', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert([maliciousNote])
                    });
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/notes/${maliciousNote.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedNote.title)
                        expect(res.body.content).to.eql(expectedNote.content)
                    });
            });
        }); */
    });

    describe(`POST /api/notes`, () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();

        beforeEach('insert notes', () => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes);
                });
        });

        /* it(`creates a note, responding with 201 and the new note`, () => {
            const newNote = {
                title: 'Test new note',
                content: 'Test new note content...',
                folder_id: 4,
            }
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newNote.title)
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/notes/${res.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(res.body)
                );
        }); */

        const requiredFields = ['title', 'content', 'folder_id']

        requiredFields.forEach(field => {
            const newNote = {
                title: 'Test new note',
                content: 'Test new note content...',
                folder_id: 2,
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newNote[field];

                return supertest(app)
                    .post('/api/notes')
                    .send(newNote)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        /* it('removes XSS attack content from response', () => {
            const { maliciousNote, expectedNote } = makeMaliciousNote()
            return supertest(app)
                .post(`/api/notes`)
                .send(maliciousNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedNote.title)
                    expect(res.body.content).to.eql(expectedNote.content)
                });
        }); */
    });

    describe(`DELETE /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456;
                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            });
        });

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 204 and removes the note', () => {
                const idToRemove = 2
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/notes`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(200, expectedNotes)
                    );
            });
        });
    })

    describe(`PATCH /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456;
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            });
        });

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 204 and updates the note', () => {
                const idToUpdate = 2
                const updateNote = {
                    title: 'updated note title',
                    content: 'updated note content',
                    folder_id: 1,
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(200, expectedNote)
                    )
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: {
                            message: `Request body must contain a 'title', 'content', or 'folder_id'`
                        }
                    });
            });

            /* it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateNote = {
                    title: 'updated note title',
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(200, expectedNote)
                    );
            }); */
        });
    });
});