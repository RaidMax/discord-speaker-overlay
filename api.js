const discord = require('discord.js');
const configuration = require('./helpers/configuration.js');
const response = require('./helpers/response.js');
const fileSystem = require('fs');
const client = new discord.Client();
const config = new configuration('./configuration.json');

let voiceChannels = {};
let activeMembers = {};

client.on('voiceStateUpdate', (oldMemberState, newMemberState) => {
  // no member was found
  if (activeMembers[newMemberState.id] == undefined) {
    // see if member is registered
    if (config.getMember(newMemberState.id) != undefined) {
      activeMembers[newMemberState.id] = {
		username: newMemberState.displayName,
        id: newMemberState.id,
        channelId: (newMemberState.voiceChannel == null) ? 0 : newMemberState.voiceChannel.id
      };
      console.log(`${newMemberState.displayName} is now active`);
    }
  }
  // recheck if member was added
  if (activeMembers[newMemberState.id] != undefined) {
    // not previously connected to a voice channel
    if (oldMemberState.voiceChannel == undefined) {
      // connecting to a new voice channel
      if (newMemberState.voiceChannel != undefined) {
        voiceChannels[newMemberState.voiceChannel.id] = {
          id: newMemberState.voiceChannel.id,
          speakers: {}
        };
        // set voice channel id for member
        activeMembers[newMemberState.id].channelId = newMemberState.voiceChannel.id;
        console.log(`${newMemberState.displayName} connected to ${newMemberState.voiceChannel.name}`);
      }
    }
    // previously connected to a voice channel 
    else {
      // switching voice channels
      if (newMemberState.voiceChannel != undefined) {
        // no other registered member is in the channel
        if (Object.keys(activeMembers).find(m => activeMembers[m].channelId == oldMemberState.voiceChannel.id) == undefined) {
			// remove the old voice channel
			console.log(`[switching] removing unmonitored channel ${oldMemberState.voiceChannel.name}`);
			delete voiceChannels[oldMemberState.voiceChannel.id];
        }
        // add new monitored voice channel
        voiceChannels[newMemberState.voiceChannel.id] = {
          id: newMemberState.voiceChannel.id,
          speakers: {}
        };
        // set voice channel id for member
        activeMembers[newMemberState.id].channelId = newMemberState.voiceChannel.id;
        console.log(`${newMemberState.displayName} switched to ${newMemberState.voiceChannel.name}`);
      }
      // disconnecting from existing voice channel
      else {
        // no other registered member is in the channel
        if (Object.keys(activeMembers).find(m => activeMembers[m].channelId == oldMemberState.voiceChannel.id) == undefined) {
          // remove the old voice channel
		  console.log(`[disconnecting] removing unmonitored channel ${oldMemberState.voiceChannel.name}`);
		  delete voiceChannels[oldMemberState.voiceChannel.id];
        }
		
		delete activeMembers[newMemberState.id];
        console.log(`${newMemberState.displayName} disconnected from ${oldMemberState.voiceChannel.name}`);
      }
    }
  }
});

client.on('guildMemberSpeaking', (member, speaking) => {
  let validChannel = false;

  Object.keys(voiceChannels).forEach(function(id) {
    if (id == member.voiceChannel.id) {
      validChannel = true;
    }
  });
  if (!validChannel) {
    return false;
  }

  // set speaking status to voice channel
  if (speaking) {
    voiceChannels[member.voiceChannel.id].speakers[member.id] = {
      id: member.id,
      name: member.displayName,
    };
  // remove their speaking status
  // todo: a faster way
  } else {
	delete voiceChannels[member.voiceChannel.id].speakers[member.id];
  }
});

client.on('ready', () => {
  console.log('Connected...');
  client.user.setGame('Listening to your thoughts');

  client.guilds.forEach(function(guild) {
    joinDefaultChannel(guild);
  });
});

client.on('guildCreate', (guild) => {
  config.addGuild(guild);
  console.log(`joined guild ${guild.name}`);
});

function joinDefaultChannel(guild) {
  // todo: where is the default voice channel?
  let channelToJoin = guild.afkChannel;

  if (channelToJoin != null) {
    channelToJoin.join()
      .then(connection => {
        console.log(`Joining default or afk channel ${channelToJoin.name}`);
        voiceChannels[channelToJoin.id] = {
          id: channelToJoin.id,
          speakers: []
        };
        return connection;
      })
      .catch(reason => {
        console.error(reason);
      });
  } else {
    console.error(`No available channels to join in ${guild.name}`);
  }
}

module.exports = {
	members: activeMembers,
	client: client,
	config: config
}

//todo: make this faster
module.exports.findMember = function (memberId) {
	let member = undefined;
	client.guilds.some(function(guild) {
      if ((member = guild.members.find(m => m.id == memberId)) != undefined) {
        return true;
      }
      return false;
    });
	return member;
}

// register member to be followed
module.exports.register = function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Content-Type', 'application/json');
  let member = undefined;
  const resp = response.generatePayload();
  resp.error = response.errors[0];
  /**********validation*********/
  if (req.body == undefined) {
	resp.error = response.errors[2];
	res.end(JSON.stringify(resp));
	return;
  } else if (req.body.email == undefined) {
	resp.error = response.errors[7];
	res.end(JSON.stringify(resp));
	return;
  } else if (req.body.id == undefined) {
	resp.error = response.errors[2];
	res.end(JSON.stringify(resp));
	return;
  }
  /****************************/
  if (config.getMember(req.body.id) != undefined) {
    resp.error = response.errors[3];
  } else {
    // find member in guilds
    member = module.exports.findMember(req.body.id);
  }
  if (member != undefined) {
	const channelid = member.voiceChannel == undefined ? 0 : member.voiceChannel.id
	// add them to activeMembers if in a voice channel
	activeMembers[member.id] = {
		username: member.displayName,
        id: member.id,
        channelId: channelid
    };
	// set channel active
	voiceChannels[channelid] = {
          id: channelid,
          speakers: []
    };
		
    resp.error = response.errors[0];
    resp.data = {
		message:`You are now registered as ${member.displayName}!`,
		username: member.displayName,
		id: member.id
	};
	// add them to the saved config
    config.addMember({
		id: member.id,
		email: req.body.email
	});
  } else if (resp.error.code == response.errors[0].code) {
    resp.error = response.errors[5];
  }

  res.end(JSON.stringify(resp));
};

// get the overlay info
module.exports.getOverlay = function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  let member = config.getMember(req.params.memberid);
  let channel = undefined;
  const resp = response.generatePayload();

  if (member == undefined) {
    resp.error = response.errors[2];
  } else {
    member = activeMembers[member.id];
    if (member == undefined) {
      resp.error = response.errors[6];
    } else {
	  channel = voiceChannels[member.channelId];
      if (channel == undefined) {
		resp.error = response.errors[6];
      } else {
        resp.data = channel;
        resp.error = response.errors[0];
      }
    }
  }

  res.end(JSON.stringify(resp));
};

// get by email
module.exports.getMember = function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Content-Type', 'application/json');
  
  const resp = response.generatePayload();
  const member = config.getMemberByEmail(req.body.email);
  if (member == undefined) {
	resp.error = response.errors[5];
  } else {
	resp.error = response.errors[0];
	resp.data = config.getMember(member);
  }
  
  res.end(JSON.stringify(resp)); 
};
