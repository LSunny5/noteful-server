const NotesService = {
    getAllNotes(knex) {
      return knex.select('*').from('noteful_notes')
    },
    getById(knex, id) {
      return knex.from('noteful_notes').select('*').where('id', id).first()
    },
    insertBookmark(knex, newNote) {
      return knex
        .insert(newNote)
        .into('noteful_notes')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
    deleteBookmark(knex, id) {
      return knex('noteful_notes')
        .where({ id })
        .delete()
    },
    updateBookmark(knex, id, newNoteFields) {
      return knex('noteful_notes')
        .where({ id })
        .update(newNoteFields)
    },
  }
  
  module.exports = NotesService