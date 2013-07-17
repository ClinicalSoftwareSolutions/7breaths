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

$.DEFAULT_ROLE_TEXT = "Please choose one ...";

var ARGS = arguments[0] || {};
$.reachedBottom = false;
$.scrollBottomY = 0;

$.init = function() {
    var htmlfile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/tandc.html");
    var html = htmlfile.read().text;
    $.styledlabel.html = html;

    $.roleLabel.text = $.DEFAULT_ROLE_TEXT;

    $.reg_info.text = "Registration is entirely optional, but allows us to better"
    + " understand the data collected and also allows us send feedback to you.";

    Ti.App.addEventListener("androidback" , function() {
        // TODO don't allow close unless ok or cancel selected, i.e. prevent normal back button behaviour
        //this.close();
    });

    $.styledlabel.addEventListener("postlayout",function(e){
        $.scrollBottomY = e.source.getRect().height - $.ScrollWrapper.getSize().height;
        Ti.API.debug("Set $.scrollBottomY = " + $.scrollBottomY);
    });

    $.ScrollWrapper.addEventListener("scroll",$.scrollWrapper_ScrollEvent);

    // Terms accepted
    $.accept_but.addEventListener("click",function(e){
        if ($.reachedBottom === false) {
            Ti.Analytics.featureEvent('APP:Tried_TandC_Accepted',{});
            alert("Please scroll down through all the Terms and Conditions before accepting them. Thank you.")
            return;
        }
        Ti.Analytics.featureEvent("APP:TandC_ACCEPTED",{});
        Ti.App.Properties.setBool("APP:TandC_ACCEPTED", true);
        $.scrollableView.setCurrentPage(1);
    });

    // Terms rejected
    $.reject_but.addEventListener("click",function(e){
        Ti.Analytics.featureEvent('APP:TandC_Rejected',{});
        alert("Thank you for your interest in 7Breaths. As the terms are not acceptable please un-install the application.")
    });

    // Open the role picker
    $.rolePicker.addEventListener("click", function(e){
        $.reg_firstname.blur();
        $.reg_surname.blur();
        $.reg_email.blur();
        if(OS_IOS) {
            $.rolePickerWrapper.visible = true;
        }
        if(OS_ANDROID) {
            $.rolePickerControl.show();
        }
    });

    if(OS_IOS) {
        // Close picker if there is a click outside of the picker control
        $.rolePickerWrapper.addEventListener("click",function(e){
            Ti.API.debug("rolePickerWrapper click")
            $.rolePickerWrapper.visible = false;
        });
    
        // Set label if a new role is selected
        $.select_role_but.addEventListener("click",function(e){
            Ti.API.debug("Picker row selected: " + $.rolePickerControl.getSelectedRow(0).title);
            $.roleLabel.text = $.rolePickerControl.getSelectedRow(0).title;
        });
    }

    if(OS_ANDROID) {
        $.rolePickerControl.addEventListener("click",function(e){
            if(e.button) {      // The only button defined is cancel
                e.index = -1;
            }
            Ti.API.info("Option index = " + e.index);
            if(e.index != $.rolePickerControl.cancel && e.index != -1) {
                $.roleLabel.text = $.rolePickerControl.options[e.index];
            }
        });
    }

    // User registers
    $.register_but.addEventListener("click",function(e){
        var validate_msg = $.Validates();
        if(0 === validate_msg.length) {
            Alloy.Globals.datastore.RegisterUser($.reg_email.value, $.reg_firstname.value, $.reg_surname.value,
                $.roleLabel.text);
            Ti.App.Properties.setBool("APP:INIT_DONE", true);
            var dialog = Ti.UI.createAlertDialog({
                message: 'Thank you for registering. We will keep you informed of any outcomes.',
                ok: 'Okay',
                title: 'Thank you'
            });

            dialog.addEventListener('click', function(e){
                Ti.API.debug("About to close T&C window");
                $.Window.close();
            });

            dialog.show();
        }
        else {
            alert(validate_msg);
        }
    });

    // User declines registration
    $.skip_but.addEventListener("click",function(e){
        var _skipCount = Ti.App.Properties.getInt("APP:REG_SKIP_COUNT", 0) + 1;
        Ti.App.Properties.setInt("APP:REG_SKIP_COUNT", _skipCount);
        if (_skipCount < 3) {
            // We only prompt the user twice for registration if skipped
            // and with increasing intervals
            Ti.App.Properties.setInt("APP:REG_COUNTDOWN", _skipCount * 2);
        }
        Ti.App.Properties.setBool("APP:INIT_DONE", true);
        $.Window.close();
    });

    // If T&C already accepted then go straight to registration page
    if (Ti.App.Properties.getBool("APP:TandC_ACCEPTED", false)) {
        $.scrollableView.setCurrentPage(1);
    }

}

/**
 * Validate the fields
 * If fails then returns a message. So emmpty string indicates success
 */
$.Validates = function() {
    var msg = "";
    if ( $.reg_email.value.length < 5
        || $.reg_firstname.value.length < 2 
        || $.reg_surname.value.length < 2
        || $.roleLabel.text === $.DEFAULT_ROLE_TEXT) {
        
        msg += "All fields require a value please.\n";

        $.reg_email.borderColor = ( $.reg_email.value.length < 5) ? "#f00" : 'transparent';
        $.reg_firstname.borderColor = ( $.reg_firstname.value.length < 5) ? "#f00" : 'transparent';
        $.reg_surname.borderColor = ( $.reg_surname.value.length < 5) ? "#f00" : 'transparent';
        $.rolePicker.borderColor = ($.roleLabel.text === $.DEFAULT_ROLE_TEXT) ? "#f00" : 'transparent';
        
    }

    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;    
 
    $.reg_email.borderColor = ($.reg_email.value.length >= 5 && reg.test($.reg_email.value) == false)
        ? (msg += "The email address appears to be invalid. Please correct", "#f00") : 'transparent';

    return msg;
}

$.scrollWrapper_ScrollEvent = function(_event) {
    //Ti.API.info("Scroll x="+_event.x+" y="+_event.y);
    if( $.isScrollBottom(_event.y) ) {
        Ti.API.info("ScrollView reached the bottom.");
        $.reachedBottom = true;
        // Don't need to listen any more
        $.ScrollWrapper.removeEventListener("scroll",$.scrollWrapper_ScrollEvent);
    }
}

$.isScrollBottom = function(_y) {
    return ( (_y >= ($.scrollBottomY-25)) ? true : false );
}

/*
 * Bootstrap
 */
$.init();