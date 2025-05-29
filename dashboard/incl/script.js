if(typeof localStorage.player_volume == "undefined") localStorage.player_volume = 0.15;

var dashboardLoader, dashboardBody, dashboardBase;
var intervals = [];
var updateFilters = true;

window.addEventListener('load', () => {
	dashboardLoader = document.getElementById("dashboard-loader");
	dashboardBody = document.getElementById("dashboard-body");
	dashboardBase = document.querySelector("base");
	
	dashboardBody.classList.add("hide");
	
	loadAudioPlayer();
	updatePage();
	updateNavbar();
	
	window.addEventListener("popstate", (e) => getPage(e.target.location.href, true));
	
	setTimeout(() => dashboardLoader.classList.add("hide"), 200);
});

async function getPage(href, skipCheck = false) {
	if(!skipCheck && ((window.location.href.endsWith(href) && href.length) || (!href.length && dashboardBase.getAttribute("href") == './'))) return false;
	
	dashboardLoader.classList.remove("hide");
	
	switch(true) {
		case href == '@':
			skipCheck = true;
			href = window.location.href;
			break;
		case href.startsWith('@'):
			const newParameters = href.substring(1).split("&");
			const urlParams = new URLSearchParams(window.location.search);
			
			newParameters.forEach(newParameter => {
				newParameter = newParameter.split("=");
				
				if(newParameter[1] != 'REMOVE_QUERY') urlParams.set(newParameter[0], newParameter[1]);
				else urlParams.delete(newParameter[0]);
			});
			
			const urlParamsText = urlParams.toString();
			
			href = urlParamsText.length ? window.location.pathname + "?" + urlParamsText : window.location.pathname;
			
			break;
	}
	
	const pageRequest = await fetch(href);
	const response = await pageRequest.text();
	
	await changePage(response, href, skipCheck);
	
	dashboardLoader.classList.add("hide");
	
	return true;
}

async function postPage(href, form, showLoadingCircle = true) {
	const formData = await getForm(form);
	if(!formData) return false;

	if(showLoadingCircle) dashboardLoader.classList.remove("hide");
	
	switch(true) {
		case href == '@':
			href = window.location.href;
			break;
		case href.startsWith('@'):
			const newParameter = href.substring(1).split("=");
			
			const urlParams = new URLSearchParams(window.location.search);
			urlParams.set(newParameter[0], newParameter[1])
			
			break;
	}
	
	const pageRequest = await fetch(href, {
		method: "POST",
		body: formData
	});
	const response = await pageRequest.text();
	
	href = pageRequest.url;
	
	await changePage(response, href);
	
	if(showLoadingCircle) dashboardLoader.classList.add("hide");
}

function changePage(response, href, skipCheck = false) {
	return new Promise(r => {
		newPageBody = new DOMParser().parseFromString(response, "text/html");
	
		const newPage = newPageBody.getElementById("dashboard-page");
		
		if(newPage == null) {
			const toastBody = newPageBody.getElementById("toast");
			if(toastBody != null) return r(showToast(toastBody));
			
			Toastify({
				text: failedToLoadText,
				duration: 2000,
				position: "center",
				escapeMarkup: false,
				className: 'error',
			}).showToast();
			
			return r(false);
		}

		if(!skipCheck) history.pushState(null, null, href);
		
		const newPageScript = newPageBody.querySelector("#pageScript");
		
		document.getElementById("dashboard-page").replaceWith(newPage);
		document.querySelector("base").replaceWith(newPageBody.querySelector("base"));
		document.querySelector("title").replaceWith(newPageBody.querySelector("title"));
		document.querySelector("nav").replaceWith(newPageBody.querySelector("nav"));
		document.querySelector("#dashboardScript").replaceWith(newPageBody.querySelector("#dashboardScript"));
		if(newPageScript != null) {
			eval(newPageScript.textContent);
			newPageScript.remove();
		}
		
		dashboardBody = document.getElementById("dashboard-body");
		dashboardBase = document.querySelector("base");
		
		updatePage();
		updateNavbar();
		
		r(true);
	});
}

async function updateNavbar() {
	const navbarButtons = document.querySelectorAll("nav button");
	
	navbarButtons.forEach(navbarButton => {
		const href = navbarButton.getAttribute("href");
		const dropdown = navbarButton.getAttribute("dashboard-dropdown");
		
		if(href != null && ((window.location.href.endsWith(href) && href.length) || (!href.length && dashboardBase.getAttribute("href") == './'))) navbarButton.classList.add("current");
		
		if(dropdown != null) {
			const navbarDropdown = document.querySelector("#" + dropdown + " .dropdown-items");
			navbarDropdown.style = "--dropdown-height: " + navbarDropdown.scrollHeight + "px";
			
			navbarButton.addEventListener("mouseup", (event) => toggleDropdown(dropdown));
		}
	});
}

