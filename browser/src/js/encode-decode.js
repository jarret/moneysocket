// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Crypto = require('crypto');

const Utils = require('./utils.js').Utils;
const SharedSeed = require('./moneysocket/beacon/shared_seed.js').SharedSeed;

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

        Utils.DrawTitle(this.my_div, "Encode Beacon", "h1");

        Utils.DrawText(this.my_div, "Shared Seed: ")
        this.shared_seed_div = Utils.EmptyDiv(this.my_div);
        this.shared_seed_button_div = Utils.EmptyDiv(this.my_div);

        this.GenerateSharedSeed();

        Utils.DrawBr(this.my_div);

        Utils.DrawText(this.my_div, "Use TLS: ");
        this.use_tls_div = Utils.EmptyDiv(this.my_div);
        this.use_tls_button_div = Utils.EmptyDiv(this.my_div);

        this.SetUseTlsTrue();

        Utils.DrawBr(this.my_div);

        Utils.DrawText(this.my_div, "Host: ");
        this.host_in = Utils.DrawTextInput(this.my_div, "relay.socket.money");
        this.host_in.setAttribute("size", "15")

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        Utils.DrawText(this.my_div, "Port: ");
        this.port_in = Utils.DrawTextInput(this.my_div, "443");
        this.port_in.setAttribute("size", "4")

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        Utils.DrawButton(this.my_div, "Encode",
            (function() {this.Encode()}).bind(this)
            );

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.ta_out = Utils.DrawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    GenerateSharedSeed() {
        Utils.DeleteChildren(this.shared_seed_div);
        Utils.DeleteChildren(this.shared_seed_button_div);


        var shared_seed = Crypto.randomBytes(16).toString("hex");
        this.shared_seed_in = Utils.DrawTextInput(this.shared_seed_div,
                                                  shared_seed);
        this.shared_seed_in.setAttribute("size", "30")
        Utils.DrawButton(this.shared_seed_button_div,
                         "Generate New Random Seed",
                         (function() {this.GenerateSharedSeed()}).bind(this));

        var sso = SharedSeed.FromHexStr(shared_seed);
        console.log("shared seed: " + sso.ToString());
        console.log("hash: " + sso.DeriveAes256Key());
        console.log("rdv id: " + sso.DeriveRendezvousId());
        console.log("bytes: " + sso.GetBytes());
    }

    SetUseTlsTrue() {
        Utils.DeleteChildren(this.use_tls_div);
        Utils.DeleteChildren(this.use_tls_button_div);

        this.use_tls = true;
        Utils.DrawBigText(this.use_tls_div, "True");
        Utils.DrawButton(this.use_tls_button_div, "Set False",
                         (function() {this.SetUseTlsFalse()}).bind(this));
    }

    SetUseTlsFalse() {
        Utils.DeleteChildren(this.use_tls_div);
        Utils.DeleteChildren(this.use_tls_button_div);

        this.use_tls = false;
        Utils.DrawBigText(this.use_tls_div, "False");
        Utils.DrawButton(this.use_tls_button_div, "Set True",
                         (function() {this.SetUseTlsTrue()}).bind(this));
    }

    Encode() {
        var shared_seed = this.shared_seed_in.value;
        var host = this.host_in.value;
        var port = this.port_in.value;
        console.log("shared_seed: " + shared_seed);
        console.log("use_tls: " + this.use_tls);
        console.log("host: " + host);
        console.log("port: " + port);
    }
}

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

        Utils.DrawTitle(this.my_div, "Decode Beacon", "h1");

        this.ta_in = Utils.DrawTextArea(this.my_div);

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        Utils.DrawButton(this.my_div, "Decode",
            (function() {this.Decode()}).bind(this)
            );

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.ta_out = Utils.DrawTextArea(this.my_div);
        this.ta_out.setAttribute("readonly", "");
        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    Decode() {
        var text = this.ta_in.value;
        console.log("decode: " + text);
        this.ta_out.value = text;
    }
}

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
        Utils.DrawBr(this.my_div);
        this.da = new DecodeApp(this.my_div);
        this.da.Draw("center");

        Utils.DrawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }
}

window.app = new EncodeDecodeApp();

function DrawFirstUi() {
    window.app.Draw()
}

window.addEventListener("load", DrawFirstUi());
