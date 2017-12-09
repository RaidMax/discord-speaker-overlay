const pkg = require('../package.json');
const path = require('path');
const express = require('express');

const api = express();
const server = api.listen(pkg.config.port, pkg.config.hostname, function() {});

api.engine('pug', require('pug').__express)
api.set('view engine', 'pug');
api.set('views', path.join(__dirname, '../web/views'));
api.use('/resources', express.static(path.join(__dirname, '../web/resources')));

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

module.exports = api;