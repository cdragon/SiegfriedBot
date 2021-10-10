module.exports = {
    /* Parses arbitrary arguments with option flags into arrays of strings, indexed by the option flag letter. */
    parseArgs: function(args) {
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
};