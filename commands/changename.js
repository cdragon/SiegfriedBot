const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'changename',
	description: 'Change the name of a raid.',
    aliases: ['changeraidname'],
	usage: '[command name] [old raid name] -n [new raid name]',
	async execute(message, args) {
        var oldRaidName = "";
        var newRaidName = "";

        var argsDict = utils.parseArgs(args);
        for (var key in argsDict) {
            switch (key) {
                case '0': // raid name
                    oldRaidName = argsDict[key].join(" ");
                    break;
                case 'n': // new name
                    newRaidName = argsDict[key].join(" ");
                    break;
                default:
                    return message.channel.send(`Sorry, I didn't understand that argument.`);
            }
        }

        if (!oldRaidName || !newRaidName) {
            return message.channel.send(`Sorry, I need you to type -n before the new raid name so I can understand how to divide them.`);
        }

        try {
            const raid = await Raids.findOne({ where: { name: oldRaidName } });
            if (raid) {
                await Raids.update({ name: newRaidName }, { where: { name: oldRaidName } });
                var aliased = await Aliases.findAll({ where: { name: oldRaidName } });
                for (var a in aliased) {
                    await Aliases.update({ name: newRaidName }, { where: { alias: aliased[a].get('alias') } });
                }
                return message.channel.send(`Successfully changed name of raid ${oldRaidName} to ${newRaidName}.`);
            } else {
                return message.channel.send(`Sorry, I couldn't find that raid to change its name.`);
            }
        } catch (error) {
            console.error(error);
            return message.channel.send(`Sorry, something went wrong while updating the database.`);
        }
    },
};