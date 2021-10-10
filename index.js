const Sequelize = require('sequelize');
const { Client, Intents } = require('discord.js');
const { prefix, token } = require('./config.json');

/* Parses arbitrary arguments with option flags into arrays of strings, indexed by the option flag letter. */
function parseArgs(args) {
    var dict = {};
    var index = 0;
    dict[index] = [];
    while (typeof (i = args.shift()) !== 'undefined') {
        /* Option flag */
        if (i.charAt(0) === '-') {
            index = i.charAt(1);
            dict[index] = [];
        } else {
            dict[index].push(i);
        }
    }
    return dict;
}

function capitalizeFirstLetter(string) {
    var strList = string.split(' ');
    var returnString = strList[0].charAt(0).toUpperCase() + strList[0].slice(1);
    strList.shift(); // shift first element
    for (var i in strList) { // If there are more words, also capitalize them.
        returnString += ' ';
        returnString += strList[i].charAt(0).toUpperCase();
        returnString += strList[i].slice(1);
    }
    return returnString;
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

/* Set up database. */
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

/* Model for database of raid aliases. This is used as an intermediary database to
    quickly look up raid names from their aliases when called for a ping. */
const Aliases = sequelize.define('raids', {
    name: Sequelize.STRING,
    alias: { 
        type: Sequelize.STRING,
        unique: true,
    },
});

/* Model for database of raid ping lists, tracked by raid full name, with categories if applicable.
    Raids are added to this list with blank lists of users when a new one is added to the above database.
*/
const Raids = sequelize.define('raidpings', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
    category: Sequelize.STRING,
    element: Sequelize.STRING,
	users: Sequelize.TEXT,
});

client.once('ready', () => {
    Raids.sync();
    Aliases.sync();
    console.log('Ready!');
});

