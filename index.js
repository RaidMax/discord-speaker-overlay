const discord = require('discord.js');
const configuration = require('./helpers/configuration.js');
const fileSystem = require('fs');
const readline = require('readline');
const express = require('express');

const client = new discord.Client();
const config = new configuration('./configuration.json');

let speakers = {};

/*function writeSpeakers() {
  let file = fileSystem.createWriteStream("discord_speakers.txt");
  file.once('open', function(fd) {
    speakers.forEach(function(member) {
      file.write(`🔊 ${member.displayName}\r\n`);
    });
    file.end();
  });
}*/

client.on('voiceStateUpdate', (oldMemberState, newMemberState) => {
  
  if (newMemberState.id != config.getProperty('following', newMemberState.guild.id)) {
    return false;
  }

  if (newMemberState.voiceChannel != undefined) {
    if ((oldMemberState.voiceChannel != undefined &&
        oldMemberState.voiceChannel.id != newMemberState.voiceChannel.id) ||
      oldMemberState.voiceChannel == undefined) {
      if (oldMemberState.voiceChannel != undefined) {
        oldMemberState.voiceChannel.leave();
      }

      newMemberState.voiceChannel.join()
        .then(connection => {
          console.log(`Followed ${newMemberState.displayName} to ${newMemberState.voiceChannel.name}`);
        })
        .catch(console.error);
    }

  } else {
    if (oldMemberState.voiceChannel != undefined) {
      oldMemberState.voiceChannel.leave();
      console.log(`${newMemberState.displayName} has left the voice channel, so disconnecting`);
    }
  }
});

client.on('guildMemberSpeaking', (member, speaking) => {
  if (speaking) {
    speakers[member.guild.id].push({
		id: member.id,
		name: member.displayName,
		following: member.id == config.getProperty('following', member.guild.id)
	});
  } else {
    speakers[member.guild.id] = speakers[member.guild.id].filter(function(c) {
      return c.id != member.id
    });
  }
});

client.on('ready', () => {
  console.log('Connected...');
  
  // make sure all guild configs are active
  client.guilds.forEach(function(guild) {
	  speakers[guild.id] = [];
	  if (config.getGuild(guild.id) == undefined) {
		config.addGuild(guild);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		
		rl.question('Enter id of the discord member to follow: ', (id) => {
			config.addProperty('following', id, guild.id);
			rl.close();
		});
	  }
	  else {
		  const following = guild.members.find(m => m.id == config.getProperty('following', guild.id));
		  if (following.voiceChannel != undefined) {
			following.voiceChannel.join()
				.then(connection => {})
				.catch(console.error);
			} else {
				console.log(`${following.displayName} is not connected to a voice channel`);
				return false;
			}
	  }
  });
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

app.get('/api/speakers/:id', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	const sp = speakers[req.params.id];
	res.end(JSON.stringify(sp));
});

let server = app.listen(80, '127.0.0.1', function(){});