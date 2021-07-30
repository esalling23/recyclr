var keystone = require('keystone');
var Player = keystone.list('Player'),
    Item = keystone.list('Item'),
    Material = keystone.list('Material'),
    Team = keystone.list('Team'),
    Game = keystone.list('Game'),
    Special = keystone.list('SpecialOption'),
    appRoot = require('app-root-path'),
    TemplateLoader = require(appRoot + '/lib/TemplateLoader'),
    _ = require('underscore');

// Creating Players Admin
exports.create = function(req, res) {
    var player = req.body;

    Player.model.findOne({'email': player.email}).lean().exec((err, oldPlayer) => {

        if (oldPlayer) {
            res.send({
                success: false,
                msg: 'Player exists',
                player: oldPlayer
            });
        } else {
            var newPlayer = new Player.model(player);

            newPlayer.save(function(err, obj) {

                if (err){
                    res.send({
                        success: false,
                        msg: 'Error creating player. Skipping this line.',
                        player: player
                    });
                } else {
                    res.send({
                        success: true,
                        player: obj
                    });
                }

            });
        }
    });

}

// Update player at end of game
exports.update = function(req, res) {

    var grade = '',
        ratio,
        passed = false,
        level = req.query.level,
        score = req.query.score,
        locals = res.locals,
        Templates = new TemplateLoader();

    var groupByLevel = function(val, cat) {
        return val.filter(function(item) {
            return item.level == cat;
        });
    };

    var grader = function(score, total) {
        ratio = score/total;
        // Turn that grade into a letter!
        if (ratio >= 0.9) {
            grade = 'A';
        } else if (ratio >= 0.8) {
            grade = 'B';
        } else if (ratio >= 0.7) {
            grade = 'C';
        } else if (ratio >= 0.5) {
            grade = 'D';
        } else if (ratio >= 0.0) {
            grade = 'F';
        }

        console.log(grade);

        return grade;
    };

    Item.model.find({}).lean().exec((err, items) => {

        Player.model.findOne({ '_id': req.query.id }).exec((err, player) => {

            if (err) throw err;

            if (player.new)
                player.new = false;

            // Check the level, then set the grade for that level
            if (level == 1) {

                var total = groupByLevel(items, 'One').length;

                player.lastTryOne = Date.now();

                if (!player.triesOne)
                    player.triesOne = 1;
                else
                    player.triesOne++;

                grade = grader(score, total);

                // If the player passed...
                if (grade == 'A' || grade == 'B' || grade == 'C') {

                    passed = true;

                    score = parseInt(score);
                    player.pointsOne = score;

                    if (!player.gradeOne || player.gradeOne == 0){
                        player.gradeOne = ratio * 100;
                        player.levelOne = true;
                    } else {
                        player.gradeOne = ratio * 100;
                    }

                }

            } else if (level == 2) {

                var total = groupByLevel(items, 'Two').length;

                player.lastTryTwo = Date.now();

                if (!player.triesTwo)
                    player.triesTwo = 1;
                else
                    player.triesTwo++;

                grade = grader(score, total);

                // If the player passed...
                if (grade == 'A' || grade == 'B' || grade == 'C') {

                    passed = true;

                    score = parseInt(score);
                    player.pointsTwo = score;

                    if (!player.gradeTwo || player.gradeTwo == 0){
                        player.gradeTwo = score * 100;
                        player.levelTwo = true;
                    } else {
                        player.gradeTwo = ratio * 100;
                    }
                } else
                    passed = false;

            } else if (level == 3) {

                var total = groupByLevel(items, 'Three').length;

                player.lastTryThree = Date.now();

                if (!player.triesThree)
                    player.triesThree = 1;
                else
                    player.triesThree++;

                grade = grader(score, total);

                // If the player passed...
                if (grade == 'A' || grade == 'B' || grade == 'C') {

                    passed = true;

                    score = parseInt(score);
                    player.pointsThree = score;

                    if (!player.gradeThree || player.gradeThree == 0) {
                        player.gradeThree = ratio * 100;
                        player.levelThree = true;
                    } else {
                        player.gradeThree = ratio * 100;
                    }
                } else
                    passed = false;

            } else {
                var itemList = items;
                var matchList = [];
                _.each(itemList, function(item) {
                    _.each(req.query.matchList, function(match) {
                        if (item.item_key === match.item) {
                            item.match = match.match;
                            item.choice = match.choice;
                            matchList.push(item);
                        }
                    });
                });

                player.leader = score;
            }

            if (!player.completed && player.levelOne && player.levelTwo && player.levelThree) {
                player.completed = true;
            }

            player.save();

            var data = {
                player: player,
                score: score,
            };

            if (level == '*') {

                data.matchList = matchList;

                Templates.Load('partials/speedMatchList', data, (html) => {

                    res.send({ html: html });

                });

            } else {

                data.total = total;
                data.grade = grade;
                data.passed = passed;
                data.next = level + 1;

                Templates.Load('partials/end', data, (html) => {

                    res.send({ html: html, grade: ratio*100 });

                });

            }


        });

    });

};

exports.level = function(req, res) {

    var Templates = new TemplateLoader();
    var data = {};
    var locals = res.locals;

    locals.section = 'level';

    var level = function(val, cat) {
        if (cat == 1)
            data.level = 'One';
        else if (cat == 2)
            data.level = 'Two';
        else if (cat == 3)
            data.level = 'Three';

        return val.filter(function(item) {
            return item.level == data.level;
        });
    };

    // Game Config
    Game.model.findOne( {}, {}, {
        sort: { 'createdAt': -1 }
    }).lean().exec((err, config) => {

        data.config = config;

        Item.model
					.find({})
					.lean()
					.populate('material specialStatus specialStatusOr')
					.exec((err, item) => {
						if (req.query.level === '*') {
							data.level = 'Free'
							data.items = _.sample(item, 31)
						} else data.items = level(item, req.query.level)

						Player.model
							.findOne({ _id: req.query.player })
							// .lean()
							.exec((err, player) => {
								if (player.new) player.new = false

								player.save()

								data.player = player.toJSON()

								Special.model
									.find({})
                                    .lean()
									.exec((err, special) => {
										data.special = special

										if (data.level === 'Three' || data.level === 'Free') {
											Templates.Load('partials/special', data, (html) => {
												data.specialHtml = html
											})
										}

										if (data.level === 'Free') {
											Templates.Load('partials/timer', data, (html) => {
												data.timerHtml = html
											})

											Templates.Load('partials/ready', data, (html) => {
												data.readyHtml = html
											})

											Templates.Load('partials/lives', data, (html) => {
												data.livesHtml = html
											})
										}

										Templates.Load('partials/level', data, (html) => {
											data.html = html

											res.send(data)
										})
									})
							})
					})
    })

};

exports.match = function(req, res) {

    var Templates = new TemplateLoader();
    var data = {};

    if (req.query.match == 'true')
        data.message = 'It\'s a match!';
    else
        data.message = 'Uh, oh! Not quite!';

    Item.model
			.findOne({ item_key: req.query.id })
			.lean()
			.exec((err, item) => {
				data.item = item

				Templates.Load('partials/match', data, (html) => {
					res.send({ html: html })
				})
			})

};

exports.material = function(req, res) {

    var Templates = new TemplateLoader();
    var data = {};

    Material.model
			.findOne({ material_key: req.query.material })
			.lean()
			.exec((err, material) => {
				data = material

				Templates.Load('partials/material', data, (html) => {
					res.send({ html: html })
				})
			})

};
