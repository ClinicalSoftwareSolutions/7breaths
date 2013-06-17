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

var data = [];
var sampleSize = 7;
var sampleCount = 0;

$.init = function() {
	$.progress.max = sampleSize;
	$.resetbut.visible = false;

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

  		sampleCount++;
  		$.progress.value = sampleCount;

  		if (sampleCount >= sampleSize) {
  			$.finalCalcFixedBreathsSample();
  		}
	});

	$.resetbut.addEventListener("click",function(e){
		sampleCount = 0;
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

	$.rr.text = "Respiratory rate\n" + Math.round(rr);
	$.lungs.opacity = 0.4;
	$.rr.visible = true;
	$.resetbut.visible = true;
	$.progress.visible = false;
	$.usage.visible = false;
}

$.init();
