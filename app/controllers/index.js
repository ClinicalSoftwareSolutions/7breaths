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

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
	INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
	PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
	FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
*/

var APP = Alloy.Globals.APP;

if(OS_ANDROID){
    Alloy = require("alloy")
    _ = require("alloy/underscore")._
}

var mode = 1;		// 0=fixed number, 1=minute, 2=2minutes etc
var data = [];
var sampleSize = 7;
var count = 0;
var timer = null;

$.dlgConfirmSend = null;

// Include the StackMob stuff
Ti.include('/stackmob.cfg.js');
StackMob = require('ti.stackmob')({ publicKey : stackmob_api_key, secure : true });
var _RR = StackMob.Model.extend({ schemaName: 'rr' });

/*
 * Init
 */
$.init = function() {
	$.setMode();

	$.dlgConfirmSend = Ti.UI.createAlertDialog({
   	cancel: 1, ok: 0,
   	buttonNames: ['Real Patient', 'Just Testing'],
   	message: 'Please confirm the patient type',
   	title: 'Person Type'
  	});

	$.dlgConfirmSend.addEventListener('click', function(e){
  		if (e.index === e.source.cancel){
  			var testDataCount = Ti.App.Properties.getInt("APP:TestDataCount",0) + 1;
  			var realDataCount = Ti.App.Properties.getInt("APP:RealDataCount",0);
      	Ti.App.Properties.setInt("APP:TestDataCount", testDataCount)
      	Ti.Analytics.featureEvent('app:TestData', {real: realDataCount, test: testDataCount});
    	}
    	else {
  			var testDataCount = Ti.App.Properties.getInt("APP:TestDataCount",0);
  			var realDataCount = Ti.App.Properties.getInt("APP:RealDataCount",0) + 1;
      	Ti.App.Properties.setInt("APP:RealDataCount", realDataCount)
      	Ti.Analytics.featureEvent('app:RealData', {real: realDataCount, test: testDataCount});
    		$.sendDataConfirmed();
    	}
  	});

	$.lungs.addEventListener('click', function(e) {
		var matrix = Ti.UI.create2DMatrix()
  		matrix = matrix.scale(1.4, 1.4);
  		var ani = Ti.UI.createAnimation({
    		transform : matrix,
    		duration : 400,
    		autoreverse : true,
  		});
  		$.lungs.animate(ani);

  		data.push( Date.now().valueOf() );
  		Ti.API.info( "Push timestamp: " + data[data.length-1]);

  		if(0 === count) {
  			$.abortbut.visible = true;
  		}

  		if(0 === mode) {
			count++;
  			$.progress.value = count;
  			if (count >= sampleSize) {
  				$.finalCalcFixedBreathsSample();
				$.sendData();
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
						$.sendData();
  					}
  				},1000);
  			}
  		}
	});

	$.mode.addEventListener("click",function(e){
		$.dlgMode.show();
	});

	$.progress.addEventListener("click",function(e){
		$.dlgMode.show();
	});

	$.dlgMode.addEventListener("click",function(e){
		if(OS_ANDROID) {
			if(e.button) {		// The only button defined is cancel
				e.index = -1;
			}
		}
		Ti.API.info("Option index = " + e.index);
		if(e.index != $.dlgMode.cancel && e.index != -1) {
			$.abort();
			mode = e.index;
			$.setMode();
		}
	});

	$.resetbut.addEventListener("click", $.reset);

	$.abortbut.addEventListener("click", function(e){
		$.abort();
		$.abortbut.visible = false;
	});

	$.MainWindow.open();

	if (!Ti.App.Properties.getBool("APP:TandC_ACCEPTED", false)) {
		var tandc = Alloy.createController("tandc", {}).getView();
		// Open on top of the mainwindow
		tandc.open();
	}

}

/*
 * Abort a count
 */
$.abort = function() {
	if(mode>0) {
		clearInterval(timer);
		timer = null;
	}
	$.reset();
}

/*
 * Reset the UI to starting layout
 */
$.reset = function() {
	count = 0;
	data = [];
	$.progress.value = 0;

	$.lungs.opacity = 1.0;
	$.rr.visible = false;
	$.resetbut.visible = false;
	$.abortbut.visible = false;
	$.progress.visible = true;
	$.usage.visible = true;
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

$.sendData = function() {
	$.dlgConfirmSend.show();
}

$.sendDataConfirmed = function() {
	var rr = new _RR({
		device: Ti.Platform.id,
		fixed_or_timed: (mode>0) ? 'timed' : 'fixed',
		fixed_or_timed_value: (mode>0) ? mode : 7,
		data: data
	});

	// Persist the object to StackMob
	rr.create({
  		success: function(model, result, options) { Ti.API.debug(model.toJSON()); },
  		error: function(model, error, options) { Ti.API.debug(error); }
	});
}

$.setUI2Results = function() {
	$.lungs.opacity = 0.4;
	$.rr.visible = true;
	$.abortbut.visible = false;
	$.resetbut.visible = true;
	$.progress.visible = false;
	$.usage.visible = false;
}

$.setMode = function() {
	$.progress.max = (0 === mode) ? sampleSize : 60 * mode;

	if(0===mode) {
		$.mode_lbl.text = "Mode: Sample 7 breaths";
		$.progress.message = "Mode: Sample 7 breaths";
	}
	else {
		$.mode_lbl.text = "Mode: Sample over "+ mode +" min(s)";
		$.progress.message = "Mode: Sample over "+ mode +" min(s)";
	}
}
/*
 *
 */
$.init();
