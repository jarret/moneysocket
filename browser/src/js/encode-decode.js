// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Crypto = require('crypto');

const DomUtl = require('./domutl.js').DomUtl;
const SharedSeed = require('./moneysocket/beacon/shared_seed.js').SharedSeed;
const BinUtl = require('./moneysocket/utl/bin.js').BinUtl;
const MoneysocketBeacon = require('./moneysocket/beacon/beacon.js').MoneysocketBeacon;

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
        this.ta_out = null;
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        DomUtl.DrawTitle(this.my_div, "Encode Beacon", "h1");

        DomUtl.DrawText(this.my_div, "Shared Seed: ")
        this.shared_seed_div = DomUtl.EmptyDiv(this.my_div);
        this.shared_seed_button_div = DomUtl.EmptyDiv(this.my_div);

        this.GenerateSharedSeed();

        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawText(this.my_div, "Use TLS: ");
        this.use_tls_div = DomUtl.EmptyDiv(this.my_div);
        this.use_tls_button_div = DomUtl.EmptyDiv(this.my_div);

        this.SetUseTlsTrue();

        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawText(this.my_div, "Host: ");
        this.host_in = DomUtl.DrawTextInput(this.my_div, "relay.socket.money");
        this.host_in.setAttribute("size", "15")

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawText(this.my_div, "Port: ");
        this.port_in = DomUtl.DrawTextInput(this.my_div, "443");
        this.port_in.setAttribute("size", "4")

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawButton(this.my_div, "Encode",
            (function() {this.Encode()}).bind(this)
            );

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        this.ta_out = DomUtl.DrawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    GenerateSharedSeed() {
        DomUtl.DeleteChildren(this.shared_seed_div);
        DomUtl.DeleteChildren(this.shared_seed_button_div);


        var shared_seed = Crypto.randomBytes(16).toString("hex");
        this.shared_seed_in = DomUtl.DrawTextInput(this.shared_seed_div,
                                                  shared_seed);
        this.shared_seed_in.setAttribute("size", "30")
        DomUtl.DrawButton(this.shared_seed_button_div,
                         "Generate New Random Seed",
                         (function() {this.GenerateSharedSeed()}).bind(this));

        var sso = SharedSeed.FromHexStr(shared_seed);
        console.log("shared seed: " + sso.ToString());
        console.log("hash: " + sso.DeriveAes256Key());
        console.log("rdv id: " + sso.DeriveRendezvousId());
        console.log("bytes: " + sso.GetBytes());
    }

    SetUseTlsTrue() {
        DomUtl.DeleteChildren(this.use_tls_div);
        DomUtl.DeleteChildren(this.use_tls_button_div);

        this.use_tls = true;
        DomUtl.DrawBigText(this.use_tls_div, "True");
        DomUtl.DrawButton(this.use_tls_button_div, "Set False",
                         (function() {this.SetUseTlsFalse()}).bind(this));
    }

    SetUseTlsFalse() {
        DomUtl.DeleteChildren(this.use_tls_div);
        DomUtl.DeleteChildren(this.use_tls_button_div);

        this.use_tls = false;
        DomUtl.DrawBigText(this.use_tls_div, "False");
        DomUtl.DrawButton(this.use_tls_button_div, "Set True",
                         (function() {this.SetUseTlsTrue()}).bind(this));
    }

    Encode() {
        var shared_seed_str = this.shared_seed_in.value;

        var shared_seed = new SharedSeed(BinUtl.ToByteArray(shared_seed_str));
        var host = this.host_in.value;
        var port = this.port_in.value;
        console.log("shared_seed: " + shared_seed);
        console.log("use_tls: " + this.use_tls);
        console.log("host: " + host);
        console.log("port: " + port);

        var b = new MoneysocketBeacon(shared_seed);
        var beacon_str = b.ToBech32Str();
        console.log("beacon: " + beacon_str);
        this.ta_out.value = beacon_str;

        var [b2, err] = MoneysocketBeacon.FromBech32Str(beacon_str);

        console.log("beacon2: " + b2.ToBech32Str());
        console.log("err: " + err);
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

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        DomUtl.DrawTitle(this.my_div, "Decode Beacon", "h1");

        this.ta_in = DomUtl.DrawTextArea(this.my_div);

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawButton(this.my_div, "Decode",
            (function() {this.Decode()}).bind(this)
            );

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        this.ta_out = DomUtl.DrawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    Decode() {
        var out_text = '';
        var text = this.ta_in.value;
        console.log("decode: " + text);

        var [beacon, err] = MoneysocketBeacon.FromBech32Str(text);
        if (err != null) {
            out_text = err;
        } else {
            out_text = JSON.stringify(beacon.ToDict());
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


    Draw() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");

        this.ea = new EncodeApp(this.my_div);
        this.ea.Draw("center");
        DomUtl.DrawBr(this.my_div);
        this.da = new DecodeApp(this.my_div);
        this.da.Draw("center");

        DomUtl.DrawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }
}

//////////////////////////////////////////////////////////////////////////////

window.app = new EncodeDecodeApp();

function DrawFirstUi() {
    window.app.Draw()
}

window.addEventListener("load", DrawFirstUi());
