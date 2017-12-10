const pkg = require('../package.json');
const path = require('path');
const express = require('express');

const api = express();
const server = api.listen(pkg.config.port, pkg.config.hostname, function() {});

api.engine('pug', require('pug').__express)
api.set('view engine', 'pug');
api.set('views', path.join(__dirname, '../web/views'));
api.use('/resources', express.static(path.join(__dirname, '../web/resources')));
api.use(require('body-parser').json());

const pages = {
	'register': {
		name: 'Get Started',
		href: '/register',
		title: 'register'
	},	
	'source': {
		name: 'Source',
		href: 'https://github.com/RaidMax/discord-speaker-overlay',
		title: 'source'
	},
	'help': {
		name: 'Help',
		href: '/help',
		title: 'help'
	}
}

// index
api.get('/', (req, res) => res.render('index', { 
	pages: pages,
	currentPage: 'index'
}));
// register
api.get('/register', (req, res) => res.render('register', {
	pages: pages,
	currentPage: 'register'
}));
// overlay
api.get('/overlay/:memberid', (req, res) => res.render('overlay', {
	memberid: req.params.memberid
}));
// overlay link
api.get('/link/:memberid', (req, res) => res.render('overlaylink', {
	pages: pages,
	username: require('../index.js')[req.params.memberid].username,
	memberid: req.params.memberid,
	hostname: pkg.config.hostname
}));
// help
api.get('/help', (req,res) => res.render('help', {
	pages: pages,
	currentPage: 'help'
}));

module.exports = api;