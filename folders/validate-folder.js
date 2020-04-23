const logger = require('../logger');

//check title posted is greater than 3 characters and 
function getFolderValidationError({ name }) {
	if (name.length < 3) {
		logger.error(`Invalid title '${title}' given`);
		return {
			error: {
				message: `'Title' must be more than 3 characters.`
			}
		};
    }
    if (name.length > 50) {
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