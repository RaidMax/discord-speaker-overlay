const fileSystem = require('fs');
let config = undefined;

class Configuration {
	constructor(fileName) {
		this._fileName = fileName;
		this._configList = {};
		config = this;
		fileSystem.readFile(this._fileName, 'utf8', this._readCallback);
	}
	
	_readCallback(err, data) {
		if (err) {
			console.log(`Configuration ${config._fileName} does not exist`);
		}
		else {
			config._configList = JSON.parse(data);
		}
	}
	
	_writeCallback(err) {
		if (err) {
			console.log(`Could not write configuration to ${config._fileName}: ${err}`);
		}
		else {
			console.log(`Saved configuration to ${config._fileName}`);
		}
	}

	write() {
		const configJSON = JSON.stringify(this._configList);
		fileSystem.writeFile(this._fileName, configJSON, 'utf8', this._writeCallback);
	}
	
	addGuild(guild) {
		this._configList[guild.id] = { id: guild.id };
		this.write();
	}
	
	getGuild(guildId) {
		return this._configList[guildId];
	}
	
	addProperty(property, value, guildId) {
		this._configList[guildId][property] = value;
		this.write();
	}
	
	getProperty(property, guildId) {
		return this._configList[guildId][property];
	}
	
	getToken() {
		return this._configList['token'];
	}
	
	setToken(token) {
		this._configList['token'] = token;
	}
}

module.exports = Configuration;