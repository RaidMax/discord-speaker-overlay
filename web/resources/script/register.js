$(document).ready(function() {
	$('#register-button').click(function(e) {
		let memberID = $('#register-user-id').val();
		let modal = $('#register-modal');
		$.getJSON(`/api/register/${memberID}`, function(result) {
			if (result.error.code == 0) {
				modal.find('.alert').first().removeClass('alert-danger');
				modal.find('.alert').first().addClass('alert-success');
				modal.find('.alert').text(result.data);
				modal.find('#registrationModalButton').text('Finish!');
				modal.find('#registrationModalButton').addClass('btn-success');
			} else {
				modal.find('.alert').first().addClass('alert-danger');
				modal.find('.alert').text(result.error.message);
				modal.find('#registrationModalButton').text('Retry');
				modal.find('#registrationModalButton').removeClass('btn-success');
			}
		});
	});
});