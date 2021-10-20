/* This file handles both the subscribe and unsubscribe commands via the same logic. */

const utils = require('./utils');
const { Raids, Aliases } = require ('./dbObjects');

function dosub (userId, userList) {
    var returnList = userList;
    if (!userList.includes(userId)) {
        returnList += userId;
        returnList += ',';
        return returnList;
    }
    return returnList;
}

function dounsub (userId, userList) {
    var returnList = userList;
    if (userList.includes(userId)) {
        var list = userList.split(userId + ',');
        returnList = list.filter(Boolean).join(); // Filter removes potential empty strings from the join to prevent stray commas from appearing.
        return returnList;
    } 
    return returnList;
}

module.exports = {
    unsub: async function (raidName, userId, userList) {
        var newList = dounsub(userId, userList);
        if (newList.length) {
            await Raids.update({ users: newList }, { where: { name: toPingFor } });
            return true;
        }
        await Raids.update({ users: newList }, { where: { name: raidName } });
        return false;
    },
    subunsub: async function(message, args, sub) {
        const userId = message.member.id;
        var argsDict = utils.parseArgs(args);
        var parsedArgs = utils.parseQuotedArgs(argsDict[0]);

        var returnString = sub ? `Success. You have been added to the lists for the following raids: ` 
                                : `Success. You will not be pinged for the following raids: `;
        var alreadyAdded = ``;
        var toAdd = ``;
        for (var a in parsedArgs) {
            var toPingFor = parsedArgs[a];

            // Check if this is an alias for a raid.
            var alias = await Aliases.findOne({ where: { alias: toPingFor } });
            if (alias) {
                toPingFor = alias.get('name');
            }

            // Once we have the proper name, prettify it for output purposes
            var prettyPing = utils.capitalizeFirstLetter(toPingFor);

            // Check if this is a raid name (rather than category or element).
            var raid = await Raids.findOne({ where: { name: toPingFor } });
            if (raid) {
                var userList = raid.get('users');
                var newList = '';
                if (sub) { // function called as subscribe
                    newList = dosub(userId, userList);
                } else { // function called as unsubscribe
                    newList = dounsub(userId, userList);
                }
                if (newList !== userList) {
                    try {
                        await Raids.update({ users: newList }, { where: { name: toPingFor } });
                        toAdd += `${prettyPing}, `;
                    } catch (error) {
                        console.error(error);
                        return message.channel.send(`I'm sorry, something went wrong when updating the database.`);
                    }
                } else {
                    alreadyAdded += `${prettyPing}, `;
                }
            } else {
                // If we didn't get a raid name, see if we got a category (or element) name.
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
                            var newList = '';
                            if (sub) {
                                newList = dosub(userId, userList);
                            } else {
                                newList = dounsub(userId, userList);
                            }
                            if (newList !== userList) {
                                await Raids.update({ users: newList }, { where: { name: raidName } });
                            } else {
                                alreadyAdded += utils.capitalizeFirstLetter(raidName);
                                alreadyAdded += `, `;
                            }
                        }
                        toAdd += `${prettyPing} raids (${raidString}), `;
                    } catch (error) {
                        console.error(error);
                        return message.channel.send(`I'm sorry, something went wrong when updating the database.`);
                    }
                } else {
                    message.channel.send(`I'm sorry, I couldn't find ${prettyPing} at all... (maybe you need to add this alias to my database?)`);
                }
            }
        }

        // If we didn't add/remove anything, don't say that we did, because that's confusing and dumb.
        if (toAdd.length) returnString = returnString + toAdd.slice(0, -2) + `.`; // Output cleanup (trailing comma+space)
        else returnString = ``;

        // If we found any lists that the user was already on, let them know for posterity's sake.
        if (alreadyAdded) { 
            alreadyAdded = alreadyAdded.slice(0, -2) + `.`;
            if (returnString) returnString += `\n`;
            returnString += sub ? `You were already on the lists for the following: ` : `You were not on the lists for the following: `;
            returnString += alreadyAdded;
        }

        if (returnString) return message.channel.send(returnString);
        return;
    },
}