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
			message: 'member id already being followed'
		},
		{
			code: 4,
			message: 'no member is being followed'
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