const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'dontpingmefor',
	description: 'Removes the user from the ping list for a given raid.',
    aliases: ['unsubscribe', 'unsub', 'dongpingmefor'],
	usage: '[command name] [raid name or alias, or "all" to remove yourself from all ping lists]',
    async execute(message, args) {
        const userId = message.member.id;
        var argsDict = utils.parseArgs(args);
        var parsedArgs = utils.parseQuotedArgs(argsDict[0]);

        var returnString = `Success. You will not be pinged for the following raids: `;
        for (var a in parsedArgs) {
            var toPingFor = parsedArgs[a];

            // Check for special command "all".
            if (toPingFor === "all") {
                const allRaids = await Raids.findAll();
                for (var r in allRaids) {
                    var userList = allRaids[r].get('users');
                    if (userList.includes(userId)) {
                        var list = userList.split(userId + ',');
                        var ul = list.join();
                        var n = allRaids[r].get('name');
                        await Raids.update({ users: ul }, { where: { name: n } });
                    }
                }
                // Return after this, because there's just no point continuing.
                return message.channel.send(`Success. You have been removed from every ping list I found you in.`);
            }

            // Check if this is an alias for a raid.
            var alias = await Aliases.findOne({ where: { alias: toPingFor } });
            if (alias) {
                toPingFor = alias.get('name');
            }

            // Prettify for output purposes
            var prettyPing = utils.capitalizeFirstLetter(toPingFor);

            // Check if this is a raid name (rather than category or element).
            var raid = await Raids.findOne({ where: { name: toPingFor } });
            if (raid) {
                var userList = raid.get('users');
                if (userList.includes(userId)) {
                    var list = userList.split(userId + ',');
                    var ul = list.filter(Boolean).join(); // Filter removes potential empty strings from the join to prevent stray commas from appearing.
                    await Raids.update({ users: ul }, { where: { name: toPingFor } });
                    returnString += `${prettyPing}, `;
                }
                //return message.channel.send(`Good news! You weren't in the ping list for ${toPingFor} already, so I couldn't remove you from it.`);
            } else {
                // If we didn't get a raid name, see if we got a category (or element category) name.
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
                            if (userList.includes(userId)) {
                                var list = userList.split(userId + ',');
                                var ul = list.join();
                                await Raids.update({ users: ul }, { where: { name: raidName } });
                            } else {
                                console.log(`User ${userId} was already not on the ping list for ${raidName}`);
                            }
                        }
                        returnString += `${prettyPing} raids (${raidString}), `;
                    } catch (error) {
                        console.error(error);
                        return message.channel.send(`I'm sorry, something went wrong when updating the database.`);
                    }
                } else {
                    message.channel.send(`I'm sorry, I couldn't find ${prettyPing} at all...  (maybe you need to add this alias to my database?)`);
                }
            }
        }
        returnString = returnString.slice(0, -2) + `.`; // Output cleanup (trailing comma+space)
        return message.channel.send(returnString);
    },
};