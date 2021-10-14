module.exports = {
    /* Parses arbitrary string of arguments with option flags into arrays of strings, indexed by the option flag letter. */
    parseArgs: function(args) {
        var dict = {};
        var index = 0;
        dict[index] = [];
        for (var a in args) {
            if (args[a].charAt(0) === '-') { // option flag
                index = args[a].charAt(1).toLowerCase();
                dict[index] = [];
            } else { // space delimited
                dict[index].push(args[a].toLowerCase());
            }
        }
        return dict;
    },

    /* Prettify string for pinging. */
    capitalizeFirstLetter: function(string) {
        var strList = string.split(' ');
        var returnString = strList[0].charAt(0).toUpperCase() + strList[0].slice(1);
        strList.shift(); // shift first element
        for (var i in strList) { // If there are more words, also capitalize them.
            returnString += ' ';
            if (strList[i] === 'hl') { // Special case for "HL" raid names.
                returnString += "HL";
            } else {
                returnString += strList[i].charAt(0).toUpperCase();
                returnString += strList[i].slice(1);
            }
        }
        var i = returnString.indexOf('-');
        if (i >= 0) {
            // Do a little string wizardry to make names with dashes look good (this is literally just Anima-Animus Core right now)
            returnString = returnString.slice(0, i+1) + returnString.charAt(i+1).toUpperCase() + returnString.slice(i+2);
        }
        return returnString;
    },

    /* Parse quotation marks ("") out of argument strings */
    parseQuotedArgs: function(array) {
        var returnArray = [];
        var str = "";
        for (var i in array) {
            if (!str) {
                if (array[i].charAt(0) === '\"') {
                    if (str.charAt(str.length - 1) === '\"') {
                        returnArray.push(array[i]);
                    } else {
                        str += array[i].slice(1);
                        str += " ";
                    }
                } else {
                    returnArray.push(array[i]);
                }
            } else {
                str += array[i];
                if (str.charAt(str.length - 1) === '\"') {
                    returnArray.push(str.slice(0, -1));
                    str = "";
                } else {
                    str += " ";
                }
            }
        }
        return returnArray;
    },
};