window.appid = '5tI4cjH3viCmbOcy37Fu';
window.apikey = 'zXCxO5eyMkSkaf_LgzkaPYmSwWkyikXfSVxqOmadCVo';
window.ii = 0;

function hexToRgbA(hex, opacity = 1) {
	var c;
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length == 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c = '0x' + c.join('');
		return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
	}
	throw new Error('Bad Hex');
}
const urlParams = new URLSearchParams(window.location.search);
let election = urlParams.get('file');
if(!election) election = 'primari';
function showGeoJSONData(map) {
	var reader = new H.data.geojson.Reader('output/' + election + '.geojson', {
		style: function(mapObject) {
			if (window.ii == 0)
				console.log(mapObject);
			window.ii = 1;
			if (mapObject instanceof H.map.Polygon) {
				mapObject.setStyle({
					fillColor: hexToRgbA(mapObject.data.properties.fill, mapObject.data.properties['fill-opacity'] + 0.2),
					strokeColor: hexToRgbA(mapObject.data.properties.stroke, 1), //mapObject.data.properties['stroke-opacity']),
					lineWidth: 1 //mapObject.data.properties['stroke-width']
				});
				let mData = mapObject.data.properties;
				delete mData['fill'];
				delete mData['fill-opacity'];
				delete mData['stroke'];
				delete mData['stroke-width'];
				mapObject.setData(mapObject.data.properties);
				mapObject.addEventListener('pointerup', logEvent);
			}
		}
	});
	reader.parse();
	map.addLayer(reader.getLayer());
}
let prevElement = {};

function logEvent(e) {
	if (prevElement.hasOwnProperty('target'))
		prevElement.target.setStyle({
			fillColor: prevElement.fillColor
		});
	prevElement.target = e.target;
	prevElement.fillColor = e.target.getStyle().fillColor;
	console.log(e.target.getStyle());
	e.target.setStyle({
		fillColor: '#87b2bc9c'
	});
	console.log(e.target.getData());
	const data = {
		...e.target.getData()
	};

	let style = "";
	data.Castigator = data.Castigator.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	window.partide.forEach((partid) => {
		let re = new RegExp(partid.match, "i");
		if (re.test(data.Castigator)) {
			style = "background:" + partid.properties.fill;
		}
	})
	let html = `
    <a href="#" onclick="this.parentElement.innerHTML=''">❌</a>
    <h1>${data.county}: ${data.name}</h1>
    <h2 style="${style}"><span>Castigator:${data.Castigator}</span></h2>
    `;
	style = "";
	delete data.Castigator;
	delete data.county;
	delete data.name;
	Object.entries(data).forEach(e => {
		let [key, value] = e;
		key = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		style = "";
		window.partide.forEach((partid) => {
			let re = new RegExp(partid.match, "i");
			if (re.test(key)) {
				style = "background:" + partid.properties.fill;
			}
		})
		html += `<h3 style="${style}"><span>${key}: ${value}</span></h3>`;
	})
	document.getElementById('result').innerHTML = html;
}
var platform = new H.service.Platform({
	apikey: window.apikey
});
var defaultLayers = platform.createDefaultLayers();

var mapLayer = new H.map.layer.TileLayer({
    name: 'Img Layer',
    min: 1,
    max: 20,
    provider: new H.map.provider.TileProvider({
        url: 'https://{SUBDOMAIN_INT_1_4}.base.maps.api.here.com/maptile/2.1/maptile/newest/reduced.day/{LEVEL}/{COL}/{ROW}/256/png8?app_id=' + window.appid + '&token=' + window.apikey + '&lg=/eng'
    })
});

var map = new H.Map(document.getElementById('map'), defaultLayers.vector.normal.map, {
	zoom: 7,
	center: {
		lat: 45.9490366,
		lng: 24.1725178
	},
    pixelRatio: window.devicePixelRatio || 1,
    layers: [mapLayer]
});

window.addEventListener('resize', () => map.getViewPort().resize());

var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

var ui = H.ui.UI.createDefault(map, defaultLayers);

document.addEventListener('DOMContentLoaded', function() {
	if (!election) election = 'primari';
	document.getElementById('elections').value = election;
	showGeoJSONData(map);
}, false);

fetch("partide.json")
	.then(response => response.json())
	.then(json => {
		let legend = document.getElementById('legend');
		window.partide = json;
		json.forEach(e => {
			legend.insertAdjacentHTML('beforeend', `
        <div style="background: ${e.properties.fill};"><span>${e.match}</div>
        `)
		})
	});

document.getElementById('collapse').onclick = function() {
	document.getElementById('collapse').innerText = 'Arata 🔼';
	document.getElementById('legend').classList.toggle('hide')
	if (document.getElementById('legend').classList.contains('hide'))

		document.getElementById('collapse').innerText = 'Arata 🔼';
	else
		document.getElementById('collapse').innerText = 'Ascunde 🔽';
}
document.getElementById('elections').onchange = function() {
	let e = document.getElementById('elections');
	const val = e.options[e.selectedIndex].value;
	window.location = `index.html?file=${val}`;
}