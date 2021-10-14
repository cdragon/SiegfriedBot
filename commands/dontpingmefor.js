const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');
const SubUnsub = require('../subunsub');

module.exports = {
	name: 'dontpingmefor',
	description: 'Removes the user from the ping list for a given raid. Accepts multiple raid names/aliases (and/or categories) at a time.',
    aliases: ['unsubscribe', 'unsub', 'dongpingmefor'],
	usage: '[command name] [raid name or alias, or category, or "all" to remove yourself from all ping lists]',
    async execute(message, args) {
        var argsDict = utils.parseArgs(args);
        var parsedArgs = utils.parseQuotedArgs(argsDict[0]);

        // 'all' is a special argument for unsub; check for it before routing to the main function body.
        if (parsedArgs[0] === 'all') {
            try {
                const allRaids = await Raids.findAll();
                for (var r in allRaids) {
                    var userList = allRaids[r].get('users');
                    if (userList.includes(userId)) {
                        await SubUnsub.unsub(allRaids[r].get('name'), userId, userList);
                    }
                }
                // Return after this, because there's just no point continuing.
                return message.channel.send(`Success. You have been removed from every ping list I found you in.`);
            } catch (error) {
                console.error(error);
                return message.channel.send(`Sorry, something went wrong when updating the database.`);
            }
        }

        // Route to helper function ("false" tells us that we are unsubscribing)
        SubUnsub.subunsub(message, args, false);
        return;
    },
};