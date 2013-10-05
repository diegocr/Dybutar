Dybutar Mozilla Firefox Extension
---------------------------------

I'm personally tired of those bloated add-ons which serves no purpose other than providing just a bookmark-style button on the add-ons toolbar. I think the least to say is that these just causes an unnecessary Firefox startup overload if you have a few of them.

So, this restartless and lightweight add-on (4KB code, 8KB package) should make things nicer for those of you who like to use them.

This add-on provides a preferences window where you can define a URL, Image, and Toolbar ID - being the two later optional. If no image is specified the website's favicon will be used instead.

###➜ FAQ ✓###

__Q: What is supposed to be in "ToolBar ID"?__

A: Some string representing a DOM Node ID, such as nav-bar (default), PersonalToolbar, TabsToolbar, or addon-bar


__Q: Reinstalled the add-on and the buttons are missing, even though they show up on the options.__

A: Most likely they are gone at the [Customize Panel](https://support.mozilla.org/en-US/kb/customize-firefox-controls-buttons-and-toolbars#w_how-do-i-customize-or-rearrange-toolbar-items)


__Q: My button isn't being created!__

A: Probably you didn't specified a proper URL (ie, something which contains "://")


__Q: Couldn't make it work.  all I got was a blank icon.__

A: Either you didn't provided an image and the site does not have a proper favicon, or the image you've provided isn't valid - try to specify a[nother] image.

___
_AMO Listing page: <https://addons.mozilla.org/addon/dybutar/>_
