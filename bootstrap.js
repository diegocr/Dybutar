/* ***** BEGIN LICENSE BLOCK *****
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/
 * 
 * Contributor(s):
 *   Diego Casorran <dcasorran@gmail.com> (Original Author)
 *   Zulkarnain K. (Better click handling)
 * 
 * ***** END LICENSE BLOCK ***** */

let {classes:Cc,interfaces:Ci,utils:Cu,results:Cr} = Components,addon,
	{ btoa, atob } = Cu.import("resource://gre/modules/Services.jsm");

function rsc(n) 'resource://' + addon.tag + '/' + n;
function LOG(m) (m = addon.name + ' Message @ '
	+ (new Date()).toISOString() + "\n> " + m,
		dump(m + "\n"), Services.console.logStringMessage(m));

let i$ = {
	get Window() Services.wm.getMostRecentWindow('navigator:browser'),
	
	onOpenWindow: function(aWindow) {
		let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
		loadIntoWindowStub(domWindow);
	},
	onCloseWindow: function() {},
	onWindowTitleChange: function() {}
};

(function(global) global.loadSubScript = function(file,scope)
	Services.scriptloader.loadSubScript(file,scope||global))(this);

function getBrowser(w) {
	
	try {
		return w.getBrowser();
	} catch(e) {
		return w.gBrowser;
	}
}

function loadIntoWindow(window) {
	if(!(/^chrome:\/\/(browser|navigator)\/content\/\1\.xul$/.test(window&&window.location)))
		return;
	
	try {
		let prefData = JSON.parse(addon.branch.getCharPref('prefdata') || '{}');
		
		for each(let p in prefData) {
			if(~(p[0] || '').indexOf('://'))
				addButton(window,p);
		}
		
	} catch(e) {
		LOG(e);
	}
}
function addButton(window,o) {
	function c(n) window.document.createElement(n);
	function $(n) window.document.getElementById(n);
	function e(e,a) {
		if((e=c(e))&&a)
			for(let x in a)e.setAttribute(x,e[x] = a[x]);
		return e;
	}
	
	let uri = Services.io.newURI(o[0],null,null);
	
	let gNavToolbox = window.gNavToolbox || $('navigator-toolbox');
	if(gNavToolbox && gNavToolbox.palette.id == 'BrowserToolbarPalette') {
		let m = addon.tag+'-toolbar-button-'+uri.spec.replace(/[^\w]/g,'');
		gNavToolbox.palette.appendChild(e('toolbarbutton',{
			id:m,
			label:uri.host,class:'toolbarbutton-1 '+addon.tag+'-toolbar-button',
			tooltiptext:addon.name+': '+uri.spec,
			image:o[1]||uri.prePath+'/favicon.ico'
		})).addEventListener('click', function(e) {
				if(uri.scheme === 'chrome') {
					window.openDialog(uri.spec, uri.host, 'chrome,titlebar,toolbar,centerscreen');
					return;
				}
				switch(e.button) {
					case 0:
						if (!(e.ctrlKey || e.metaKey)) {
							// load in current tab
							window.loadURI(uri.spec);
							break;
						}
					case 1:
						// Load in background tab depends on its preference
						let backgroundTab = Services.prefs.getBoolPref('browser.tabs.loadBookmarksInBackground');
						getBrowser(window).loadOneTab(uri.spec,null,null,null,backgroundTab,true);
				}
		}, false);
		
		let butPos = o[2] || 'nav-bar', prevPos, bID = o[0].replace(/[^\w]/g,'');
		
		try {
			prevPos = addon.branch.getCharPref(bID);
		} catch(e) {}
		
		if(prevPos !== butPos) {
			let nBar = $(butPos);
			if(nBar) {
				nBar.insertItem(m, null, null, false);
				nBar.setAttribute("currentset", nBar.currentSet);
				window.document.persist('nav-bar', "currentset");
			}
			addon.branch.setCharPref(bID,butPos);
		} else {
			for each(let toolbar in window.document.querySelectorAll("toolbar[currentset]")) try {
				let cSet = toolbar.getAttribute("currentset") || '';
				if(cSet.split(",").some(function(x) x == m, this)) {
					toolbar.currentSet = cSet;
					window.BrowserToolboxCustomizeDone(true);
					break;
				}
			} catch(e) {}
		}
	}
}

function loadIntoWindowStub(domWindow) {
	
	if(domWindow.document.readyState == "complete") {
		loadIntoWindow(domWindow);
	} else {
		domWindow.addEventListener("load", function() {
			domWindow.removeEventListener("load", arguments.callee, false);
			loadIntoWindow(domWindow);
		}, false);
	}
}

function unloadFromWindow(window) {
	
	[].forEach.call(window.document.querySelectorAll('.'+addon.tag+'-toolbar-button'),function(btn){
		btn.parentNode.removeChild(btn);
	});
}

function setupWindows(cb) {
	let windows = Services.wm.getEnumerator("navigator:browser");
	while(windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		if(cb) cb(domWindow);
		loadIntoWindowStub(domWindow);
	}
}

function branchObserver(s,t,d) {
	if(d == 'prefdata')
		setupWindows(unloadFromWindow);
}

function setup(data) {
	
	let io = Services.io;
	
	addon = {
		id: data.id,
		name: data.name,
		version: data.version,
		tag: data.name.toLowerCase().replace(/[^\w]/g,''),
	};
	
	addon.branch = Services.prefs.getBranch('extensions.'+addon.tag+'.');
	addon.branch.addObserver("",branchObserver,false);
	
/* 	io.getProtocolHandler("resource")
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(addon.tag,
			io.newURI(__SCRIPT_URI_SPEC__+'/../',null,null));
	 */
	setupWindows();
	Services.wm.addListener(i$);
	io = null;
}

function startup(data) {
	let tmp = {};
	Cu.import("resource://gre/modules/AddonManager.jsm", tmp);
	tmp.AddonManager.getAddonByID(data.id,setup);
}

function shutdown(data, reason) {
	if(reason == APP_SHUTDOWN)
		return;
	
	addon.branch.removeObserver("",branchObserver,false);
	Services.wm.removeListener(i$);
	
	let windows = Services.wm.getEnumerator("navigator:browser");
	while(windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		unloadFromWindow(domWindow);
	}
	
/* 	Services.io.getProtocolHandler("resource")
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(addon.tag,null); */
}

function install(data, reason) {}
function uninstall(data, reason) {}
