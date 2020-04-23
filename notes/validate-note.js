const logger = require('../logger');

function getNoteValidationError({ title, content }) {
	if (title && title.length < 3) {
		logger.error(`Invalid title '${title}' given`);
		return {
			error: {
				message: `'title' must be at least 3 characters long`
			}
		};
	}

	if (!content) {
		logger.error(`Invalid content '${content}' given`);
		return {
			error: {
				message: `'content' is required`
			}
		};
	}
}

module.exports = {
	getNoteValidationError
};