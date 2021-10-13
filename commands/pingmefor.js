const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'pingmefor',
	description: 'Registers the user to be pinged for the raid given.',
    aliases: ['subscribe', 'sub'],
	usage: '[command name] [raid name or alias]',
	async execute(message, args) {
        const userId = message.member.id;
        var argsDict = utils.parseArgs(args);
        var parsedArgs = utils.parseQuotedArgs(argsDict[0]);

        var returnString = `Success. You have been added to the lists for the following raids: `;
        var alreadyAdded = ``;
        for (var a in parsedArgs) {
            var toPingFor = parsedArgs[a];

            // Check if this is an alias for a raid.
            var alias = await Aliases.findOne({ where: { alias: toPingFor } });
            if (alias) {
                toPingFor = alias.get('name');
            }

            // Once we have the proper name, prettify it for output purposes
            var prettyPing = utils.capitalizeFirstLetter(toPingFor);

            // Check if this is a raid name (rather than category or element).
            var raid = await Raids.findOne({ where: { name: toPingFor } });
            if (raid) {
                var userList = raid.get('users');
                if (userList.includes(userId)) {
                    alreadyAdded += `${prettyPing}, `;
                } else {
                    userList += userId;
                    userList += ',';
                    await Raids.update({ users: userList }, { where: { name: toPingFor } });
                    returnString += `${prettyPing}, `;
                }
            } else {
                // If we didn't get a raid name, see if we got a category (or element) name.
                const categoryRaids = await Raids.findAll({ where: { category: toPingFor } });
                const elementRaids = await Raids.findAll({ where: { element: toPingFor } });
                var myRaidList = (categoryRaids.length) ? categoryRaids : elementRaids;
                if (myRaidList.length) {
                    try {
                        var raidString = myRaidList.map(t => t.name).join(', ') || 'None';
                        raidString = utils.capitalizeFirstLetter(raidString);
                        for (var i in myRaidList) {
                            var raidName = myRaidList[i].get('name');
                            raid = await Raids.findOne({ where: { name: raidName } });
                            var userList = raid.get('users');
                            if (!userList.includes(userId)) {
                                userList += userId;
                                userList += ','; // Commas delimit the user list. Trailing comma is expected within the program.
                                await Raids.update({ users: userList }, { where: { name: raidName } });
                            } else {
                                //console.log(`User ${userId} was already on ping list for raid ${raidName}.`);
                                alreadyAdded += utils.capitalizeFirstLetter(raidName);
                                alreadyAdded += `, `;
                            }
                        }
                        returnString += `${prettyPing} raids (${raidString}), `;
                    } catch (error) {
                        console.error(error);
                        return message.channel.send(`I'm sorry, something went wrong when updating the database.`);
                    }
                } else {
                    message.channel.send(`I'm sorry, I couldn't find ${prettyPing} at all... (maybe you need to add this alias to my database?)`);
                }
            }
        }
        returnString = returnString.slice(0, -2) + `.`; // Output cleanup (trailing comma+space)
        if (alreadyAdded) { // If we found any the user was already on, let them know for posterity's sake.
            alreadyAdded = alreadyAdded.slice(0, -2) + `.`;
            returnString += `\nYou were already on the lists for the following: `;
            returnString += alreadyAdded;
        }

        return message.channel.send(returnString);
    },
};