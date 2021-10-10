const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');
const { Channel } = require('discord.js');

function constructReturnString(name, aliases, category, element) {
    var prettyName = utils.capitalizeFirstLetter(name);
    var returnString = `**${prettyName}: **`;
    if (category) {
        returnString += ` Category: ${category}.`;
    }
    if (element) {
        returnString += ` Element: ${element}.`;
    }
    returnString += ` Aliases: ${aliases}.`;
    return returnString;
}

module.exports = {
	name: 'viewraids',
	description: 'Gets all the raids and all of their aliases for user reference.',
    aliases: ['listaliases', 'viewraid', 'viewaliases', 'showaliases'],
	usage: '[command name] [raid name or alias: optional]',
    async execute(message, args) {
        var raidName = args.shift();
        var raids = [];

        // If we were given an argument, display only that raid's info...
        if (raidName) {
            // Find the proper name for this raid if we were given an alias.
            const alias = await Aliases.findOne({ where: { alias: raidName } });
            if (alias) {
                raidName = alias.get('name');
            }
            // Get raid information
            const raid = await Raids.findOne({ where: { name: raidName } });
            // Put only this value into the "raids" array
            raids.push(raid);
        } else { // Otherwise, find all raids in the table.
            raids = await Raids.findAll();
        }

        // If not given an argument, find all raids and display all aliases.
        var returnString = '';
        for (var r in raids) {
            var name = raids[r].get('name');
            var category = raids[r].get('category');
            var element = raids[r].get('element');

            var aliases = await Aliases.findAll({ attributes: ['alias'], where: { name: name } });
            var aliasString = aliases.map(t => t.alias).join(', ') || 'No aliases found..';

            returnString += constructReturnString(name, aliasString, category, element);
            returnString += '\n';
        }

        return message.channel.send(returnString);
    },
};