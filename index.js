const fs = require('fs');
const utils = require('./utils');
const { Raids, Aliases } = require('./dbObjects');
const { Collection, Client, Intents } = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

/* Set up commands. */
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
    Raids.sync();
    Aliases.sync();
    console.log('Ready!');
});

client.on('messageCreate', async message => {
    const lowercaseMessage = message.content.toLowerCase();
	if (!(lowercaseMessage.startsWith(prefix) || lowercaseMessage.includes('pingfor')) || message.author.bot) return;

    var args = message.content.slice(prefix.length).trim().split(' ');
    var commandName = args.shift().toLowerCase();

    // Pingfor commands are special and can be used without the prefix, and are interpreted from any point in the message.
    if (lowercaseMessage.includes('pingfor')) {
        var msg = lowercaseMessage.trim().split('pingfor');
        args = msg[1].trim().split(' ');
        commandName = 'pingfor';
    }

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		return message.reply('There was an error trying to execute that command!');
	}
});

client.login(token);