function toggleDropdown(dropdown) {
	const previousDropdown = document.querySelector(".dropdown.show");
	if(previousDropdown != null && previousDropdown.id != dropdown) previousDropdown.classList.remove("show");
	
	document.getElementById(dropdown).classList.toggle("show");
}

function showToast(toastBody) {
	Toastify({
		text: toastBody.innerHTML,
		duration: 2000,
		position: "center",
		escapeMarkup: false,
		className: toastBody.getAttribute("state"),
	}).showToast();
	
	const dateElements = document.querySelector(".toastify").querySelectorAll('[dashboard-date]');
	dateElements.forEach(async (element) => {
		const dateTime = element.getAttribute("dashboard-date");
		
		const textStyle = element.getAttribute("dashboard-full") != null ? "long" : "short";
		
		element.innerHTML = timeConverter(dateTime, textStyle);
		intervals[999] = setInterval(async (event) => {
			element.innerHTML = timeConverter(dateTime, textStyle);
		}, 1000);
		
		element.onclick = () => {
			Toastify({
				text: timeConverter(dateTime, false),
				duration: 2000,
				position: "center",
				escapeMarkup: false,
				className: "info",
			}).showToast();
		}
	});
	
	const toastLocation = toastBody.getAttribute("location");
	if(toastLocation.length) getPage(toastLocation);
}

