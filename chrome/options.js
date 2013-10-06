/* ***** BEGIN LICENSE BLOCK *****
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/
 * 
 * Contributor(s):
 *   Diego Casorran <dcasorran@gmail.com> (Original Author)
 * 
 * ***** END LICENSE BLOCK ***** */

let {classes:Cc,interfaces:Ci,utils:Cu,results:Cr} = Components, prefCount,prefData, Branch;

Cu.import('resource://dybutar/icons.jsm');

function onPopupShown(ev) {
	let obj = ev.target,
		mpo = ev.originalTarget;
	
	if(obj.nodeName !== 'textbox' || !obj.id)
		return;
	
	let c = mpo.childNodes, l = c.length, n = [];
	while(l--) {
		if(/^dybutar-/.test(c[l].id))
			n.push(c[l]);
	}
	n.forEach(mpo.removeChild.bind(mpo));
	n = document.createElement('menuseparator');
	n.id = 'dybutar-sep';
	mpo.appendChild(n);
	
	mpo.style.setProperty('max-height','480px','important');
	
	let onCommand = function(ev) {
		obj.value = ev.target.label.replace(' ','-','g');
	};
	n = parseInt(obj.id[obj.id.length - 1]);
	
	if(n == 1) {
		Object.keys(IconSet).forEach(function(i) {
			
			let m = document.createElement('menuitem');
			
			m.setAttribute('label',i.replace('-',' ','g'));
			m.setAttribute('id','dybutar-icon-'+i);
			m.setAttribute('class','menuitem-iconic');
			m.setAttribute('image','resource://dybutar/icons/'+i+'.png');
			m.addEventListener('command',onCommand,false);
			
			mpo.appendChild(m);
		});
	} else if(2 == n) {
		
		let { Services } = Cu.import("resource://gre/modules/Services.jsm",{});
		
		let wnd = Services.wm.getMostRecentWindow(SharedData.wt), ids = [];
		[].forEach.call(wnd.document.querySelectorAll("toolbar[currentset]"),
			function(tb) ids.push(tb.id));
		
		ids.map(String.trim).filter(String).forEach(function(i) {
			
			let m = document.createElement('menuitem');
			
			m.setAttribute('label',i);
			m.setAttribute('id','dybutar-tbs-'+i);
			m.addEventListener('command',onCommand,false);
			
			mpo.appendChild(m);
		});
	}
	
}

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
	
	window.addEventListener('popupshown',onPopupShown, false);
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
	window.removeEventListener('popupshown',onPopupShown, false);
}
