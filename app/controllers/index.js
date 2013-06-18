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

var mode = 1;		// 0=fixed number, 1=minute, 2=2minutes etc
var data = [];
var sampleSize = 7;
var count = 0;
var timer = null;

/*
 * Init
 */
$.init = function() {
	$.setMode();

	$.lungs.addEventListener('click', function(e) {
		var matrix = Ti.UI.create2DMatrix()
  		matrix = matrix.scale(1.5, 1.5);
  		var ani = Ti.UI.createAnimation({
    		transform : matrix,
    		duration : 400,
    		autoreverse : true,
  		});
  		$.lungs.animate(ani);

  		data.push( Date.now().valueOf() );
  		Ti.API.info( "Push timestamp: " + data[data.length-1]);

  		if(0 === mode) {
			count++;
  			$.progress.value = count;
  			if (count >= sampleSize) {
  				$.finalCalcFixedBreathsSample();
  			}
  		}
  		else {
  			// Start a timer one the first press
  			if(0 === count) {
  				timer = setInterval(function(){
  					count++;
  					$.progress.value = count;
  					if (mode*60 === count) {
  						$.finalCalcTimed();
  					}
  				},1000);
  			}
  		}
	});

	$.mode.addEventListener("click",function(e){
		$.dlgMode.show();
	});

	$.dlgMode.addEventListener("click",function(e){
		Ti.API.info("Option index = " + e.index);
		//Ti.API.info("Cancel index = " + $.dlgMode.cancel);
		if(e.index != $.dlgMode.cancel) {
			mode = e.index;
			$.setMode();
		}
	});

	$.resetbut.addEventListener("click",function(e){
		count = 0;
		data = [];
  		$.progress.value = 0;

		$.lungs.opacity = 1.0;
		$.rr.visible = false;
		$.resetbut.visible = false;
		$.progress.visible = true;
		$.usage.visible = true;
	});

	$.MainWindow.open();
}

/*
 * This calculates the RR based on a fixed number of breaths sample size
 Questions:
 Do we count the breath in the calculation, or does this just mark the start of
 sampling
 */
$.finalCalcFixedBreathsSample = function() {
	var timeElapsed = data[data.length-1] - data[0];
	Ti.API.info("Elapsed time: " + timeElapsed);
	Ti.API.info("data lenght " + data.length);
	var rr = data.length / (timeElapsed / 60000);

	$.rr.text = "Respiratory rate\n" + Math.round(rr) + " breaths / min";
	$.setUI2Results();
}

$.finalCalcTimed = function() {
	clearInterval(timer);
	timer = null;

	$.rr.text = "Respiratory rate\n" + Math.round( data.length / mode )  + " breaths / min";
	$.setUI2Results();
}

$.setUI2Results = function() {
	$.lungs.opacity = 0.4;
	$.rr.visible = true;
	$.resetbut.visible = true;
	$.progress.visible = false;
	$.usage.visible = false;
}

$.setMode = function() {
	$.progress.max = (0 === mode) ? sampleSize : 60 * mode;

	if(0===mode) {
		$.mode_lbl.text = "Mode: Sample 7 breaths";
	}
	else {
		$.mode_lbl.text = "Mode: Sample over "+ mode +" min(s)";
	}
}
/*
 *
 */
$.init();