async function updatePage() {
	for(const element of document.querySelectorAll("[dashboard-hide=true]")) element.remove();
	for(const element of document.querySelectorAll("[dashboard-show=false]")) element.remove();
	
	const navbar = document.querySelector("nav");
	navbar.addEventListener("mouseenter", () => dashboardBody.classList.remove("hide"));
	navbar.addEventListener("mouseleave", () => dashboardBody.classList.add("hide"));
	
	const removeElements = dashboardBody.querySelectorAll('[dashboard-remove]');
	removeElements.forEach(async (element) => {
		const elementsToRemove = element.getAttribute("dashboard-remove").split(" ");
		
		elementsToRemove.forEach(async (remove) => element.removeAttribute(remove));
		
		element.removeAttribute("dashboard-remove");
	});
	
	const copyElements = dashboardBody.querySelectorAll('[dashboard-copy]');
	copyElements.forEach(async (element) => {
		const textToCopy = element.innerHTML;
	
		if(!textToCopy.length) return;
			
		element.addEventListener("click", async (event) => copyElementContent(textToCopy));
	});
	
	const hrefElements = document.querySelectorAll('[href]');
	hrefElements.forEach(async (element) => {
		const href = element.getAttribute("href");
		
		element.addEventListener("mouseup", async (event) => {
			switch(event.button) {
				case 0:
					getPage(href);
					break;
				case 1:
					const openNewTab = document.createElement("a");
					openNewTab.href = href;
					openNewTab.target = "_blank";
					openNewTab.click();
					return false;
					break;
			}
		});
	});
	
	const disableElements = dashboardBody.querySelectorAll('[dashboard-disable]');
	disableElements.forEach(async (element) => {
		const isDisable = element.getAttribute("dashboard-disable");
		
		if(isDisable == 'true') element.disabled = true;
	});
	
	intervals.forEach(async (interval) => clearInterval(interval));
	
	var index = 0;
	
	const dateElements = dashboardBody.querySelectorAll('[dashboard-date]');
	dateElements.forEach(async (element) => {
		const dateTime = element.getAttribute("dashboard-date");
		
		index++;
		
		const textStyle = element.getAttribute("dashboard-full") != null ? "long" : "short";
		
		element.innerHTML = timeConverter(dateTime, textStyle);
		intervals[index] = setInterval(async (event) => {
			element.innerHTML = timeConverter(dateTime, textStyle);
		}, 1000);
		
		element.onclick = () => {
			Toastify({
				text: timeConverter(dateTime, false),
				duration: 2000,
				position: "center",
				escapeMarkup: false,
				className: "info",
			}).showToast();
		}
	});
	
	if(player.isPlaying) document.querySelectorAll("[dashboard-song='" + player.isPlaying + "'] i").forEach((element) => element.classList.replace("fa-circle-play", "fa-circle-pause"));
	
	const songElements = dashboardBody.querySelectorAll('[dashboard-song]');
	songElements.forEach(async (element) => {
		const songID = element.getAttribute("dashboard-song");
		const songAuthor = element.getAttribute("dashboard-author");
		const songTitle = element.getAttribute("dashboard-title");
		const songURL = element.getAttribute("dashboard-url");
		
		element.onclick = () => player.interact(songID, songAuthor, songTitle, songURL);
	});
	
	const timeElements = dashboardBody.querySelectorAll('[dashboard-time]');
	timeElements.forEach(async (element) => {
		const timeValue = element.getAttribute("dashboard-time");
		
		element.innerHTML = convertSeconds(timeValue);
	});
	
	const checkChangeElements = document.querySelectorAll("[dashboard-check-change]");
	checkChangeElements.forEach(element => element.onchange = () => checkChangedElements());
	
	const pageButtonsElement = document.querySelector("[dashboard-page-buttons]");
	const pageButtonsDiv = document.querySelector("[dashboard-page-div]");
	
	if(pageButtonsElement != null && pageButtonsDiv != null) {
		const pagePseudoElement = document.createElement("span");
		
		pagePseudoElement.style['min-height'] = pageButtonsElement.offsetHeight;
		pagePseudoElement.style['max-height'] = pageButtonsElement.offsetHeight;
		pageButtonsDiv.appendChild(pagePseudoElement);
	}
	
	const favouriteButtonsElements = document.querySelectorAll("[dashboard-favourite]");
	favouriteButtonsElements.forEach(async (element) => {
		const songID = element.getAttribute("dashboard-favourite");
		
		element.onclick = () => favouriteSong(songID);
	});
	
	const modalButtonElements = document.querySelectorAll("[dashboard-modal-button]");
	modalButtonElements.forEach(async (element) => {
		const modalID = element.getAttribute("dashboard-modal-button");
		const modalElement = document.querySelector(`[dashboard-modal="${modalID}"]`);
		const modalBackground = modalElement.querySelector(`span.background`);
		
		element.onclick = () => modalElement.classList.toggle("show");
		modalBackground.onclick = () => modalElement.classList.remove("show");
	});
	
	const selectSearchElements = document.querySelectorAll("[dashboard-select-search]");
	selectSearchElements.forEach(async (element) => {
		const searchID = element.getAttribute("dashboard-select-search");
		const searchToggle = document.querySelector(`[dashboard-select-show="${searchID}"]`);
		const searchValueInput = element.querySelector("[dashboard-select-value]");
		
		searchToggle.onchange = (e) => {
			if(e.target.checked) {
				element.classList.add("view");
				searchValueInput.disabled = false;
			} else {
				element.classList.remove("view");
				searchValueInput.disabled = true;
			}
		}
		
		const searchInput = element.querySelector("[dashboard-select-input]");
		const searchURL = searchInput.getAttribute("dashboard-select-input");
		
		element.addEventListener("focusin", () => element.classList.add("show"));
		document.addEventListener("click", (e) => {
			if(!element.contains(e.target) && element != e.target) element.classList.remove("show");
		});
		
		searchInput.oninput = async (e) => {
			const searchValue = e.target.value;
			clearTimeout(intervals[searchID]);
			
			intervals[searchID] = setTimeout(async () => {
				const searchOptions = element.querySelector("[dashboard-select-options]");
				const searchResults = await searchSomething(searchURL, searchValue);
				
				searchValueInput.value = 0;
				searchOptions.innerHTML = "";
				
				if(!searchResults.length) return;
				
				for await (const song of searchResults) {
					const searchOption = document.createElement("div");
					searchOption.classList.add("option");
					searchOption.innerHTML = song.icon.length ? song.icon + " " + escapeHTML(song.name) : escapeHTML(song.name);
					
					searchOption.onclick = () => {
						searchInput.value = escapeHTML(song.name);
						searchValueInput.value = song.ID;
						
						element.classList.remove("show");
					}
					
					searchOptions.appendChild(searchOption);
				}
			}, 500);
		}
	});
	
	const filterButtonElements = document.querySelectorAll("[dashboard-filter-button]");
	filterButtonElements.forEach(async (element) => {
		const difficultyButton = element.querySelector("button");
		const difficultyInputs = element.querySelectorAll("input");
		const difficultyButtonStyle = element.getAttribute("dashboard-filter-button");
		
		difficultyButton.onclick = () => {
			const isActivate = !element.classList.contains("activated");
			
			if(isActivate) {
				element.classList.add("activated");
				difficultyInputs.forEach(element => element.disabled = false);
			} else {
				element.classList.remove("activated");
				difficultyInputs.forEach(element => element.disabled = true);
			}
			
			if(difficultyButtonStyle == "demon") {
				if(!isActivate) {
					const demonDifficulties = document.querySelectorAll('.difficultyButton.activated[dashboard-filter-button="demon"]');
					if(!demonDifficulties.length) element.parentElement.classList.remove("demon");
				} else element.parentElement.classList.add("demon");
			} 
		}
	});
	
	const modalPage = document.querySelector("[dashboard-modal]");
	if(modalPage != null && updateFilters) {
		const url = new URL(window.location.href);
		
		for(const entry of url.searchParams.entries()) {
			const entryName = entry[0];
			const entryValue = escapeHTML(decodeURIComponent(entry[1]));
		
			const input = modalPage.querySelector(`input[name="${entryName}"]`);
			if(input != null) {
				 if(input.type == 'checkbox') {
					 if(entryValue == '1') { // No, i can't move this if to if above
						input.click();
						
						const selectID = input.getAttribute("dashboard-select-show");
						if(selectID != null) {
							const selectDiv = modalPage.querySelector("[dashboard-select-search]");
							const selectValueInput = selectDiv.querySelector("[dashboard-select-value]");
							const selectValue = url.searchParams.get(selectValueInput.name);
							const selectInput = selectDiv.querySelector("[dashboard-select-input]");
							
							console.log(selectValue.trim().length, selectValue != '0', selectValue);
							
							if(selectValue.trim().length && selectValue != '0') {
								const search = await searchSomething(selectInput.getAttribute("dashboard-select-input"), selectValue);
								
								if(search.length) {
									selectInput.value = escapeHTML(search[0].name);
									selectValueInput.value = selectValue;
								}
							}
						}
					 }
				 } else {
					 input.value = entryValue;
				 }
			} else {
				const inputs = modalPage.querySelectorAll(`input[name="${entryName}[]"]`);
				if(inputs.length) {
					const inputValues = entryValue.split(",");
					
					inputs.forEach(async (element) => {
						const inputButton = element.parentElement.querySelector("button");
						
						if(inputValues.includes(element.value) && !element.hasAttribute("dashboard-modal-skip")) inputButton.click();
					});
				}
			}
		}
	}
	if(updateFilters) updateFilters = false;
}

