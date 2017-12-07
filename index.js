const discord = require('discord.js');
const configuration = require('./helpers/configuration.js');
const response = require('./helpers/response.js');
const fileSystem = require('fs');
const readline = require('readline');
const express = require('express');
const pkg = require('./package.json');

const client = new discord.Client();
const config = new configuration('./configuration.json');

let voiceChannels = [];

client.on('voiceStateUpdate', (oldMemberState, newMemberState) => {
	
  // leaving channel while still talking 
  if (newMemberState.voiceChannel == undefined
		&& voiceChannels[newMemberState.guild.id] != undefined) { 
	voiceChannels[newMemberState.guild.id].speakers = voiceChannels[newMemberState.guild.id].speakers.filter(function(c) {
      return c.id != newMemberState.id;
	});
  }
  
  if (newMemberState.id != config.getProperty('following', newMemberState.guild.id)) {
    return false;
  }

  if (newMemberState.voiceChannel != undefined) {
    if ((oldMemberState.voiceChannel != undefined &&
        oldMemberState.voiceChannel.id != newMemberState.voiceChannel.id) ||
      oldMemberState.voiceChannel == undefined) {
	  // follow member is switching channels
      if (oldMemberState.voiceChannel != undefined) { 
		// remove the old channel
		voiceChannels = voiceChannels.filter(function(channel) {
			return channel.id != oldMemberState.voiceChannel.id;
		});
		oldMemberState.voiceChannel.leave();
      }

	  // user is joining a new channel
      newMemberState.voiceChannel.join()
        .then(connection => {
          console.log(`Followed ${newMemberState.displayName} to ${newMemberState.voiceChannel.name}`);
		  voiceChannels[newMemberState.guild.id] = {
			  id: newMemberState.voiceChannel.id,
			  speakers: []
		  };
		  return connection;
        })
		.catch(reason => {
			console.log(reason);
		});
    }

   // follow member is leaving a channel
  } else {
    if (oldMemberState.voiceChannel != undefined) {
      console.log(`${newMemberState.displayName} has left the voice channel, so disconnecting`);
	  voiceChannels = voiceChannels.filter(function(channel) {
			return channel.id != oldMemberState.voiceChannel.id;
	  });
	  oldMemberState.voiceChannel.leave();
    }
  }
});

client.on('guildMemberSpeaking', (member, speaking) => {
  // make sure the voice channel is one we're following
  let validChannel = false;
  Object.keys(voiceChannels).forEach(function(c) {
	  if (voiceChannels[member.guild.id].id == member.voiceChannel.id) {
		  validChannel = true;
	  }
  });
  
  if (!validChannel) {
	  return false;
  }
  
  if (speaking) {
    voiceChannels[member.guild.id].speakers.push({
		id: member.id,
		name: member.displayName,
		following: member.id == config.getProperty('following', member.guild.id)
	});
  } else {
	  voiceChannels[member.guild.id].speakers = voiceChannels[member.guild.id].speakers.filter(function(c) {
      return c.id != member.id
    });
  }
});

client.on('ready', () => {
  console.log('Connected...');
  client.user.setGame('Listening to your thoughts');
  // make sure all guild configs are active
  client.guilds.forEach(function(guild) {
	  if (config.getGuild(guild.id) == undefined) {
		config.addGuild(guild);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		
		rl.question('Enter id of the discord member to follow: ', (id) => {
			config.setProperty('following', id, guild.id);
			rl.close();
		});
	  }
	  else { 
		  const following = guild.members.find(m => m.id == config.getProperty('following', guild.id));
		  
		  if (following != null) {
			if (following.voiceChannel == null) {
				console.log(`${following.displayName} is not connected to a voice channel`);
			}
			else {
				/****************************************/
				following.voiceChannel.join()
				.then(connection => {
				  console.log(`Followed ${following.displayName} to ${following.voiceChannel.name}`);
				  voiceChannels[following.guild.id] = {
					  id: following.voiceChannel.id,
					  speakers: []
				  };
				  return connection;
				})
				.catch(reason => {
					console.log(reason);
				});
				/********************************************/
			}
		  }
		  else {
			  console.log(`No members are being followed on ${guild.name}`);
		  }
	  }
  });
});

client.on('guildCreate', (guild) => {
	config.addGuild(guild);
	console.log(`joined guild ${guild.name}`);
});

function run() {
	let token = config.getToken();
	if (token) {
		client.login(token);
	}
	else {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		
		rl.question('Enter your discord api token: ', (tk) => {
			config.setToken(tk);
			rl.close();
			run();
		});
	}
}

setTimeout(run, 1000);

let app = express();

app.get('/api/speakers/:guildid', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	const sp = voiceChannels[req.params.guildid];
	const resp = response.generatePayload(sp);
	resp.error = response.errors[0];
	
	if (sp == undefined) {
		resp.error = response.errors[1];
	}
	else if (config.getProperty('following', req.params.guildid) == undefined) {
		resp.error = response.errors[4];
	}
	
	res.end(JSON.stringify(resp));
});

app.get('/api/speakers/:guildid/follow/:memberid', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	
	const guild = client.guilds.find(g => g.id == req.params.guildid);
	const member = (guild == undefined) ? undefined :
		guild.members.find(g => g.id == req.params.memberid);
	let isFollowing = (member != undefined);
	if (isFollowing) {
		isFollowing = config.getProperty('following', member.guild.id) != undefined;
	}
	const resp = response.generatePayload();
	resp.error = response.errors[0];
	
	if (guild == undefined) {
		resp.error = response.errors[1];
	}
	else if (member == undefined) {
		resp.error = response.errors[2];
	}
	else if (isFollowing) {
		resp.error = response.errors[3];
	}
	if (resp.error == response.errors[0]) {
		resp.data = `now following ${member.displayName}`;
		config.setProperty('following', member.id, guild.id);
		console.log(`Now following ${member.displayName} on ${guildname}`);
	}
	
	res.end(JSON.stringify(resp));
});

let server = app.listen(pkg.config.port, pkg.config.hostname, function(){});