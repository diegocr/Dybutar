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

let {classes:Cc,interfaces:Ci,utils:Cu,results:Cr} = Components,addon;
Cu.import("resource://gre/modules/Services.jsm");

function LOG(m) (m = addon.name + ' Message @ '
	+ (new Date()).toISOString() + "\n> " + m,
		dump(m + "\n"), Services.console.logStringMessage(m));

let ia = Services.appinfo.ID[3],
	wt = 5==ia?'mail:3pane'
		:'navigator:browser';

let i$ = {
	get Window() Services.wm.getMostRecentWindow(wt),
	
	onOpenWindow: function(aWindow) {
		let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
		loadIntoWindowStub(domWindow);
	},
	wmf: function(callback) {
		let windows = Services.wm.getEnumerator(wt);
		while(windows.hasMoreElements())
			callback(windows.getNext()
				.QueryInterface(Ci.nsIDOMWindow));
	},
	tcsf: function(aWindow,aCallB) {
		[].some.call(aWindow.document.querySelectorAll("toolbar[currentset]"),
			function(tb) aCallB(tb,tb.getAttribute("currentset").split(",")));
	},
	onCloseWindow: function() {},
	onWindowTitleChange: function() {}
};

function loadIntoWindow(window) {
	if(wt!=window.document.documentElement.getAttribute("windowtype"))
		return;
	
	try {
		let prefData = JSON.parse(addon.branch.getPrefType('prefdata')
			&& addon.branch.getCharPref('prefdata') || '{}');
		
		for each(let p in prefData) {
			let u = '' + p[0];
			if(~u.indexOf('://') || /^about:/.test(u)) {
				try {
					addButton(window,p);
				} catch(e) {
					Cu.reportError(e);
				}
			}
		}
	} catch(e) {
		Cu.reportError(e);
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
	
	let gNavToolbox = window.gNavToolbox || $('mail-toolbox');
	if(gNavToolbox && gNavToolbox.palette) {
		let m = addon.tag+'-toolbar-button-'+uri.spec.replace(/[^\w]/g,'');
		gNavToolbox.palette.appendChild(e('toolbarbutton',{
			id:m,
			label:~uri.spec.indexOf('://') ? uri.host:uri.spec,
			class:'toolbarbutton-1 '+addon.tag+'-toolbar-button',
			tooltiptext:addon.name+': '+uri.spec,
			image:o[1]||uri.prePath+'/favicon.ico'
		})).addEventListener('click', function(e) {
				if(uri.scheme === 'chrome') {
					window.openDialog(uri.spec, uri.host, 'chrome,titlebar,toolbar,centerscreen');
					return;
				}
				// Sorry Zulkarnain, found this to be best suitable.
				window.openUILink(uri.spec,e,{
					inBackground: Services.prefs
						.getBoolPref('browser.tabs.loadInBackground'),
					relatedToCurrent: true});
		}, false);
		
		let butPos = o[2] || 'nav-bar', prevPos, bID = o[0].replace(/[^\w]/g,'');
		
		try {
			prevPos = addon.branch.getCharPref(bID);
		} catch(e) {}
		
		if(prevPos !== butPos) {
			let nBar = $(butPos) || $('mail-bar3');
			if(nBar) {
				nBar.insertItem(m, null, null, false);
				nBar.setAttribute("currentset", nBar.currentSet);
				window.document.persist(nBar.id, "currentset");
				nBar.collapsed = false;
			}
			addon.branch.setCharPref(bID,butPos);
		} else {
			i$.tcsf(window,function(tb,cs) {
				let bp = cs.indexOf(m) + 1;
				
				if(bp) {
					let at = null, f = [],
					xul={spacer:1,spring:1,separator:1};
					cs.splice(bp).some(function(id)
						(at=$(id))?!0:(f.push(id),!1));
					at&&f.length&&f.forEach(function(n)xul[n]
						&&(at=at&&at.previousElementSibling));
					tb.insertItem(m, at, null, false);
					return true;
				}
			});
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
	let gNavToolbox = window.gNavToolbox
		|| window.document.getElementById('mail-toolbox');
	
	[window.document,gNavToolbox && gNavToolbox.palette].forEach(function(n) {
		
		if(!n) return;
		[].forEach.call(n.querySelectorAll('[id^="dybutar-"]'),function(n) {
			n.parentNode.removeChild(n);
		});
	});
}

function setupWindows(cb) {
	i$.wmf(function(aWindow) {
		if(cb) cb(aWindow);
		loadIntoWindowStub(aWindow);
	});
}

function branchObserver(s,t,d) {
	if(d == 'prefdata')
		setupWindows(unloadFromWindow);
}

function startup(data) {
	let tmp = {};
	Cu.import("resource://gre/modules/AddonManager.jsm", tmp);
	tmp.AddonManager.getAddonByID(data.id,function(data) {
		addon = {
			id: data.id,
			name: data.name,
			version: data.version,
			tag: data.name.toLowerCase().replace(/[^\w]/g,''),
		};
		addon.branch = Services.prefs.getBranch('extensions.'+addon.tag+'.');
		addon.branch.addObserver("",branchObserver,false);
		setupWindows();
		Services.wm.addListener(i$);
	});
}

function shutdown(aData, aReason) {
LOG(aReason);
	if(aReason == APP_SHUTDOWN)
		return;
	
	addon.branch.removeObserver("",branchObserver,false);
	Services.wm.removeListener(i$);
	i$.wmf(unloadFromWindow);
	LOG('shutdown');
	if(aReason == ADDON_UNINSTALL) {
		LOG('uninstall');
		
	}
}

function uninstall(aData, aReason) {
	if(ADDON_UNINSTALL == aReason) {
		i$.wmf(function(aWindow) {
			i$.tcsf(aWindow,function(tb,cs) {
				tb.setAttribute("currentset",
					tb.currentSet =
					cs.filter(function(n)
						!/^dybutar-/.test(n)).join(","));
				aWindow.document.persist(tb.id, "currentset");
			});
		});
	}
}
function install(aData, aReason) {}
