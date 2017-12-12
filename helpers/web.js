const configuration = function() {
	switch(process.env.NODE_ENV) {
		case 'development':
			return require('../web/configuration.json').configDevelopment;
		case 'production':
			return require('../web/configuration.json').configProduction;
		default:
			return require('../web/configuration.json').configDevelopment;
	}
};

// nav pages
const pages = {
	'register': {
		name: 'Get Started',
		href: '/register/',
		title: 'register'
	},	
	'source': {
		name: 'Source',
		href: 'https://github.com/RaidMax/discord-speaker-overlay',
		title: 'source'
	},
	'help': {
		name: 'Help',
		href: '/help/',
		title: 'help'
	}
}

// export the main run function
module.exports.run = function(index) {
	const express = require('express');
	const api = express(); 
	const config = configuration();
	const path = require('path');
	const description = 'DiscordOverlay is a Node.js project designed to provide a browser source overlay that displays currently speaking users in discord channels.';

	api.engine('pug', require('pug').__express)
	api.set('view engine', 'pug');
	api.set('views', path.join(__dirname, '../web/views'));
	api.use('/resources', express.static(path.join(__dirname, '../web/resources')));
	api.use(require('body-parser').json());
	
	// setup locals
	api.locals.pretty = true;
	api.use((req, res, next) => {
		res.locals.pages = pages;
		res.locals.description = description;
		res.locals.hostname = `${config.https ? 'https' : 'http'}://${config.domain}/`;
		next();
	});
	
	// start server
	api.listen(config.port, config.hostname, function() {
		console.log(`Express listening on ${config.hostname}:${config.port}`);
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
		username: index.findMember(req.params.memberid).displayName,
		memberid: req.params.memberid,
	}));
	
	// help
	api.get('/help', (req,res) => res.render('help', {
		currentPage: 'help'
	}));
	
	// api get overlay
	api.get('/api/member/:memberid/channel', index.getOverlay);
	
	// api register
	api.post('/api/register', index.register);
	
	// api get member
	api.post('/api/find', index.getMember);
	
	// 404 handling
	api.get('*', function(req, res) {
		res.status(404);
		res.render('error', {
			status: 404,
			message: 'PAGE NOT FOUND'
		});
	});
	
	// error handling
	api.use(function(err, req, res, next) {
		console.log(err);
		res.status(500);
		res.render('error', {
			status: 500,
			message: 'Something went wrong!',
			error: err
		});
	});
}