const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'dontping',
	description: 'Provide a user ID to no longer ping for any raids. WARNING: this command can only be executed by an admin!',
    aliases: ['forceunsub', 'removeuser', 'dontpinguser'],
	usage: '[command name] [user ID to unsub]',
	async execute(message, args) {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.channel.send(`I'm sorry, this command can only be carried out by a administrator.`);
        } else {
            const userId = args.shift();
            if (isNaN(userId)) {
                return message.channel.send(`Sorry, you didn't give me a user ID to remove from the ping lists.`);
            }

            const allRaids = await Raids.findAll();
            if (!allRaids.length) {
                return message.channel.send(`It doesn't appear that the user ${userId} is present in any of my ping lists.`);
            }
            try {
                for (var r in allRaids) {
                    var userList = allRaids[r].get('users');
                    if (userList.includes(userId)) {
                        var list = userList.split(userId + ',');
                        var ul = list.join();
                        var n = allRaids[r].get('name');
                        await Raids.update({ users: ul }, { where: { name: n } });
                    }
                }
                return message.channel.send(`Success. The user you provided, <@${userId}>, was removed from all of the ping lists.`);
            } catch (error) {
                console.error(error);
                return message.channel.send(`Sorry, something went wrong when updating the database.`);
            }
        }
    },
};