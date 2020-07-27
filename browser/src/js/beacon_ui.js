// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;

const MoneysocketBeacon = require(
    './moneysocket/beacon/beacon.js').MoneysocketBeacon;
const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;

//////////////////////////////////////////////////////////////////////////////

const PROTOCOL_PREFIX = "moneysocket:"

//const DEFAULT_HOST = "relay.socket.money";
//const DEFAULT_PORT = 443;
//const DEFAULT_USE_TLS = true;

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 11060;
const DEFAULT_USE_TLS = false;

//////////////////////////////////////////////////////////////////////////////

class BeaconUi {
    constructor(div, title, cb_obj, cb_param) {
        this.title = title;
        this.parent_div = div;
        this.my_div = null;
        this.mode_display_div = null;
        this.mode_button_div = null;
        this.connect_button_div = null;
        this.cb_obj = cb_obj;
        console.assert(typeof cb_obj.connect == 'function');
        console.assert(typeof cb_obj.disconnect == 'function');
        this.cb_param = cb_param;

        this.beacon_str = null;
        this.input_div = null;

    }

    draw(style) {
        this.my_div = document.createElement("div");
        DomUtl.drawTitle(this.my_div, this.title, "h4");
        this.my_div.setAttribute("class", style);

        this.mode_display_div = DomUtl.emptyDiv(this.my_div);
        this.connect_button_div = DomUtl.emptyDiv(this.my_div);
        this.drawConnectButton();

        DomUtl.drawBr(this.my_div);
        this.mode_button_div = DomUtl.emptyDiv(this.my_div);

        this.doModeEnter();
        DomUtl.drawBr(this.my_div);


        this.parent_div.appendChild(this.my_div);
    }

    getDefaultBeacon() {
        var location = new WebsocketLocation(DEFAULT_HOST, DEFAULT_PORT,
                                             DEFAULT_USE_TLS);
        var beacon = new MoneysocketBeacon();
        beacon.addLocation(location);
        return beacon;
    }

    doModeGenerate() {
        DomUtl.deleteChildren(this.mode_display_div);
        this.input_div = null;

        var beacon = this.getDefaultBeacon();
        this.beacon_str = beacon.toBech32Str();
        DomUtl.qrCode(this.mode_display_div, this.beacon_str, PROTOCOL_PREFIX);
        this.drawEnterButton();
    }

    doModeEnter() {
        DomUtl.deleteChildren(this.mode_display_div);
        this.beacon_str = null;

        DomUtl.drawText(this.mode_display_div, "Enter Beacon: ");
        this.input_div = DomUtl.drawTextInput(this.mode_display_div, "");
        this.drawGenerateButton();
    }

    /*doModeConnected() {
        console.log("do connected");
        DomUtl.deleteChildren(this.mode_display_div);
        DomUtl.deleteChildren(this.mode_button_div);
    }*/

    drawGenerateButton() {
        DomUtl.deleteChildren(this.mode_button_div);
        DomUtl.drawButton(this.mode_button_div, "Generate Beacon",
            (function() {this.doModeGenerate()}).bind(this));
    }

    drawEnterButton() {
        DomUtl.deleteChildren(this.mode_button_div);
        DomUtl.drawButton(this.mode_button_div, "Enter Beacon",
            (function() {this.doModeEnter()}).bind(this));
    }

    drawConnectButton() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.drawButton(this.connect_button_div, "Connect",
            (function() {this.cb_obj.connect(this.cb_param)}).bind(this));
    }

    drawConnecting() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.deleteChildren(this.mode_display_div);
        DomUtl.deleteChildren(this.mode_button_div);
        var connect_button = DomUtl.drawButton(this.connect_button_div,
                                              "Connecting", function() {});
        connect_button.disabled = true;
    }


    doDisconnect() {
        this.cb_obj.disconnect(this.cb_param);
        this.doModeEnter();
    }

    drawDisconnectButton() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.drawButton(this.connect_button_div, "Disconnect",
            (function() {this.doDisconnect()}).bind(this));
    }

    getWsUrl() {
        var beacon_str;
        if (this.input_div != null) {
            console.log("input children: " + this.input_div.firstChild);
            var input = this.input_div.firstChild.value;
            if (input.startsWith(PROTOCOL_PREFIX)) {
                input = input.slice(PROTOCOL_PREFIX.length);
            }
            beacon_str = input;
        } else {
            beacon_str = this.beacon_str;
        }
        var [beacon, err] = MoneysocketBeacon.fromBech32Str(beacon_str);
        if (err != null) {
            return ""
        }
        var location = beacon.locations[0];
        if (! (location instanceof WebsocketLocation)) {
            return ""
        }
        var url = location.toWsUrl();
        console.log("websocket url: " + url);
        return url;
    }
}

exports.BeaconUi = BeaconUi;
