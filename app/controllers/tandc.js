var APP = Alloy.Globals.APP;

if(OS_ANDROID){
    Alloy = require("alloy")
    _ = require("alloy/underscore")._
}

var ARGS = arguments[0] || {};

$.init = function() {
    var htmlfile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/tandc.html");
    var html = htmlfile.read().text;
    $.styledlabel.html = html;

    Ti.App.addEventListener("androidback" , function() {
        // TODO don't allow close unless ok or cancel selected, i.e. prevent normal back button behavior
        //this.close();
    });

    $.ScrollWrapper.addEventListener(scroll,function(_event) {
        Ti.API.info("Scroll x="+_event.x+" y="+_event.y);
    });
}

$.init();