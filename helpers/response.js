module.exports = {
	errors: [
		{ 
			code: 0,
			message: 'success'
		},
		{
			code: 1,
			message : 'invalid guild id'
		},
		
		{
			code: 2,
			message: 'invalid member id'
		},
		{
			code: 3,
			message: 'member id is already registered'
		},
		{
			code: 4,
			message: 'no member is being followed'
		},
		{ 
			code: 5,
			message: 'member id not found in any guilds'
		},
		{
			code: 6,
			message: 'not in voice channel'
		},
		{
			code: 7,
			message: 'no email provided'
		}
	],

	generatePayload : function(_data) {
		return {
			error : {},
			data : _data,
			time : new Date(),
		};
	}
}