function timeConverter(timestamp, textStyle = "short") {
	if(!textStyle) {
		const time = new Date(timestamp * 1000);
		
		const dayNumber = time.getDate();
		const day = dayNumber < 10 ? '0' + String(dayNumber) : dayNumber;
		
		const monthNumber = time.getMonth() + 1;
		const month = monthNumber < 10 ? '0' + String(monthNumber) : monthNumber;
		
		const year = time.getFullYear();
		
		const hours = time.getHours();
		
		const minutesNumber = time.getMinutes();
		const minutes = minutesNumber < 10 ? '0' + String(minutesNumber) : minutesNumber;
		
		const secondsNumber = time.getSeconds();
		const seconds = secondsNumber < 10 ? '0' + String(secondsNumber) : secondsNumber;
		
		return day + '.' + month + '.' + year + ", "+ hours + ":" + minutes + ":" + seconds;
	}
	
	const currentTime = new Date();
	var passedTime = Math.round(currentTime.getTime() / 1000) - timestamp;
	var unitType = '';
	
	switch(true) {
		case passedTime >= 31536000:
			passedTime = Math.round(passedTime / 31536000);
			unitType = 'year';
			break;
		case passedTime >= 2592000:
			passedTime = Math.round(passedTime / 2592000);	
			unitType = 'month';
			break;
		case passedTime >= 604800:
			passedTime = Math.round(passedTime / 604800);
			unitType = 'week';
			break;
		case passedTime >= 86400:
			passedTime = Math.round(passedTime / 86400);
			unitType = 'day';
			break;
		case passedTime >= 3600:
			passedTime = Math.round(passedTime / 3600);
			unitType = 'hour';
			break;
		case passedTime >= 60:
			passedTime = Math.round(passedTime / 60);
			unitType = 'minute';
			break;
		case passedTime >= 0:
			unitType = 'second';
			break;
	}
	
	const options = {
		numeric: "auto",
		style: textStyle
	}
	
	const rtf = new Intl.RelativeTimeFormat(localStorage.language.toLowerCase(), options);
	return capitalize(rtf.format(-1 * passedTime, unitType));
}

function copyElementContent(textToCopy) {
	navigator.clipboard.writeText(textToCopy);
	
	Toastify({
		text: copiedText,
		duration: 2000,
		position: "center",
		escapeMarkup: false,
		className: "success",
	}).showToast();
}

