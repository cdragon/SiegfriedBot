const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'updateraid',
	description: 'Update a raid in the database.',
    aliases: ['addraid', 'editraid', 'updateraids'],
	usage: '[command name] [raid name] -a [aliases: optional, any number separated by spaces] -c [category: optional] -e [element: optional]',
	async execute(message, args) {
        var raidName = "";
        var raidCategory = "";
        var raidAliases = [];
        var raidElement = "";

        // Return string info
        var returnUpdated = "updated";
        var returnAliases = ``;

        // Parse arguments given.
        var argsDict = utils.parseArgs(args);
        for (var key in argsDict) {
            switch (key) {
                case '0': // raid name
                    raidName = argsDict[key].join(" ");
                    break;
                case 'a': // aliases
                    // Load the arguments parsed as our raid aliases.
                    raidAliases = utils.parseQuotedArgs(argsDict[key]);
                    break;
                case 'c': // category
                    raidCategory = argsDict[key].join(" ");
                    break;
                case 'e': // element
                    raidElement = argsDict[key].join(" ");
                    break;
                default: // invalid argument
                    return message.channel.send(`Sorry, I didn't understand that argument.\n`+
                        `Usage is: [raid name] -a [aliases: optional, space-separated unless wrapped in \"double quotes\"] -c [category: optional] -e [element: optional]`);
            }
        }

        if (!raidName) {
            return message.channel.send('Sorry, I need to know what raid you want me to add or edit.\n'+
                        'Usage is: [raid name] -a [aliases: optional, space-separated unless wrapped in \"double quotes\"] -c [category: optional] -e [element: optional]');
        }

        try {
            const raid = await Raids.findOne({ where: { name: raidName } });
            if (raid) {
                //console.log('Raid already exists; updating category and element instead...');
                if (raidElement) {
                    if (raidElement === 'remove') {
                        await Raids.update({ element: null }, { where: { name: raidName } });
                    } else {
                        await Raids.update({ element: raidElement }, { where: { name: raidName } });
                    }
                }
                if (raidCategory) {
                    if (raidCategory === 'remove') {
                        await Raids.update({ category: null }, { where: { name: raidName } });
                    } else {
                        await Raids.update({ category: raidCategory }, { where: { name: raidName } });
                    }
                }
            } else {
                //console.log('Adding new raid to the database...');
                returnUpdated = "added to the database";
                await Raids.create({
                    name: raidName, // primary key
                    category: raidCategory,
                    element: raidElement,
                    users: "", // Start with a blank list of users.
                });
            }

            const aliasCount = raidAliases.length;
            while (typeof (i = raidAliases.shift()) !== 'undefined') { // Add one entry to "Alias" DB for each alias given
                await Aliases.create({
                    name: raidName, // foreign key into raids db
                    alias: i,
                });
                returnAliases += i + `, `;
            }

            if (!aliasCount) returnAliases = `none`;
            else returnAliases = returnAliases.slice(0, -2);

            return message.channel.send(`Raid "${raidName}" has been ${returnUpdated} with ${aliasCount} aliases: ${returnAliases}.`);
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return message.channel.send('Error: that alias already exists in the database. All aliases must be unique.');
            }
            return message.channel.send('Sorry, something went wrong while updating the database.');
        }
    },
};