client.on('messageCreate', async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	var args = message.content.slice(prefix.length).trim().split(' ');
	var command = args.shift().toLowerCase();

	if (command === 'addraid' || command === 'updateraid') { // Add a new raid to the table, OR update an existing raid.
		var raidName = "";
        var raidCategory = "";
        var raidAliases = [];
        var raidElement = "";

        var argsDict = parseArgs(args);
        for (var key in argsDict) {
            switch (key) {
                case '0': // raid name
                    raidName = argsDict[key].join(" ");
                    break;
                case 'a': // aliases
                    // Load the arguments parsed as our raid aliases.
                    raidAliases = argsDict[key];
                    break;
                case 'c': // category
                    raidCategory = argsDict[key].join(" ");
                    break;
                case 'e': // element
                    raidElement = argsDict[key].join(" ");
                    break;
                default:
                    return message.channel.send(`Sorry, I didn't understand that argument.`);
            }
        }

        if (!raidName) {
            return message.channel.send('Sorry, I need to know what raid you want me to add or edit.');
        }

        try {
            const raid = await Raids.findOne({ where: { name: raidName } });
            if (raid) {
                console.log('Raid already exists; updating category and element instead...');
                if (raidElement) {
                    await Raids.update({ element: raidElement }, { where: { name: raidName } });
                }
                if (raidCategory) {
                    await Raids.update({ category: raidCategory }, { where: { name: raidName } });
                }
            } else {
                console.log('Adding new raid to the database...');
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
            }
            return message.channel.send(`Raid ${raidName} has been registered or updated with ${aliasCount} aliases.`);
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return message.channel.send('That alias already exists in the database.');
            }
            return message.channel.send('Sorry, something went wrong while updating the database.');
        }
	} else if (command === 'addraidalias') { // Add another alias (or multiple) to an existing raid.
		var raidName = "";
        var raidAliases = [];

        var argsDict = parseArgs(args);
        for (var key in argsDict) {
            switch (key) {
                case '0':
                    raidName = argsDict[key].join(" ");
                    break;
                case 'a':
                    raidAliases = argsDict[key];
                    break;
                default:
                    return message.channel.send('Sorry, I didn\'t understand that argument.');
            }
        }

        if (!raidName || raidAliases.length === 0) {
            return message.channel.send('Sorry, there seems to have been a problem with your arguments.');
        }

        try {
            const aliasCount = raidAliases.length;
            while (typeof (i = raidAliases.shift()) !== 'undefined') { // Add one entry to "Alias" DB for each alias given
                await Aliases.create({
                    name: raidName, // foreign key into raids db
                    alias: i,
                });
            }
            return message.channel.send(`I've added ${aliasCount} new aliases to ${raidName}.`);
        } catch (error) {
            return message.channel.send('Sorry, I wasn\'t able to add the aliases you gave me for some reason.');
        }
	} else if (command === 'pingmefor') { // Provide a category or raid alias to ping this user for.
		const userId = message.member.id;
        var toPingFor = args.shift();

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
                return message.channel.send(`You're already in that ping list!`);
            }
            userList += userId;
            userList += ',';
            await Raids.update({ users: userList }, { where: { name: toPingFor } });
            return message.channel.send(`Success. You will now be pinged for ${raid.get('name')}.`);
        }

        // If we didn't get a raid name, see if we got a category (or element category) name.
        const categoryRaids = await Raids.findAll({ where: { category: toPingFor } });
        const elementRaids = await Raids.findAll({ where: { element: toPingFor } });
        var myRaidList = (categoryRaids.length) ? categoryRaids : elementRaids;
        if (myRaidList.length) {
            var raidString = myRaidList.map(t => t.name).join(', ') || 'None';
            for (var i in myRaidList) {
                var raidName = myRaidList[i].get('name');
                raid = await Raids.findOne({ where: { name: raidName } });
                var userList = raid.get('users');
                if (!userList.includes(userId)) {
                    userList += userId;
                    userList += ','; // Commas delimit the user list. Trailing comma is expected within the program.
                    await Raids.update({ users: userList }, { where: { name: raidName } });
                } else {
                    console.log(`Error: user ${userId} was already on ping list for raid ${raidName}`);
                }
            }
            return message.channel.send(`Success. You will now be pinged for the following raids (${toPingFor} raids): ${raidString}.`);
        }

        return message.channel.send(`I'm sorry, I couldn't find that raid, raid category, or element...`);
	} else if (command === 'dontpingmefor') { // Provide a category or raid alias to no longer ping this user for. "All" to remove all pings.
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
                    console.log(`Error: user ${userId} was already not on the ping list for ${raidName}`);
                }
            }
            return message.channel.send(`Success. You will not be pinged for the following ${toPingFor} raids: ${raidString}.`);
        }

        return message.channel.send(`I'm sorry, I couldn't find that raid, raid category, or element...`);
	} else if (command === 'dontping') { // Provide a User ID to not ping for any raids. (To be used when a user leaves server, etc.)
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.channel.send(`I'm sorry, this command can only be carried out by a administrator.`);
        } else {
            const userId = args.shift();

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
            return message.channel.send(`Success. The user you provided, <@${userId}>, was removed from all of the ping lists.`);
        }
	} else if (command === 'pingfor') {
        const userId = message.member.id;
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
        if (!raid && secondArg) { // See if maybe it's a two-part raid name, before we give up.
            toPingFor += " ";
            toPingFor += secondArg;
            raid = await Raids.findOne({ where: { name: toPingFor } });
            code = args.shift(); // Guess that maybe the next argument is the raid code instead.
        }
        if (raid) {
            var userList = raid.get('users');
            userList = userList.slice(0, -1); // remove trailing comma
            var ids = userList.split(',');
            var mentionString = "<@" + ids.shift() + ">";
            for (var i in ids) {
                mentionString += " | <@";
                mentionString += ids[i];
                mentionString += ">";
            }
            toPingFor = capitalizeFirstLetter(toPingFor); // prettify raid name
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
    } else if (command === 'beep') { // Test response command.
        return message.channel.send('Boop!');
    }
});

client.login(token);