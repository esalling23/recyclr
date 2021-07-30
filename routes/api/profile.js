var keystone = require('keystone'),
    Player = keystone.list('Player'),
    Team = keystone.list('Team'),
    appRoot = require('app-root-path'),
    TemplateLoader = require(appRoot + '/lib/TemplateLoader'),
    _ = require('underscore');

exports.get = function(req, res) {

    var Templates = new TemplateLoader(),
        data = {};

    data.subsection = 'profile';

    Team.model.find({}).lean().exec(function(err, result){

        data.teams = result;

        Player.model.findOne({ _id: req.body.player }).lean().populate('team').exec(function(err, result){

            data.player = result;

            Templates.Load('/partials/profile', data, function(html) {

                res.send(html);

            });

        });
    });


};

exports.update = function(req, res) {

    var data = {};

    Player.model.findOne({ _id: req.params.id }).populate('team').exec((err, result) => {

        if (req.body.team) {
            result.team = req.body.team;
        }

        if (req.body.username) {
            result.username = req.body.username;
            data.username = req.body.username;
        }

        result.save();

        if (result.team) {
           Team.model
							.findOne({ _id: result.team })
							.lean()
							.exec((err, result) => {
								data.team = result

								res.send(data)
							})
        } else {
            res.send(data);
        }


    });

};


exports.image_upload = function(req, res) {

    Player.model
			.findOne({ _id: req.params.id })
			.lean()
			.exec((err, result) => {
				result.getUpdateHandler(req).process(req.body, function (err) {
					if (err) return res.apiError('error', err)

					res.send('success')
				})
			})

};

exports.resetLevels = function (req, res) {
    Player.model.findOne({ _id: req.params.id })
        .then(player => {

            console.log("Resetting player levels")
            player.levelOne = false
            player.pointsOne = 0
            player.gradeOne = 0
            player.triesOne = 0

            player.levelTwo = false
            player.pointsTwo = 0
            player.gradeTwo = 0
            player.triesTwo = 0

            player.levelThree = false
            player.pointsThree = 0
            player.gradeThree = 0
            player.triesThree = 0

            player.completed = false

            return player.save()
        })
        .then(player => {
            console.log(player)
            res.sendStatus(200)
        })
        .catch(err => res.status(400).json(err))
}
