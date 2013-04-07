let {classes:Cc,interfaces:Ci,utils:Cu,results:Cr} = Components, prefCount,prefData, Branch;

function init() {
	Branch = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('extensions.dybutar.');
	try {
		prefCount = Branch.getIntPref('prefcount');
	} catch (e) {
		Branch.setIntPref('prefcount', prefCount = 13);
	}
	
	try {
		prefData = Branch.getCharPref('prefdata');
	} catch (e) {
		Branch.setCharPref('prefdata', prefData = '{}');
	}
	prefData = JSON.parse(prefData);
	
	let rows = document.getElementById('rows');
	for (let i = 0; i < prefCount; ++i) {
		
		let row = document.createElement('row'),
		textbox = function (n) {
			let tb = document.createElement('textbox');
			tb.setAttribute('flex', '1');
			tb.setAttribute('id', 'dybut' + i + 'n' + n);
			tb.setAttribute('value', prefData[i] && prefData[i][n] || '');
			row.appendChild(tb);
		};
		
		textbox(0);
		textbox(1);
		textbox(2);
		row.setAttribute('align', 'baseline');
		rows.appendChild(row);
	}
	
	document.documentElement.style.setProperty('min-width', '640px', 'important');
	window.sizeToContent();
}
function exit() {
	let pd = {};
	for (let i = 0; i < prefCount; ++i) {
		let data = [],
		push = function (n) {
			let v = document.getElementById('dybut' + i + 'n' + n).value;
			data.push(v || '');
		};
		
		push(0);
		push(1);
		push(2);
		if (('' + data).length > 2)
			pd[i] = data;
	}
	
	Branch.setCharPref('prefdata', JSON.stringify(pd));
}
