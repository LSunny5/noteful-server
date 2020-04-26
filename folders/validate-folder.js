const logger = require('../src/logger');

//check title posted is greater than 3 characters and 
function getFolderValidationError({ title }) {
	if (title.length < 3) {
		logger.error(`Invalid title '${title}' given`);
		return {
			error: {
				message: `'Title' must be more than 3 characters.`
			}
		};
    }
    if (title.length > 100) {
		logger.error(`Invalid title '${title}' given`);
		return {
			error: {
				message: `'Title' must be less than 50 characters.`
			}
		};
	}
}

module.exports = {
	getFolderValidationError
};