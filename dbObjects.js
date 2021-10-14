const Sequelize = require('sequelize');

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
    Raids are added to this list with blank lists of users when a new one is added to the above database. */
const Raids = sequelize.define('raidpings', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
    category: Sequelize.STRING,
    element: Sequelize.STRING,
	users: Sequelize.TEXT,
});

module.exports = { Raids, Aliases };