// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Crypto = require('crypto');
const Kjua = require('kjua');

const DomUtl = require('./ui/domutl.js').DomUtl;
const SharedSeed = require('./moneysocket/beacon/shared_seed.js').SharedSeed;
const BinUtl = require('./moneysocket/utl/bin.js').BinUtl;
const MoneysocketBeacon = require(
    './moneysocket/beacon/beacon.js').MoneysocketBeacon;
const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;
const BigSize = require('./moneysocket/utl/bolt/bigsize.js').BigSize;
const UInt64 = require('./moneysocket/utl/uint64.js').UInt64;


const PROTOCOL_PREFIX = "moneysocket:"


const DEFAULT_HOST = "relay.socket.money";
const DEFAULT_PORT = 443;
const DEFAULT_USE_TLS = true;

//////////////////////////////////////////////////////////////////////////////

class EncodeApp {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.host_in = null;
        this.port_in = null;
        this.use_tls = true;
        this.use_tls_div = null;
        this.use_tls_button_div = null;
        this.shared_seed_div = null;
        this.shared_seed_in = null;
        this.shared_seed_button_div = null;
        this.qr_div = null;
        this.ta_out = null;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        DomUtl.drawTitle(this.my_div, "Encode Beacon", "h1");

        DomUtl.drawText(this.my_div, "Shared Seed: ")
        this.shared_seed_div = DomUtl.emptyDiv(this.my_div);
        this.shared_seed_button_div = DomUtl.emptyDiv(this.my_div);

        this.generateSharedSeed();

        DomUtl.drawBr(this.my_div);

        DomUtl.drawText(this.my_div, "Use TLS: ");
        this.use_tls_div = DomUtl.emptyDiv(this.my_div);
        this.use_tls_button_div = DomUtl.emptyDiv(this.my_div);

        if (DEFAULT_USE_TLS) {
            this.setUseTlsTrue();
        } else {
            this.setUseTlsFalse();
        }

        DomUtl.drawBr(this.my_div);

        DomUtl.drawText(this.my_div, "Host: ");
        this.host_in_div = DomUtl.drawTextInput(this.my_div, DEFAULT_HOST);
        this.host_in = this.host_in_div.firstChild;
        this.host_in.setAttribute("size", "15")

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawText(this.my_div, "Port: ");
        this.port_in_div = DomUtl.drawTextInput(this.my_div,
                                                DEFAULT_PORT.toString());
        this.port_in = this.port_in_div.firstChild;
        this.port_in.setAttribute("size", "4")

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawButton(this.my_div, "Encode",
            (function() {this.encode()}).bind(this)
            );

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);
        this.qr_div = DomUtl.emptyDiv(this.my_div);

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.ta_out = DomUtl.drawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);


        this.parent_div.appendChild(this.my_div);
    }

    generateSharedSeed() {
        DomUtl.deleteChildren(this.shared_seed_div);
        DomUtl.deleteChildren(this.shared_seed_button_div);


        var shared_seed = Crypto.randomBytes(16).toString("hex");
        this.shared_seed_div = DomUtl.drawTextInput(this.shared_seed_div,
                                                    shared_seed);
        this.shared_seed_in = this.shared_seed_div.firstChild;
        this.shared_seed_in.setAttribute("size", "30")
        DomUtl.drawButton(this.shared_seed_button_div,
                         "Generate New Random Seed",
                         (function() {this.generateSharedSeed()}).bind(this));

        var sso = SharedSeed.fromHexStr(shared_seed);
        //console.log("shared seed: " + sso.toString());
        //console.log("hash: " + sso.deriveAes256Key());
        //console.log("rdv id: " + sso.deriveRendezvousId());
        //console.log("bytes: " + sso.getBytes());
    }

    setUseTlsTrue() {
        DomUtl.deleteChildren(this.use_tls_div);
        DomUtl.deleteChildren(this.use_tls_button_div);

        this.use_tls = true;
        DomUtl.drawBigText(this.use_tls_div, "True");
        DomUtl.drawButton(this.use_tls_button_div, "Set False",
                         (function() {this.setUseTlsFalse()}).bind(this));
    }

    setUseTlsFalse() {
        DomUtl.deleteChildren(this.use_tls_div);
        DomUtl.deleteChildren(this.use_tls_button_div);

        this.use_tls = false;
        DomUtl.drawBigText(this.use_tls_div, "False");
        DomUtl.drawButton(this.use_tls_button_div, "Set True",
                         (function() {this.setUseTlsTrue()}).bind(this));
    }

    setEncoded(beacon_str) {
        DomUtl.deleteChildren(this.qr_div);
        this.ta_out.value = beacon_str;
        DomUtl.qrCode(this.qr_div, beacon_str, PROTOCOL_PREFIX);
    }

    encode() {
        var shared_seed_str = this.shared_seed_in.value;

        var shared_seed = new SharedSeed(BinUtl.toByteArray(shared_seed_str));
        var host = this.host_in.value;
        var port = this.port_in.value;
        //console.log("shared_seed: " + shared_seed);
        //console.log("use_tls: " + this.use_tls);
        //console.log("host: " + host);
        //console.log("port: " + port);

        var location = new WebsocketLocation(host, port, this.use_tls);
        var beacon = new MoneysocketBeacon(shared_seed);
        //console.log("pushing: " + (location instanceof WebsocketLocation));
        beacon.addLocation(location);

        this.setEncoded(beacon.toBech32Str());

    }
}

//////////////////////////////////////////////////////////////////////////////

class DecodeApp {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.ta_in = null;
        this.ta_out = null;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        DomUtl.drawTitle(this.my_div, "Decode Beacon", "h1");

        this.ta_in = DomUtl.drawTextArea(this.my_div);

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawButton(this.my_div, "Decode",
            (function() {this.decode()}).bind(this)
            );

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.ta_out = DomUtl.drawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    decode() {
        var out_text = '';
        var text = this.ta_in.value;
        //console.log("decode: " + text);
        if (text.startsWith(PROTOCOL_PREFIX)) {
            text = text.slice(PROTOCOL_PREFIX.length);
        }

        var [beacon, err] = MoneysocketBeacon.fromBech32Str(text);
        if (err != null) {
            out_text = err;
        } else {
            out_text = JSON.stringify(beacon.toDict(), null, ' ');
        }

        this.ta_out.value = out_text;
    }
}

//////////////////////////////////////////////////////////////////////////////

class EncodeDecodeApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.ea = null;
        this.da = null;
    }


    draw() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");

        this.ea = new EncodeApp(this.my_div);
        this.ea.draw("center");
        DomUtl.drawBr(this.my_div);
        this.da = new DecodeApp(this.my_div);
        this.da.draw("center");

        DomUtl.drawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }
}

//////////////////////////////////////////////////////////////////////////////

window.app = new EncodeDecodeApp();

function drawFirstUi() {
    window.app.draw();
    //BigSize.encodeTests();
    //BigSize.decodeTests();
    //var v = UInt64.fromHex("1234567890abcdef");
    //console.log("v: " + v.toHex());
}

window.addEventListener("load", drawFirstUi());
