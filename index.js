const discord = require('discord.js');
const configuration = require('./helpers/configuration.js');
const response = require('./helpers/response.js');
const fileSystem = require('fs');
const readline = require('readline');
const web = require('./helpers/web.js');

const client = new discord.Client();
const config = new configuration('./configuration.json');

let voiceChannels = [];
let activeMembers = [];

client.on('voiceStateUpdate', (oldMemberState, newMemberState) => {
  // no member was found
  if (activeMembers[newMemberState.id] == undefined) {
    // see if member is registered
    if (config.getMember(newMemberState.id) != undefined) {
      activeMembers[newMemberState.id] = {
        id: newMemberState.id,
        channelId: 0
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
          speakers: []
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
          voiceChannels = voiceChannels.filter(function(channel) {
            return channel.id != oldMemberState.voiceChannel.id;
          });
        }
        // add new monitored voice channel
        voiceChannels[newMemberState.voiceChannel.id] = {
          id: newMemberState.voiceChannel.id,
          speakers: []
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
          voiceChannels = voiceChannels.filter(function(channel) {
            return channel.id != oldMemberState.voiceChannel.id;
          });
        }

        activeMembers = activeMembers.filter(function(member) {
          return member.id != newMemberState.id;
        });

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
    voiceChannels[member.voiceChannel.id].speakers.push({
      id: member.id,
      name: member.displayName,
      following: config.getMember(member.guild.id) != undefined
    });
    // remove their speaking status
    // todo: a faster way
  } else {
    voiceChannels[member.voiceChannel.id].speakers = voiceChannels[member.voiceChannel.id].speakers.filter(function(c) {
      return c.id != member.id
    });
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

// start the bot 
function run() {
  let token = config.getToken();
  if (token) {
    client.login(token);
  } else {
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

// register member to be followed
web.get('/api/register/:memberid', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  let member = undefined;
  const resp = response.generatePayload();
  resp.error = response.errors[0];
  
  if (config.getMember(req.params.memberid) != undefined) {
    resp.error = response.errors[3];
  } else {
    // find member in guilds
    client.guilds.some(function(guild) {
      if ((member = guild.members.find(m => m.id == req.params.memberid)) != undefined) {
        return true;
      }
      return false;
    });
  }
  if (member != undefined) {
    // add them to the saved config
    config.addMember(member);
    resp.error = response.errors[0];
    resp.data = `You are now registerd as ${member.displayName}!`;
    console.log(resp.data);
  } else if (resp.error.code == response.errors[0].code) {
    resp.error = response.errors[5];
  }

  res.end(JSON.stringify(resp));
});

// get the overlay info
web.get('/api/member/:memberid/channel', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
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

      } else {
        resp.data = channel;
        resp.error = response.errors[0];
      }
    }
  }

  res.end(JSON.stringify(resp));
});
