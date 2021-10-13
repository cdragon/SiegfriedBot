const { Raids, Aliases } = require ('../dbObjects');
const utils = require('../utils');

module.exports = {
	name: 'deletealias',
	description: 'Deletes an alias from the database.',
    aliases: ['unalias'],
	usage: '[command name] [alias]',
    async execute(message, args) {
        var argsDict = utils.parseArgs(args);
        var toDelete = argsDict[0].join(" ");

        if (!toDelete) {
            return message.channel.send('Sorry, I need to know what alias you want me to delete.');
        }

        try {
            const raid = await Aliases.findOne({ where: { alias: toDelete } });
            if (raid) {
                await Aliases.destroy({ where: { alias: toDelete } });
            } else {
                return message.channel.send('That raid didn\'t exist.');
            }
            return message.channel.send(`Alias ${toDelete} have been deleted from the database.`);
        } catch (error) {
            console.error(error);
            return message.channel.send('Sorry, something went wrong when trying to delete that alias.');
        }
    },
};