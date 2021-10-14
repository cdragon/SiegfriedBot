const { Raids, Aliases } = require ('../dbObjects');
const utils = require('../utils');

module.exports = {
	name: 'checkmypings',
	description: 'Returns a list of all the pings this user is signed up to get.',
    aliases: ['checkpings', 'viewpings'],
	usage: '[command name]',
    async execute(message, args) {
        const userId = message.member.id;
        var returnString = `Here are all the raids I will ping <@${userId}> for: `;

        try {
            const allRaids = await Raids.findAll();
            for (var r in allRaids) {
                var userList = allRaids[r].get('users');
                if (userList.includes(userId)) {
                    returnString += utils.capitalizeFirstLetter(allRaids[r].get('name')) + ', ';
                }
            }
        } catch (error) {
            console.error(error);
            return message.channel.send(`Sorry, something went wrong when reading the database.`);
        }

        returnString = returnString.slice(0, -2) + `.`; // Output cleanup (trailing comma+space)
        return message.channel.send(returnString);
    },
}