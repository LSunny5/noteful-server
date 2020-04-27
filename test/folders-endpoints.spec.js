const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray, makeMaliciousFolder } = require('./folder-fixtures')

describe('Folders Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db.raw('TRUNCATE  noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))
    afterEach('cleanup', () => db.raw('TRUNCATE  noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))

    /* describe(`Unauthorized requests`, () => {
        const testFolders = makeFoldersArray();

        beforeEach('insert folder', () => {
            return db
                .into('noteful_folders')
                .insert(testFolders);
        });

        it(`responds with 401 Unauthorized for GET /api/folders`, () => {
            return supertest(app)
                .get('/api/folders')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/folders/:folder_id`, () => {
            const oneFolder = testFolders[1];
            return supertest(app)
                .get(`/api/folders/${oneFolder.id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/folders`, () => {
            return supertest(app)
                .post('/api/folders')
                .send({
                    name: 'test folder name'
                })
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/folders/:folder_id`, () => {
            const oneFolder = testFolders[1];
            return supertest(app)
                .delete(`/api/folders/${oneFolder.id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    }); */

    describe(`GET /api/folders`, () => {
        context(`Given no folders`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray();

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 200 and all of the note', () => {
                return supertest(app)
                    .get('/api/folders')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testFolders)
            });
        });

        context(`Given an XSS attack folder name`, () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

            beforeEach('insert malicious folder name', () => {
                return db
                    .into('noteful_folders')
                    .insert([maliciousFolder]);
            });

            it('removes XSS attack folder name', () => {
                return supertest(app)
                    .get(`/api/folders`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedFolder.name);
                    }); 
            });
        });
    });

    describe(`GET /api/folders/:folder_id`, () => {
        context(`Given no folder`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456;
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } });
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray();

            beforeEach('insert folder', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders);
            });

            it('responds with 200 and the specified folder', () => {
                const folderId = 2;
                const expectedFolder = testFolders[folderId - 1];
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedFolder);
            });
        });

        context(`Given an XSS attack folder`, () => {
            const testFolders = makeFoldersArray();
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

            beforeEach('insert malicious folder', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert([maliciousFolder]);
                    });
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folders/${maliciousFolder.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedFolder.name);
                    });
            });
        });
    });

    describe(`POST /api/folders`, () => {
        const testFolders = makeFoldersArray();

        beforeEach('insert folders', () => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        })

        /* it(`creates a folder, responding with 201 and the new folder`, () => {
            const newFolder = {
                title: 'test 23'
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newFolder.title)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/folders/${res.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(res.body)
                );
        }); */

        const requiredFields = ['title'];

        requiredFields.forEach(field => {
            const newFolder = {
                title: 'Test Folder',
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newFolder[field]

                return supertest(app)
                    .post('/api/folders')
                    .send(newFolder)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })

        /* it('removes XSS attack content from response', () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
            return supertest(app)
                .post(`/api/folders`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send([maliciousFolder])
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedFolder.title)
                });
        }); */
    });

    describe(`DELETE /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 204 and removes the folder', () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedFolders)
                    );
            });
        });
    });

    describe(`PATCH /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456;
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 204 and updates the note', () => {
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
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedFolder)
                    );
            });

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2;
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: {
                            message: `Request body must contain a 'title'`
                        }
                    });
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2;
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
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedFolder)
                    );
            });
        });
    });
});