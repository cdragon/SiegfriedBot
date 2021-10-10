const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'dontpingmefor',
	description: 'Removes the user from the ping list for a given raid.',
    aliases: ['unsubscribe', 'unsub'],
	usage: '[command name] [raid name or alias]',
    async execute(message, args) {
        const userId = message.member.id;
        var toPingFor = args.shift();

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
            return message.channel.send(`Success. You have been removed from every ping list I found you in.`);
        }

        // Check if this is an alias for a raid.
        var alias = await Aliases.findOne({ where: { alias: toPingFor } });
        if (alias) {
            toPingFor = alias.get('name');
        }

        // Check if this is a raid name (rather than category or element).
        var raid = await Raids.findOne({ where: { name: toPingFor } });
        if (raid) {
            var userList = raid.get('users');
            if (userList.includes(userId)) {
                var list = userList.split(userId + ',');
                var ul = list.join();
                await Raids.update({ users: ul }, { where: { name: toPingFor } });
                return message.channel.send(`Success. You have been removed from the ping list for ${toPingFor}.`);
            }
            return message.channel.send(`Good news! You weren't in the ping list for ${toPingFor} already, so I couldn't remove you from it.`);
        }

        // If we didn't get a raid name, see if we got a category (or element category) name.
        const categoryRaids = await Raids.findAll({ where: { category: toPingFor } });
        const elementRaids = await Raids.findAll({ where: { element: toPingFor } });
        var myRaidList = (categoryRaids.length) ? categoryRaids : elementRaids;
        if (myRaidList.length) {
            try {
                var raidString = myRaidList.map(t => t.name).join(', ') || 'None';
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
                return message.channel.send(`Success. You will no longer be pinged for the following ${toPingFor} raids: ${raidString}.`);
            } catch (error) {
                console.error(error);
                return message.channel.send(`I'm sorry, something went wrong when updating the database.`);
            }
        }

        return message.channel.send(`I'm sorry, I couldn't find that raid, raid category, or element...  (maybe you need to add this alias to my database?)`);
    },
};