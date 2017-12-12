$(document).ready(function() {
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		$('video').attr('controls', '');
	}
	
	$('#findidModalButton').click(function(e) {
		const modal = $('#findid-modal');
		const email = $('#findid-modalinput').val();
		
		$.ajax({
				url: '/api/find', 
			type: 'POST',
			data: JSON.stringify({
			email: email
		}),
			dataType: 'json',
			contentType: 'application/json; charset=utf-8'
		})
		.done(function(result) {
			console.log(result.data);
			if (result.error.code == 0) {
				window.location.href = `/link/${result.data.id}`;
			} else {
				modal.find('.alert').text(`Error: ${result.error.message}.`);
				modal.find('.alert').fadeIn('fast');
			}
		})
		.fail(function() {
			modal.find('.alert').text('Error: api could not complete your request.');
			modal.find('.alert').fadeIn('fast');
		});
	});
});
