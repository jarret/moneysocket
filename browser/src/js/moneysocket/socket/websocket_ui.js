// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Utils = require('../../utils.js').Utils;

class WebsocketConnectUi {
    constructor(div, title, default_ws_url, cb_obj, cb_param) {
        this.title = title;
        this.parent_div = div;
        this.default_ws_url = default_ws_url;
        this.my_div = null;
        this.input = null;
        this.cb_obj = cb_obj;
        console.assert(typeof cb_obj.Connect == 'function');
        console.assert(typeof cb_obj.Disconnect == 'function');
        this.cb_param = cb_param;
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        Utils.DrawTitle(this.my_div, this.title, "h4");
        this.my_div.setAttribute("class", style);
        this.input = Utils.DrawTextInput(this.my_div, this.default_ws_url);
        Utils.DrawBr(this.my_div);
        this.connect_button_div = Utils.EmptyDiv(this.my_div);
        this.DrawConnectButton();
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    GetWsUrl() {
        return this.input.value;
    }

    DrawConnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Connect",
            (function() {this.cb_obj.Connect(this.cb_param)}).bind(this));
    }

    DrawConnecting() {
        Utils.DeleteChildren(this.connect_button_div);
        var connect_button = Utils.DrawButton(this.connect_button_div,
                                              "Connecting", function() {});
        connect_button.disabled = true;
    }

    DrawDisconnectButton() {
        Utils.DeleteChildren(this.connect_button_div);
        Utils.DrawButton(this.connect_button_div, "Disconnect",
            (function() {this.cb_obj.Disconnect(this.cb_param)}).bind(this));
    }
}

exports.WebsocketConnectUi = WebsocketConnectUi;
