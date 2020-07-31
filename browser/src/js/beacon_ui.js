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


const MODES = new Set(["ENTER_BEACON",
                       "GENERATED_BEACON",
                       "CONNECTED",
                      ]);



class BeaconUi {
    constructor(div, title, cb_obj, cb_param) {
        this.title = title;
        this.parent_div = div;
        this.my_div = null;


        //this.mode_display_div = null;
        //this.mode_button_div = null;
        //this.connect_button_div = null;

        this.cb_obj = cb_obj;
        console.assert(typeof cb_obj.connect == 'function');
        console.assert(typeof cb_obj.disconnect == 'function');
        this.cb_param = cb_param;

        this.mode = null;
        this.last_mode = null;
        this.input_div = null;

        this.beacon = null;
        this.beacon_str = null;
        this.generateNewBeacon();

        this.message_div = null;
        this.mode_output_div = null;
        this.mode_switch_button_div = null;

    }

    draw(style) {
        this.my_div = document.createElement("div");
        DomUtl.drawTitle(this.my_div, this.title, "h5");
        this.my_div.setAttribute("class", style);


        this.mode_output_div = DomUtl.emptyDiv(this.my_div);

        this.mode_output_div.setAttribute("class", "mode-output");
        DomUtl.drawBr(this.my_div);
        this.mode_switch_button_div = DomUtl.emptyDiv(this.my_div);

        this.switchMode("ENTER_BEACON");

        this.parent_div.appendChild(this.my_div);
    }


    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        this.last_mode = (this.mode == null) ? "ENTER_BEACON" : this.mode;
        this.mode = new_mode;

        DomUtl.deleteChildren(this.mode_switch_button_div);
        DomUtl.deleteChildren(this.mode_output_div);

        if (new_mode == "ENTER_BEACON") {
            var t = DomUtl.drawText(this.mode_output_div, "Enter Beacon");
            t.setAttribute("style", "padding:5px;");

            DomUtl.drawBr(this.mode_output_div);
            this.input_div = DomUtl.drawTextInput(this.mode_output_div, "");
            DomUtl.drawBr(this.mode_output_div);

            DomUtl.drawButton(this.mode_output_div, "Scan QR",
                (function() {this.scanQr()}).bind(this));
            DomUtl.drawButton(this.mode_output_div, "Connect",
                (function() {
                    this.attemptConnectFromEnterBeacon()
                }).bind(this));

            DomUtl.drawBr(this.mode_output_div);
            this.message_div = DomUtl.emptyDiv(this.mode_output_div);

            DomUtl.drawButton(this.mode_switch_button_div, "Generate Beacon",
                (function() {
                    this.generateNewBeacon();
                    this.switchMode("GENERATED_BEACON");
                }).bind(this));

        } else if (new_mode == "GENERATED_BEACON") {
            var t = DomUtl.drawText(this.mode_output_div, "Generated Beacon");
            t.setAttribute("style", "padding:5px;");

            DomUtl.qrCode(this.mode_output_div, this.beacon_str,
                          PROTOCOL_PREFIX);
            DomUtl.drawButton(this.mode_output_div, "Copy Beacon",
                (function() {this.copyBeacon()}).bind(this));
            DomUtl.drawButton(this.mode_output_div, "Connect",
                (function() {
                    this.attemptConnectFromGeneratedBeacon();
                }).bind(this));

            DomUtl.drawBr(this.mode_output_div);
            this.message_div = DomUtl.emptyDiv(this.mode_output_div);

            DomUtl.drawButton(this.mode_switch_button_div, "Enter Beacon",
                (function() {this.switchMode("ENTER_BEACON")}).bind(this));

        } else if (new_mode == "CONNECTED") {
            var t = DomUtl.drawText(this.mode_output_div, "Connected");
            t.setAttribute("style", "padding:5px;");

            DomUtl.drawButton(this.mode_output_div, "Copy Beacon",
                (function() {this.copyBeacon()}).bind(this));
            DomUtl.drawBr(this.mode_output_div);
            this.message_div = DomUtl.emptyDiv(this.mode_output_div);

            DomUtl.drawButton(this.mode_switch_button_div, "Disconnect",
                (function() {this.switchMode(this.last_mode)}).bind(this));
        }
    }


    setMessage(msg) {
        DomUtl.deleteChildren(this.message_div);
        var t = DomUtl.drawText(this.message_div, msg);
        t.setAttribute("style", "padding:10px;");
    }

    copyBeacon() {
        navigator.clipboard.writeText(this.beacon_str);
        console.log("copied: " + this.beacon_str);
        this.setMessage("Beacon copied to clipboard");
    }

    scanQr() {
        console.log("scan stub")
        this.setMessage("QR scanning not implemented yet");
    }

    attemptConnectFromEnterBeacon() {
        console.log("input children: " + this.input_div.firstChild);
        var input = this.input_div.firstChild.value;
        if (input.startsWith(PROTOCOL_PREFIX)) {
            input = input.slice(PROTOCOL_PREFIX.length);
        }
        var beacon_str = input;
        if (input == "") {
            this.setMessage("Please enter beacon string");
            return
        }
        var [beacon, err] = MoneysocketBeacon.fromBech32Str(beacon_str);
        if (err != null) {
            this.setMessage("could not interpret beacon");
            console.log("could not interpret beacon: " + beacon + " : " + err);
            return
        }
        this.beacon_str = beacon_str;
        this.beacon = beacon;

        // TODO call app to start connection

        this.switchMode("CONNECTED");
    }

    attemptConnectFromGeneratedBeacon() {
        // TODO call app to start connection

        this.switchMode("CONNECTED");
    }

    generateNewBeacon() {
        var location = new WebsocketLocation(DEFAULT_HOST, DEFAULT_PORT,
                                             DEFAULT_USE_TLS);
        var beacon = new MoneysocketBeacon();
        beacon.addLocation(location);
        this.beacon = beacon;
        this.beacon_str = beacon.toBech32Str();
    }


    /*
    draw(style) {
        this.my_div = document.createElement("div");
        DomUtl.drawTitle(this.my_div, this.title, "h2");
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
*/

    /*doModeConnected() {
        console.log("do connected");
        DomUtl.deleteChildren(this.mode_display_div);
        DomUtl.deleteChildren(this.mode_button_div);
    }*/

/*
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

    doConnect() {
        if (this.getWsUrl() == '') {
            return
        }
        this.cb_obj.connect(this.cb_param);
    }

    drawConnectButton() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.drawButton(this.connect_button_div, "Connect",
            (function() {this.doConnect()}).bind(this));
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

    */

    getBeacon() {
        return this.beacon;
    }

    getWsUrl() {
        var location = this.beacon.locations[0];
        if (! (location instanceof WebsocketLocation)) {
            return ""
        }
        var url = location.toWsUrl();
        console.log("websocket url: " + url);
        return url;
    }
}

exports.BeaconUi = BeaconUi;
