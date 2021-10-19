const utils = require('../utils');
const { Raids, Aliases } = require ('../dbObjects');

module.exports = {
	name: 'pingfor',
	description: 'Pings all users subscribed to a given raid list.',
    aliases: ['pingraid'],
	usage: '[command name] [raid name or alias] [raid code: optional]',
    async execute(message, args) {
        // This argument parsing is a little different, and also kinda ugly, but this whole command is a little weird...
        /*var toPingFor = args.shift()
        if (toPingFor) {
            toPingFor = toPingFor.toLowerCase();
        } else {
            return message.channel.send(`Sorry, I need to know what raid to ping for!`); 
        }*/
        var toPingFor = '';
        var code = ``;
        var alias, raid;

        if (args.length <= 0) { // 0 length args is an error
            return message.channel.send(`Sorry, I need to know what raid to ping for!`); 
        }

        // No point doing all this if we only got one arg.
        if (args.length > 1) {
            // Try checking to see if there's a raid code anywhere.
            var codeindex = args.length;
            for (let i in args) {
                var re = /[0-9A-Fa-f]{6,8}/g; // Test for if a value is valid 6-digit hexadecimal (a raid code)
                if (re.test(args[i])) {
                    codeindex = i;
                }
            }
            if (codeindex < args.length) code = args[codeindex];
            // If we found a raid code, check args from the command to the code; if we didn't, just check the whole thing.
            var argsTrimmed = args.slice(0, codeindex);
            var testping = argsTrimmed.join(' ').toLowerCase();
            alias = await Aliases.findOne({ where: { alias: testping } });
            raid = await Raids.findOne({ where: { name: testping } });
            if (alias) toPingFor = alias.get('name');
            else if (raid) toPingFor = raid.get('name');
        }

        // If the above check didn't find anything, or we only have one arg, let's try parsing from the first argument.
        if (!toPingFor) {
            toPingFor = args.shift();
            // Find the proper name for this raid if we were given an alias.
            alias = await Aliases.findOne({ where: { alias: toPingFor } });
            if (alias) toPingFor = alias.get('name');
        }

        // Make sure we have a raid to ping for.
        if (!raid) raid = await Raids.findOne({ where: { name: toPingFor } }); // No need to check again if we found it already.
        if (!raid) { // If we didn't find the raid, check if maybe we got a multi-part raid name (in a weird message) before we give up.
            while (typeof (i = args.shift()) !== 'undefined') { // Check for as many args as we have, until we find a raid.
                // not a raid code; try appending
                toPingFor += ' ';
                toPingFor += i.toLowerCase();
                raid = await Raids.findOne({ where: { name: toPingFor } });
                if (raid) { // if we found the raid, go on and break out of the loop
                    if (!code) code = args.shift(); // Guess that maybe the next argument is the raid code instead.
                    break;
                }
            }
        } else {
            if (!code) code = args.shift();
        }

        // Assuming we found the raid, send out the ping.
        if (raid) {
            var userList = raid.get('users');
            if (!userList) {
                return message.channel.send(`Sorry, there's no one currently on the ping list for ${toPingFor}. (If you need HELP, try pinging for "help"!)`);
            }
            userList = userList.slice(0, -1); // remove trailing comma

            var ids = userList.split(',');
            var id = ids.shift();
            var mentionString = mentionString = '<@' + id + '>';
            var fixIds = false;
            var fixIdString = '';
            if (!id) {
                fixIds = true;
                mentionString = "";
            }

            // Do some automatic clean-up if we run into stray commas...
            for (var i in ids) {
                if (ids[i]) {
                    mentionString += ' | <@' + ids[i] + '>';
                    fixIdString += ids[i] + ',';
                } else {
                    fixIds = true;
                }
            }
            if (fixIds) { // flag is set if we hit a blank in the user list, so that we can fix that on the fly
                try {
                    await Raids.update({ users: fixIdString }, { where: { name: toPingFor } });
                } catch (error) {
                    console.error(error);
                }
            }

            toPingFor = utils.capitalizeFirstLetter(toPingFor); // prettify raid name
            message.channel.send(`Pinging for ${toPingFor}: ${mentionString}`);

            // If we got a raid code, let's send that in a separate message.
            if (code) {
                var re = /[0-9A-Fa-f]{6,8}/g; // Test for if a value is valid 6-digit hexadecimal (a raid code)
                if (re.test(code)) {
                    message.channel.send(`${code.toUpperCase()}`); // If it's a raid code, send it in a separate message after for mobile users.
                } 
            } else {
                // Just in case, check if the code is at the end of the message for some reason.
                code = args[args.length-1];
                var re = /[0-9A-Fa-f]{6,8}/g; // Test for if a value is valid 6-digit hexadecimal (a raid code)
                if (code) {
                    if (re.test(code)) {
                        message.channel.send(`${code.toUpperCase()}`); // If it's a raid code, send it in a separate message after for mobile users.
                    }
                }
            }

            return;
        }
        return message.channel.send(`I'm sorry, I don't know what raid that is yet. (Maybe you need to add this alias to my database?)`);
    },
};