module.exports = {
    /* Parses arbitrary arguments with option flags into arrays of strings, indexed by the option flag letter. */
    parseArgs: function(args) {
        var dict = {};
        var index = 0;
        dict[index] = [];
        while (typeof (i = args.shift()) !== 'undefined') {
            /* Option flag */
            if (i.charAt(0) === '-') {
                index = i.charAt(1).toLowerCase();
                dict[index] = [];
            } else {
                dict[index].push(i.toLowerCase());
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
        return returnString;
    },

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