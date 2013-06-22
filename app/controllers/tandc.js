/*
    7Breaths
    An application to simplify the clinical measurement of a person's respiratory rate
   Copyright (C) 2013  Neville Dastur neville [at] clinsoftsolutions.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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

    $.ScrollWrapper.addEventListener("scroll",function(_event) {
        Ti.API.info("Scroll x="+_event.x+" y="+_event.y);
    });
}

$.init();