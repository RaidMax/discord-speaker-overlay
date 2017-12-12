function loadSpeakers(memberid) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			const speakerResponse = JSON.parse(xhttp.responseText);
			if (speakerResponse.error.code != 0) {
				document.getElementById('speakers').innerHTML = `<div><span class="speaker">${speakerResponse.error.message}</span></div>`;
			} else if(speakerResponse.data != undefined) {
				let html = '';
				speakerResponse.data.speakers.forEach(function(speaker) {
					let followDiv = (speaker.id == memberid) ? `<div class="following">★</div>` : '';
					html += `<div>${followDiv}🔊<span class="speaker">${speaker.name}</span></div>`;
				});
				document.getElementById('speakers').innerHTML = html;
			} else {
				document.getElementById('speakers').innerHTML = 'An unknown error occurred;
			}
		}
	};
	xhttp.open('GET', `/api/member/${memberid}/channel`, true);
	xhttp.send();
}
