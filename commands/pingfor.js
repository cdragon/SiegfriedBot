const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'pingfor',
	description: 'Pings all users subscribed to a given raid list.',
    aliases: ['pingraid'],
	usage: '[command name] [raid name or alias] [raid code: optional]',
    async execute(message, args) {
        var toPingFor = args.shift();
        var secondArg = args.shift();
        var code = secondArg;

        // Find the proper name for this raid if we were given an alias.
        var alias = await Aliases.findOne({ where: { alias: toPingFor } });
        if (alias) {
            toPingFor = alias.get('name');
        }

        // Send out the ping.
        var raid = await Raids.findOne({ where: { name: toPingFor } });
        if (!raid && secondArg) { // Check if maybe it's a two-part raid name, before we give up.
            toPingFor += " ";
            toPingFor += secondArg;
            raid = await Raids.findOne({ where: { name: toPingFor } });
            code = args.shift(); // Guess that maybe the next argument is the raid code instead.
        }
        if (raid) {
            var userList = raid.get('users');
            if (!userList) {
                return message.channel.send(`Sorry, there's no one currently on the ping list for ${toPingFor}. (If you need HELP, try pinging for "help"!)`);
            }
            //console.log(`userlist is: ${userList}`);
            userList = userList.slice(0, -1); // remove trailing comma
            var ids = userList.split(',');
            var mentionString = "<@" + ids.shift() + ">";
            for (var i in ids) {
                mentionString += " | <@";
                mentionString += ids[i];
                mentionString += ">";
            }
            toPingFor = utils.capitalizeFirstLetter(toPingFor); // prettify raid name
            message.channel.send(`Pinging for ${toPingFor}: ${mentionString}`);
            if (code) {
                var re = /[0-9A-Fa-f]{6}/g; // Test if this is valid hexadecimal (a raid code)
                if (re.test(code)) {
                    message.channel.send(`${code}`); // If it's a raid code, send it in a separate message after for mobile users.
                }
            }
            return;
        }
        return message.channel.send(`I'm sorry, I don't know what raid that is yet. (Maybe you need to add this alias to my database?)`);
    },
};