/**
 * Common JS module to handle data storage including offline handling
 */

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

// Include the StackMob stuff
Ti.include('/stackmob.cfg.js');
StackMob = require('ti.stackmob')({ publicKey : stackmob_api_key, secure : true, apiVersion: stackmob_api_ver });
var _RR = StackMob.Model.extend({ schemaName: 'rr' });

var _networkOnline = false;

exports.init = function(_args) {
	var db = Titanium.Database.open('rr_data');
	db.execute('CREATE TABLE IF NOT EXISTS tblEvents (' +
		'event_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT' +
		', mode INTEGER NOT NULL' +
		', data_json STRING NOT NULL' +
		', displayedRR INTEGER NOT NULL' +
		', realPerson BOOLEAN NOT NULL' +
		');');
	if(OS_IOS) {
		db.file.setRemoteBackup(false);
	}
	db.close();
	db = null;

	_networkOnline = Ti.Network.online;

	// If sending user reg failed try sending on init
	if( Ti.App.Properties.hasProperty("APP:RegisteredUserPending") ) {
		_RegisterPendingUser();
	}

	// Send any pending events
	_sendPendingData();

	Ti.Network.addEventListener("change",function(_event){
		if(_networkOnline === false && _event.online === true) {
			if( Ti.App.Properties.hasProperty("APP:RegisteredUserPending") ) {
				_RegisterPendingUser();
			}
			// Network as become available
			_sendPendingData();
		}
		_networkOnline = _event.online;
	});

	if(OS_IOS){
		Ti.App.addEventListener('resumed', function(e){
			Ti.API.debug("iOS resume");
			_sendPendingData();
		});
	}

	if(OS_ANDROID){
		if (_args.activity !== undefined){
			_args.activity.addEventListener("resume",function(_e){
				Ti.API.debug("Android resume");
				_sendPendingData();
			});
		}
	}
}

exports.storeData = function(_realPerson, _mode, _data, _rr) {

	// If we not connected, no point even trying to send to StackMob
	if(!Ti.Network.online) {
		_storeInDb(_realPerson, _mode, _data, _rr);
		return;
	}

	var rr = new _RR({
		device: Ti.Platform.id,
		fixed_or_timed: (_mode>0) ? 'timed' : 'fixed',
		fixed_or_timed_value: (_mode>0) ? _mode : 7,
		data: _data,
		displayedRR: _rr
	});

	// Persist the object to StackMob
	rr.create({
  		success: function(model, result, options) {
  			Ti.API.debug(model.toJSON());
  			// If we have just succeded then this is a good time to send any pending data
  			_sendPendingData();
  		},
  		error: function(model, error, options) {
  			Ti.API.debug("rr.create Error: "+error);
  			// Store in database
  			_storeInDb(_realPerson, _mode, _data, _rr);
  		}
	});

}

exports.RegisterUser = function(_email, _firstname, _surname, _role) {
	var utcTime = new Date();
	var _timezoneoffset = utcTime.getTimezoneOffset();

	// Make an object so that on error we can save easily for retry
	var userObj = {
		username: _email,
		device: Ti.Platform.id,
		password: Ti.Utils.sha1(_email),	// not interested in a true password
		firstname: _firstname,
		surname: _surname,
		role: _role,
		timezoneoffset: _timezoneoffset
	};
	var user = new StackMob.User(userObj);

	user.create({
  		success: function(model, result, options) {
  			Ti.Analytics.featureEvent("APP:UserRegistered");
        	Ti.App.Properties.setString("APP:RegisteredUser", _email);
  		},
  		error: function(model, result, options) {
  			Ti.API.debug("user.create Error: "+error);
			Ti.Analytics.featureEvent("APP:UserRegistrationError");
        	Ti.App.Properties.setString("APP:RegisteredUserPending", JSON.stringify(userObj,null,0));
  		}
	});
}

_RegisterPendingUser = function() {
	if( !Ti.App.Properties.hasProperty("APP:RegisteredUserPending") ) {
		return;
	}
	
	var userObj = JSON.parse(Ti.App.Properties.getString("APP:RegisteredUserPending"));
	var user = new StackMob.User(userObj);

	user.create({
  		success: function(model, result, options) {
  			Ti.Analytics.featureEvent("APP:UserRegistered");
        	Ti.App.Properties.setString("APP:RegisteredUser", userObj.email);
        	Ti.App.Properties.removeProperty("APP:RegisteredUserPending");
  		},
  		error: function(model, result, options) {
			Ti.Analytics.featureEvent("APP:UserRegistrationError");
  		}
	});
}

_storeInDb = function(_realPerson, _mode, _data, _rr) {
	var db = Titanium.Database.open('rr_data');
	db.execute("INSERT INTO tblEvents (mode, data_json, displayedRR, realPerson) VALUES(?,?,?,?);"
		, _mode
		, JSON.stringify(_data,null,0)
		, _rr
		, ( ((_realPerson)?1:0) )
		);
	db.close();
	db = null;
	Ti.API.debug("Event data stored in DB for sending later.");
}

_sendPendingData = function() {
	if(!Ti.Network.online) {
		return;
	}

	var db = Titanium.Database.open('rr_data');
	var rows = db.execute("SELECT * FROM tblEvents LIMIT 1");

	if(rows.isValidRow()) {
		Ti.API.debug("Got a valid row: Count=" + rows.rowCount);
		var event_id = rows.fieldByName('event_id');
		var mode = rows.fieldByName('mode');
		var data = JSON.parse(rows.fieldByName('data_json'));
		var respRate = JSON.parse(rows.fieldByName('displayedRR'));

		var rr = new _RR({
			device: Ti.Platform.id,
			fixed_or_timed: (mode>0) ? 'timed' : 'fixed',
			fixed_or_timed_value: (mode>0) ? mode : 7,
			data: data,
			displayedRR: respRate
		});

		// Send it
		rr.create({
	  		success: function(model, result, options) {
	  			Ti.API.debug("SB success: Model = " + model.toJSON());

				var db = Titanium.Database.open('rr_data');
				var rows = db.execute("DELETE FROM tblEvents WHERE event_id=?", event_id);
				db.close();
				db = null;

	  			// If we have just succeded then delete the one sent and try the next row
	  			_sendPendingData();
	  		},
	  		error: function(model, error, options) {
	  			Ti.API.debug(error);
	  		}
		});
	}

	rows.close();
	db.close();
	db = null;
}