//fake data for testing folders
function makeFoldersArray() {
    return [
        {
            id: 1,
            title: 'Folder 1',
        },
        {
            id: 2,
            title: 'Folder 2',
        },
        {
            id: 3,
            title: 'Folder 3',
        },
    ];
}

//make malicious folder
function makeMaliciousFolder() {
    const maliciousFolder = {
        id: 123,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    }
    const expectedFolder = {
        ...maliciousFolder,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
        maliciousFolder,
        expectedFolder,
    }
}

//export all the functions to be used in noteful endpoints spec
module.exports = {
    makeFoldersArray,
    makeMaliciousFolder
}