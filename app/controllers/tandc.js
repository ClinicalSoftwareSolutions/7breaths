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

var ARGS = arguments[0] || {};
$.reachedBottom = false;
$.scrollBottomY = 0;

$.init = function() {
    var htmlfile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/tandc.html");
    var html = htmlfile.read().text;
    $.styledlabel.html = html;

    Ti.App.addEventListener("androidback" , function() {
        // TODO don't allow close unless ok or cancel selected, i.e. prevent normal back button behavior
        //this.close();
    });

    $.styledlabel.addEventListener("postlayout",function(e){
        $.scrollBottomY = e.source.getRect().height - $.ScrollWrapper.getSize().height;
        Ti.API.debug("Set $.scrollBottomY = " + $.scrollBottomY);
    });

    $.ScrollWrapper.addEventListener("scroll",$.scrollWrapper_ScrollEvent);

    $.accept_but.addEventListener("click",function(e){
        if ($.reachedBottom === false) {
            Ti.Analytics.featureEvent('app:Tried_TandC_Accepted');
            alert("Please read all the Terms and Conditions before accepting them. Thank you.")
            return;
        }
        Ti.Analytics.featureEvent('app:TandC_Accepted');
        Ti.App.Properties.setBool("APP:TandC_ACCEPTED", true);
        $.Window.close();
    });

    $.reject_but.addEventListener("click",function(e){
        Ti.Analytics.featureEvent('app:TandC_Rejected');
        alert("Thank you for your interest in 7Breaths. As the terms are not acceptable please un-install the application.")
    });
}

$.scrollWrapper_ScrollEvent = function(_event) {
    Ti.API.info("Scroll x="+_event.x+" y="+_event.y);
    if( $.isScrollBottom(_event.y) ) {
        Ti.API.info("ScrollView reached the bottom.");
        $.reachedBottom = true;
        // Don't need to listen anymore
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