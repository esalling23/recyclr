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

const db = require('./config/db')
console.log(db)

const clientDevPort = 7165

const cookieSecret = 'secretCookie'

const app = express()

_ = require('underscore')

app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}` }))
app.use(express.static(path.join(__dirname, 'public')))
// Required by KeystoneJS
app.use(cookieParser(cookieSecret))

// For KeystoneJS file storage
app.use(multer({ storage: storage }).any())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

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

app.set('views', 'templates/views')
app.engine('hbs', hbsInstance.engine)
app.set('view engine', 'hbs')

const routes = require('./routes');
keystone.set('routes', routes)

keystone.start()

module.exports = app