function showLevelPassword() {
	const levelPasswordElement = document.querySelector("[dashboard-password]");
	
	const levelPasswordOld = levelPasswordElement.innerHTML;
	const levelPasswordNew = levelPasswordElement.getAttribute("dashboard-password");
	
	levelPasswordElement.innerHTML = levelPasswordNew;
	levelPasswordElement.setAttribute("dashboard-password", levelPasswordOld);
}

function capitalize(val) { // https://stackoverflow.com/a/1026087
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function convertSeconds(time) { // https://stackoverflow.com/a/36981712
	if(time == 0 || isNaN(time)) return "0:00.000";

	time = time / 1000;

	var seconds = time % 60;
	var foo = time - seconds;
	var minutes = Math.round(foo / 60);
	
	if(seconds == 60) {
		seconds = 0;
		minutes++;
	}
	
	if(seconds < 10) seconds = "0" + seconds.toString();
	
	return minutes + ":" + seconds;
}

function checkChangedElements() { // Havent finished yet
	const checkChangeElements = document.querySelectorAll("[dashboard-check-change]");
	checkChangeElements.forEach(element => {
		switch(element.type) {
			case 'radio':
				
		}
	});
}

function downloadSong(songAuthor, songTitle, songURL) {
	fakeA = document.createElement("a");
	fakeA.href = decodeURIComponent(songURL);
	fakeA.download = songAuthor + " - " + songTitle + ".mp3";
	fakeA.setAttribute("target", "_blank");
	
	fakeA.click();
}

async function favouriteSong(songID) {
	const favouriteButtonsElement = document.querySelector(`[dashboard-favourite="${songID}"]`);
	if(favouriteButtonsElement == null) return false;
	
	favouriteButtonsElement.style.opacity = "0.9";
	favouriteButtonsElement.disabled = true;
	
	const favouriteButtonIcon = favouriteButtonsElement.querySelector("i");
	const favouriteButtonText = favouriteButtonsElement.querySelector("span");
	
	if(favouriteButtonIcon.classList.contains("fa-regular")) {
		favouriteButtonIcon.classList.remove("fa-regular");
		favouriteButtonIcon.classList.add("fa-solid");
		
		favouriteButtonText.innerHTML++;
	} else {
		favouriteButtonIcon.classList.remove("fa-solid");
		favouriteButtonIcon.classList.add("fa-regular");
		
		favouriteButtonText.innerHTML--;
	}
	
	const formData = new FormData();
	formData.set("songID", songID);
	
	await postPage('manage/favouriteSong', formData, false);
	
	favouriteButtonsElement.style.opacity = "1";
	favouriteButtonsElement.disabled = false;
}

async function getForm(form) {
	if(typeof form == 'object') return form;
	
	const formElement = document.querySelector("form[name=" + form + "]");
	const formData = new FormData(formElement);
	const formEntries = formData.entries();
	
	for(const entry of formEntries) {
		const isOptional = formElement.querySelector("input[dashboard-not-required][name=" + entry[0] + "]");
		if(!entry[1].trim().length && isOptional == null) {
			formElement.classList.add("empty-fields");
			return false;
		}
	}
	
	return formData;
}

async function searchSomething(url, search) {
	const searchResult = await fetch(url + "?search=" + encodeURIComponent(search)).then(req => req.json());
	
	return searchResult;
}

async function applyFilters(modalID) {
	const formElement = document.querySelector(`form[dashboard-modal="${modalID}"]`);
	const formInputs = formElement.querySelectorAll("input"); // FormData(formElement) is bugged and skips inputs for no reason
	
	const realForm = new FormData();
	
	const arrayEntries = {};
	
	formInputs.forEach(async (input) => {
		const inputName = input.getAttribute("name");
		const inputValue = input.value;

		if(inputName == null || input.disabled || (input.type == "checkbox" && !input.checked) || !inputValue.trim().length) return;
		
		if(inputName.endsWith("[]")) {
			if(arrayEntries[inputName.slice(0, -2)] == null) arrayEntries[inputName.slice(0, -2)] = [];
					
			arrayEntries[inputName.slice(0, -2)].push(inputValue.trim());
		} else realForm.set(inputName, inputValue);
	});
	
	for(const entry of Object.entries(arrayEntries)) {
		const entryName = entry[0];
		const entryValue = entry[1].filter((value, index, self) => self.indexOf(value) === index);
		
		realForm.set(entryName, entryValue.join(','));
	}
	
	updateFilters = true;
	await getPage(window.location.pathname + "?" + new URLSearchParams(realForm).toString());
}

function escapeHTML(text) {
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	
	return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}