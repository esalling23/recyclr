var keystone = require('keystone')
var User = keystone.list('User')

exports = module.exports = function (done) {
	new User.model({
		name: { first: 'Student', last: 'User' },
        email: 'user@student.edu',
		password: 'password'
	}).save(done)
}
