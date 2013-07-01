/**
 * Common JS module to handle data storage including offline handling
 */

// Include the StackMob stuff
Ti.include('/stackmob.cfg.js');
StackMob = require('ti.stackmob')({ publicKey : stackmob_api_key, secure : true });
var _RR = StackMob.Model.extend({ schemaName: 'rr' });

var _networkOnline = false;

exports.init = function() {
	var db = Titanium.Database.open('rr_data');
	db.execute('CREATE TABLE IF NOT EXISTS tblEvents (' +
		'event_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT' +
		', mode INTEGER NOT NULL' +
		', data_json STRING NOT NULL' +
		');');

	db.close();
	db = null;

	_networkOnline = Ti.Network.online;

	// Send any pending events
	_sendPendingData();

	Ti.Network.addEventListener("change",function(_event){
		if(_networkOnline === false && _event.online === true) {
			// Network as become available
			_sendPendingData();
		}
		_networkOnline = _event.online;
	});
}

exports.storeData = function(_mode, _data) {

	// If we not connected, no point even trying to send to StackMob
	if(!Ti.Network.online) {
		_storeInDb(_mode, _data);
		return;
	}

	var rr = new _RR({
		device: Ti.Platform.id,
		fixed_or_timed: (mode>0) ? 'timed' : 'fixed',
		fixed_or_timed_value: (mode>0) ? mode : 7,
		data: _data
	});

	// Persist the object to StackMob
	rr.create({
  		success: function(model, result, options) {
  			Ti.API.debug(model.toJSON());
  			// If we have just succeded then this is a good time to send any pending data
  			_sendPendingData();
  		},
  		error: function(model, error, options) {
  			Ti.API.debug(error);
  			// Store in database
  			_storeInDb(_mode, _data);
  		}
	});

}

_storeInDb = function(_mode, _data) {
	var db = Titanium.Database.open('rr_data');
	db.execute("INSERT INTO tblEvents (mode, data_json) VALUES(?,?);", _mode, JSON.stringify(_data,null,0) );
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
	db.close();
	db = null;

	if(rows.isValidRow()) {
		var event_id = rows.fieldByName('event_id');
		var mode = rows.fieldByName('mode');
		var data = JSON.parse(rows.fieldByName('data_json'));

		var rr = new _RR({
			device: Ti.Platform.id,
			fixed_or_timed: (mode>0) ? 'timed' : 'fixed',
			fixed_or_timed_value: (mode>0) ? mode : 7,
			data: data
		});

		// Send it
		rr.create({
	  		success: function(model, result, options) {
	  			Ti.API.debug(model.toJSON());

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
}