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

const description = 'DiscordOverlay is a Node.js project designed to provide a browser source overlay that displays currently speaking users in discord channels.';

api.locals.pretty = true;
api.use((req, res, next) => {
	res.locals.pages = pages;
	res.locals.description = description;
	res.locals.hostname = `https://${pkg.config.hostname}/`;
	next();
});

// index
api.get('/', (req, res) => res.render('index', { 
	currentPage: 'index'
}));
// register
api.get('/register', (req, res) => res.render('register', {
	currentPage: 'register'
}));
// overlay
api.get('/overlay/:memberid', (req, res) => res.render('overlay', {
	memberid: req.params.memberid
}));
// overlay link
api.get('/link/:memberid', (req, res) => res.render('overlaylink', {
	username: require('../index.js').findMember(req.params.memberid).displayName,
	memberid: req.params.memberid,
	hostname: pkg.config.hostname
}));
// help
api.get('/help', (req,res) => res.render('help', {
	currentPage: 'help'
}));

module.exports = api;