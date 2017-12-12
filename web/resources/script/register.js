$(document).ready(function() {
	$('#register-button').click(function(e) {
		e.preventDefault();
		let memberID = $('#register-user-id').val();
		let memberEmail = $('#register-email').val();
		let modal = $('#register-modal');
		let registerForm = $('#register-form');
		if (memberID == "" || memberEmail == "") {
			modal.find('.alert').first().addClass('alert-danger');
			modal.find('.alert').first().text('Please fill out both forms.');
			modal.find('#registrationModalButton').text('Retry');
		} else {
			$.ajax({
				url: '/api/register', 
				type: 'POST',
				data: JSON.stringify({
					id: memberID,
					email: memberEmail
				}),
				dataType: 'json',
				contentType: 'application/json; charset=utf-8'
			})
			.done(function(result) {
				if (result.error.code == 0) {
					window.location.href = `/link/${result.data.id}`;
				} else {
					modal.find('.alert').first().addClass('alert-danger');
					modal.find('.alert').text(`Error: ${result.error.message}.`);
					modal.find('#registrationModalButton').text('Retry');
					modal.find('#registrationModalButton').removeClass('btn-success');
				}
			})
			.fail(function() {
				modal.find('.alert').first().addClass('alert-danger');
				modal.find('.alert').text('Error: api failed to register');
				modal.find('#registrationModalButton').text('Retry');
				modal.find('#registrationModalButton').removeClass('btn-success');
			});
		}
	});
});
