const keystone = require('keystone'),
	Player = keystone.list('Player'),
	appRoot = require('app-root-path'),
    TemplateLoader = require(appRoot + '/lib/TemplateLoader'),
    _ = require('underscore')

exports.post = function(req, res) {

	const Templates = new TemplateLoader()

	const locals = res.locals
	console.log(req.body, "login body")
	const query = Player.model.findOne({email:req.body.email}).lean()
	query.exec((err, player) => {

	    if (err || !player) return res.status(422).json({ error_code: "no_profile", msg: "No profile for that email" })

	    const data = {}
	    data.player = player.id

	    player._.password.compare(req.body.password, (err, result) => {

			if (result) {

				if (!player.login)
					player.login = true

				if (player.new)
					data.new = true

				player.lastLogin = Date.now()

				player.save()

	            data.admin = result.admin

		  		res.send('/profile/' + data.player)

			} else {

			  	console.log("wrong password")

			  	res.status(422).json({
			        error_code: "wrong_password",
			        msg: 'Sorry, wrong password'
			    })

			    return

			}

	    })

	})
}
