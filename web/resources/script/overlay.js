function loadSpeakers(id) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			const speakerResponse = JSON.parse(xhttp.responseText);
			if (speakerResponse.error.code != 0) {
				document.getElementById('speakers').innerHTML = `<div><span class="speaker">${speakerResponse.error.message}</span></div>`;
			}
			else
			{
				let html = '';
				speakerResponse.data.speakers.forEach(function(speaker) {
					let followDiv = (speaker.following) ? `<div class="following">★</div>` : '';
					html += `<div>${followDiv}🔊<span class="speaker">${speaker.name}</span></div>`;
				});
				document.getElementById('speakers').innerHTML = html;
			}
		}
	};
	console.log(id);
	xhttp.open('GET', `/api/member/${id}/channel`, true);
	xhttp.send(); 
}