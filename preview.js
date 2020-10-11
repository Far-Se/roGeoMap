window.partideColors = {};
window.partySelected = -1;
fetch("partide.json")
	.then(response => response.json())
	.then(json => {
		let legend = document.getElementById('legend');
		window.partide = json;
		json.forEach((e, key) => {
			window.partideColors[e.properties.fill] = 0; //e.match;
			legend.insertAdjacentHTML('beforeend', `
    <div style="background: ${e.properties.fill};" data-partid="${key}"><span>${e.match}</span></div>
    `)
		})
	}).then(function() {

		let els = document.querySelectorAll('#legend div');
		for (i = 0; i < els.length; i++) {
			els[i].addEventListener('click', function() {
				let party = 1 * this.getAttribute('data-partid');

				if (window.partySelected == party) window.partySelected = -2;
				else window.partySelected = party;
				window.reparseData();
			});
		}
	});

const urlParams = new URLSearchParams(window.location.search);
let election = urlParams.get('file');
if (!election) election = 'primari';
document.querySelector('#elections [value="' + election + '"]').selected = true;

document.getElementById('elections').onchange = function() {
	let e = document.getElementById('elections');
	const val = e.options[e.selectedIndex].value;
	window.location = `index.html?file=${val}`;
}
document.getElementById('collapse').onclick = function() {
	document.getElementById('legend').classList.toggle('hide');
	document.getElementById('ascunde').classList.toggle('hide');
	document.getElementById('arata').classList.toggle('hide');
}
let isLight = true;
document.getElementById('darkMode').onclick = function() {
	if (isLight) {
		document.getElementById('darkMode').innerText = '🌙';
		isLight = false;
		darkTile.addTo(map);
		lightTile.removeFrom(map);
	} else {
		document.getElementById('darkMode').innerText = '🔆';
		isLight = true;
		lightTile.addTo(map);
		darkTile.removeFrom(map);
	}
}

var map = L.map('map').setView([45.9628666, 25.2081763], 7.4);
window.map = map;
let lightTile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmFyc2UiLCJhIjoiY2tnM3JnOHJtMGRnNzMzcDQ2a3dldHpyYiJ9.cdOn_RRX1YoMWUmoR6i36A', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/light-v9',
	tileSize: 512,
	zoomOffset: -1
});
let darkTile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmFyc2UiLCJhIjoiY2tnM3JnOHJtMGRnNzMzcDQ2a3dldHpyYiJ9.cdOn_RRX1YoMWUmoR6i36A', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/dark-v9',
	tileSize: 512,
	zoomOffset: -1
});
lightTile.addTo(map);
lightTile.addTo(map);

function onEachFeature(feature, layer) {
	let style = "",
		castigator = feature.properties.Castigator;
	if (!feature.properties.hasOwnProperty('Castigator')) {
		castigator = feature.properties['Locul 2'];
		feature.properties.Castigator = feature.properties['Locul 2'];
	}
	if (!castigator) castigator = '-';
	//console.log(feature.properties);
	castigator = castigator.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	window.partide.forEach((partid) => {
		let re = new RegExp(partid.match, "i");
		if (re.test(castigator)) {
			style = "background:" + partid.properties.fill;
		}
	})
	var popupContent = '';
	if (feature.properties['Locul 2']) popupContent = `
        <h1>${feature.properties.county} : ${feature.properties.name}</h1>
        <h2 style="${style}" class="winner">Locul 2: ${feature.properties.Castigator}</h2>
        `;
	else
		popupContent = `
        <h1>${feature.properties.county} : ${feature.properties.name}</h1>
        <h2 style="${style}"  class="winner">Castigator: ${feature.properties.Castigator}</h2>
        `;
	if (feature.properties['Total Voturi'])
		popupContent += `
    <h3 style="${style}">Total Voturi: ${feature.properties['Total Voturi']}</h3>`;
	let data = {
		...feature.properties
	};
	delete data.Castigator;
	delete data.county;
	delete data.name;
	delete data['Total Voturi'];
	Object.entries(data).forEach(e => {
		let [key, value] = e;
		if (key.match(/^[A-Z]/)) {
			key = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
			style = "";
			window.partide.forEach((partid) => {
				let re = new RegExp(partid.match, "i");
				if (re.test(key)) {
					style = "background:" + partid.properties.fill;
				}
			})
			//console.log(value);
			if (value instanceof String) {
				let dateCandidat = value.match(/(.*?) \((.*?)\) (.*?\%)/);
				let candidatHTML = ''
				if (dateCandidat) {
					candidatHTML = `<div class="info">${key}: ${dateCandidat[3]} ${dateCandidat[2]} (${dateCandidat[1]})</div> `
				} else
					candidatHTML = `<div class="info">${key}: ${value}</div>`;
				popupContent += `<div class="candidat" style="${style}">${candidatHTML}</div>`;
			} else popupContent += `<div class="candidat" style="${style}"><div class="info">${key}: ${value} voturi</div></div>`;
		}
	})

	// "<p>" + JSON.stringify(feature.properties, null, 4).replace(/\n/g, '<br>') + "</p>";

	if (feature.properties && feature.properties.popupContent) {
		popupContent += feature.properties.popupContent;
	}
	var popup = L.popup({
			maxWidth: 700,
			maxHeight: 800
		})
		.setContent(popupContent);
	layer.bindPopup(popup);
}
let geoJSON = null;
window.reparseData = () => {
	fetch('output/' + election + '.geojson')
		.then(response => response.json())
		.then(async data => {
			if (geoJSON) geoJSON.removeFrom(map);
			geoJSON = await L.geoJSON(data, {

				style: function(feature) {
                    feature.properties.stroke = "#000000";
					if (window.partideColors.hasOwnProperty(feature.properties.fill)) window.partideColors[feature.properties.fill]++;
					if (window.partySelected > -1) {

                        let re = new RegExp(window.partide[window.partySelected].match, "i");
                        let hasParty = 0;
                        
						Object.entries(feature.properties).forEach(e => {
							let [key, val] = e;
							if (typeof key === "string") {
                                //console.log(key);
								key = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

								if (re.test(key)) hasParty = 1;
							}
						})
                        window.loop ++;
                        if (!hasParty)
                        {
                            feature.properties.fill = "#ffffff";
                        }
						if (feature.properties.hasOwnProperty('Castigator')) {
                            let castigator = feature.properties.Castigator.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            if (!re.test(castigator)) 
                            {
                                feature.properties['fill-opacity'] = -0.1;
                                feature.properties.color = "#CAD2D3"
                            }
                            else
                            feature.properties['stroke-width'] = 2;
						}

					}
					return {
						fillColor: feature.properties.fill,
						weight: feature.properties['stroke-width'],
						color: feature.properties.stroke,
						fillOpacity: 1 * feature.properties['fill-opacity'] + 0.3,
					}
				},
				onEachFeature: onEachFeature,
			});
			geoJSON.addTo(map);
			if (window.partySelected != -2 && window.partySelected< 0)
				window.partide.forEach(e => {
					let el = document.querySelector(`#legend div[style="background: ${e.properties.fill};"]`);
					if (el) el.innerHTML = `<span>${e.match}: ${window.partideColors[e.properties.fill]} primarii</span>`;
				});
		});
}
window.reparseData();