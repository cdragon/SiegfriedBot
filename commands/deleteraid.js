const { Raids, Aliases } = require ('../dbObjects');
const utils = require('../utils');

module.exports = {
	name: 'deleteraid',
	description: 'Deletes a raid and all its aliases from the database.',
    aliases: ['delete'],
	usage: '[command name] [raid name]',
    async execute(message, args) {
        var argsDict = utils.parseArgs(args);
        var raidName = argsDict[0].join(" ");

        if (!raidName) {
            return message.channel.send('Sorry, I need to know what raid you want me to delete.');
        }

        try {
            const raid = await Raids.findOne({ where: { name: raidName } });
            if (raid) {
                await Raids.destroy({ where: { name: raidName } });
                
                var aliases = await Aliases.findAll({ where: { name: raidName } });
                var aliasString = "";
                for (var a in aliases) {
                    aliasString += aliases[a].get('alias');
                    aliasString += " "
                    await Aliases.destroy({ where: { alias: aliases[a].get('alias') } });
                }
            } else {
                return message.channel.send('That raid didn\'t exist.');
            }
            return message.channel.send(`Raid ${raidName} and all of its aliases (${aliasString}) have been deleted from the database.`);
        } catch (error) {
            console.error(error);
            return message.channel.send('Sorry, something went wrong when trying to delete that raid.');
        }
    },
};