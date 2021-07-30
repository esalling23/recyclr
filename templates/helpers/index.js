var _ = require('underscore');
const core = require('./core')

module.exports = function() {

    var _helpers = {
    };

    /**
     * Local HBS Helpers
     * ===================
     */

     _helpers.findMaxGrade = function (score, total) {

        return score + ((total-score)/2);

    };

     _helpers.lettergrade = function (num) {

        if (!num)
            return;

        var grade;

        if (num >= 90) {
            grade = 'A';
        } else if (num >= 80) {
            grade = 'B';
        } else if (num >= 70) {
            grade = 'C';
        } else if (num >= 50) {
            grade = 'D';
        } else if (num >= 0) {
            grade = 'F';
        }

        return grade;

    };

    _helpers.listbump = function (num) {

        return num+1;

    };



    _helpers.lengthGroup = function (array, field, context) {

        return _.where(array, {field:context}).length;

    };

     _helpers.lowercase = function (str) {

        return str.toLowerCase();

    };

    _helpers.shuffle = function (arr) {

        return _.shuffle(arr);

    };


    _helpers.teamscore = function (team) {
        var score = 0;
        _.each(team, function(t){
            score += t.score;
        })

        return score;

    };

    return _helpers;


};
