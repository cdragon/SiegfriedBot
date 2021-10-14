const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');
const SubUnsub = require('../subunsub');

module.exports = {
	name: 'pingmefor',
	description: 'Registers the user to be pinged for the raid given.. Accepts multiple raid names/aliases/categories at a time.',
    aliases: ['subscribe', 'sub'],
	usage: '[command name] [raid name or alias]',
	async execute(message, args) {
        // Route to helper function ("true" tells us that we are subscribing)
        SubUnsub.subunsub(message, args, true);
        return;
    },
};