require('dotenv').config()
// require necessary NPM packages
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const keystone = require('keystone')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const multer = require('multer')
const merge = require('merge')
const storage = multer.memoryStorage()

// // require middleware
// const errorHandler = require('./lib/error_handler')
// const replaceToken = require('./lib/replace_token')
// const requestLogger = require('./lib/request_logger')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const db = require('./config/db')

// define server and client ports
// used for cors and local port declaration
// const serverDevPort = 4741
const clientDevPort = 7165

// define secrete cookie
const cookieSecret = 'secretCookie'

// instantiate express application object
const app = express()

_ = require('underscore')

// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}` }))
console.log(`cors allowed from: http://localhost:${clientDevPort}`)

// Simple static file support
app.use(express.static(path.join(__dirname, 'public')))

// define port for API to run on
// const port = process.env.PORT || serverDevPort

// this middleware makes it so the client can use the Rails convention
// of `Authorization: Token token=<token>` OR the Express convention of
// `Authorization: Bearer <token>`
// app.use(replaceToken)

// cookie parser middleware for KeystoneJS
app.use(cookieParser(cookieSecret))

// multer middleware for KeystoneJS
app.use(multer({ storage: storage }).any())

// add `bodyParser` middleware which will parse JSON requests into
// JS objects before they reach the route files.
// The method `.use` sets up middleware for the Express application
app.use(bodyParser.json())
// this parses requests sent by `$.ajax`, which use a different content type
app.use(bodyParser.urlencoded({ extended: true }))

// log each request as it comes in for debugging
// app.use(requestLogger)
const coreHelpers = require('./templates/helpers/core')();
const extraHelpers = require('./templates/helpers/index')()

const hbsInstance = handlebars.create({
	layoutsDir: './templates/layouts',
	partialsDir: [
		'./public',
		__dirname + '/../templates/partials',
		'./templates/partials',
	],
	defaultLayout: 'base',
	helpers: merge(coreHelpers, extraHelpers),
	extname: '.hbs',
})

// KeystoneJS config
keystone.init({
	name: 'Recylcr 2.0',
	brand: 'Recyclr',
	session: false,
	updates: 'updates',
	auth: true,
	debug: true,
	'user model': 'User',
	'auto update': true,
	mongo: db,
	'cookie secret': cookieSecret,
	views: 'templates/views',
	handlebars: hbsInstance,
	'custom engine': hbsInstance.engine,
	'view engine': 'hbs',
	// Locals for handlebars templates
	locals: {
		_: require('underscore'),
		env: process.env.ENV,
		// Not sure if I'll need this
		// utils: keystoneInst.utils,
		// editable: keystoneInst.content.editable,
	},
	'cloudinary config': {
		cloud_name: process.env.CLOUDINARY_NAME,
		api_key: process.env.CLOUDINARY_KEY,
		api_secret: process.env.CLOUDINARY_SECRET,
	},
	// serve public folder
	static: 'public'
})

// Make sure to import models before any routes or middleware that creates
// documents using the keystone lists
keystone.import('models')

keystone.set('cors allow origin', true)
keystone.set('cors allow methods', true)
keystone.set('cors allow headers', true)

// Duplicate app settings
app.set('views', 'templates/views')
app.engine('hbs', hbsInstance.engine)
app.set('view engine', 'hbs')

// require route files
const routes = require('./routes');

// // register route files
// app.use(routes)

keystone.set('routes', routes)
// register error handling middleware
// note that this comes after the route middlewares, because it needs to be
// passed any error messages from them
// app.use(errorHandler)

// start keystone
keystone.start()

// needed for testing
module.exports = app
