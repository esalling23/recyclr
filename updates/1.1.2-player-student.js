const keystone = require('keystone')
const Player = keystone.list('Player')

exports = module.exports = function (done) {
	new Player.model({
		name: { first: 'Student', last: 'User' },
		username: 'player',
        email: 'player@student.edu',
		password: 'password'
	}).save(done)
}
