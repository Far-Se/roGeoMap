const path = require('path');
const csv = require('csvtojson');
var fs = require('fs');

const ALEGERI = 'data/primari';
const Locul2 = false;

const culoriPartide = JSON.parse(fs.readFileSync('partide.json', 'utf8'));
var mapData = JSON.parse(fs.readFileSync('map/comune.geojson', 'utf8'));
let nameLocalities = {};
Object.entries(mapData.features).forEach(entry => {
	const [key, value] = entry;

	value.properties.county = value.properties.county.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	value.properties.name = value.properties.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	const name = value.properties.county.toUpperCase() + ': ' + value.properties.name.toUpperCase();
	nameLocalities[name] = key;
	mapData.features[key].properties.fill = '#ffffff';
	mapData.features[key].properties['stroke-width'] = '0';
	mapData.features[key].properties['stroke'] = '#ffffff';
});
const directoryPath = path.join(__dirname, ALEGERI);
fs.readdir(directoryPath, function(err, files) {
	if (err) {
		return console.log('Unable to scan directory: ' + err);
	}
	let i = 1;
	let finished = 0;
	files.forEach(function(file) {
		if (i == 1) {
			csv().fromFile(`${ALEGERI}/${file}`).then((data) => {

				data.forEach(results => {
					let electionResults = {};
					let countyName = "",
						uatName = "";
					try {
						if (results.hasOwnProperty('precinct_county_name')) countyName = results.precinct_county_name;
						else countyName = results.county_name;
						uatName = results.uat_name;
						countyName = countyName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
						uatName = uatName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
						countyName = countyName.replace(/(MUNICIPIUL|ORAS) /g, '');
						uatName = uatName.replace(/(MUNICIPIUL|ORAS) /g, '');
					} catch {}
					electionResults = [];
					let electionProperties = [];
					let voturiTotal = 0;
					if (~ALEGERI.indexOf('consiliu')) {
						for (const [key, value] of Object.entries(results)) {
							if (~key.indexOf('-voturi') && value > 1) {
								let info = key.replace('-voturi', '');
								electionResults.push({
									"partid": info,
									"voturi": 1 * value,
								});
								voturiTotal += 1 * value;
							}
						}
					} else {
						for (const [key, value] of Object.entries(results)) {
							if (~key.indexOf('-voturi') && value > 1) {
								let info = key.match(/([A-Z].*?)-((PAR|ALI|UNIU).*?)-voturi/);
								if (info === null)
									info = [0, 'Independent', key.replace('-voturi', ' (INDEPENDENT)')]
								electionResults.push({
									"partid": info[2],
									"voturi": 1 * value,
									"candidat": info[1]
								});
								voturiTotal += 1 * value;
							}
						}
					}
					let winner = "";
					if (electionResults.length) {
						electionResults.sort(function(x, y) {
							return y.voturi - x.voturi;
						});
						if (Locul2 && electionResults.length > 1)
							winner = electionResults[1].partid;
						else
							winner = electionResults[0].partid;
					}
					if (Locul2)
						electionProperties["Locul 2"] = winner;
					else
						electionProperties["Castigator"] = winner;
					electionProperties["Total Voturi"] = voturiTotal.toLocaleString('en-US', {
						maximumFractionDigits: 2
					});
					electionResults.forEach(e => {
						procent = e.voturi / voturiTotal * 100;
						procent = procent.toFixed(2);
						if (~ALEGERI.indexOf('consiliu'))
							electionProperties[e.partid] = `${e.voturi.toLocaleString('en-US', {maximumFractionDigits:2})} (${procent}%)`;
						else
							electionProperties[e.partid] = `${e.voturi.toLocaleString('en-US', {maximumFractionDigits:2})} (${e.candidat}) ${procent}%`;
					})
					winner = winner.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
					electionProperties['fill-opacity'] = 0.5;
					electionProperties['stroke-width'] = 0.2;
					electionProperties['stroke'] = '#3C4043';

					culoriPartide.forEach((partid) => {
						let re = new RegExp(partid.match, "i");
						if (re.test(winner)) {
							electionProperties = {
								...electionProperties,
								...partid.properties
							};
						}
					})
					const cNameAUX = `${countyName}: ${uatName}`;
					if (cNameAUX in nameLocalities) {
						mapData.features[nameLocalities[cNameAUX]].properties = Object.assign(mapData.features[nameLocalities[cNameAUX]].properties, electionProperties);
					} else console.log(`Missing: ${cNameAUX}`);

				});
			}).then(() => {
				finished++;
			})
		}
	});
	let e = setInterval(() => {
			if (finished == files.length) {
                finished++;
                if(Locul2)
                fs.writeFile('output/' + ALEGERI.replace('data/', '') + '_2.geojson', JSON.stringify(mapData), 'utf8', () => {});
                else
				fs.writeFile('output/' + ALEGERI.replace('data/', '') + '.geojson', JSON.stringify(mapData), 'utf8', () => {});
				console.log("DONE");
				clearInterval(e);
			}
		},
		1000);
});