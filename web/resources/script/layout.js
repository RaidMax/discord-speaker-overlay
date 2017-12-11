$(document).ready(function() {
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		$('video').attr('controls', '');
	}
});