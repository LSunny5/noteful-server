//fake data for testing notes
function makeNotesArray() {
    return [
        {
            id: 1,
            title: 'Note 1',
            content: 'Lorem ipsum filler 1', 
            modified: '2004-03-03 03:30:02',
            folder_id: 1, 
        },
        {
            id: 2,
            title: 'Note 2',
            content: 'Lorem ipsum filler 2', 
            modified: '2004-04-03 03:30:02',
            folder_id: 1,
        },
        {
            id: 3,
            title: 'Note 3',
            content: 'Lorem ipsum filler 3', 
            modified: '2004-05-03 03:30:02',
            folder_id: 2,
        },
        {
            id: 4,
            title: 'Note 4',
            content: 'Lorem ipsum filler 4', 
            modified: '2004-06-03 03:30:02',
            folder_id: 2,
        },
        {
            id: 5,
            title: 'Note 5',
            content: 'Lorem ipsum filler 5', 
            modified: '2004-07-03 03:30:02',
            folder_id: 3,
        },
        {
            id: 6,
            title: 'Note 6',
            content: 'Lorem ipsum filler 6', 
            modified: '2004-08-03 03:30:02',
            folder_id: 3,
        },
    ];
}

//make malicious note
function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`, 
        modified: new Date().toISOString(),
        folder_id: 101, 
    }
    const expectedNote = {
        ...maliciousNote,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousNote,
        expectedNote,
    }
}

//export all the functions to be used in noteful endpoints spec
module.exports = {
    makeNotesArray,
    makeMaliciousNote
}