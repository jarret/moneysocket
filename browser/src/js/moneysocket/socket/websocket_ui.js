// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('../../domutl.js').DomUtl;

class WebsocketConnectUi {
    constructor(div, title, default_ws_url, cb_obj, cb_param) {
        this.title = title;
        this.parent_div = div;
        this.default_ws_url = default_ws_url;
        this.my_div = null;
        this.input = null;
        this.cb_obj = cb_obj;
        console.assert(typeof cb_obj.connect == 'function');
        console.assert(typeof cb_obj.disconnect == 'function');
        this.cb_param = cb_param;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        DomUtl.drawTitle(this.my_div, this.title, "h4");
        this.my_div.setAttribute("class", style);
        this.input = DomUtl.drawTextInput(this.my_div, this.default_ws_url);
        DomUtl.drawBr(this.my_div);
        this.connect_button_div = DomUtl.emptyDiv(this.my_div);
        this.drawConnectButton();
        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    GetWsUrl() {
        return this.input.value;
    }

    drawConnectButton() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.drawButton(this.connect_button_div, "Connect",
            (function() {this.cb_obj.connect(this.cb_param)}).bind(this));
    }

    drawConnecting() {
        DomUtl.deleteChildren(this.connect_button_div);
        var connect_button = DomUtl.drawButton(this.connect_button_div,
                                              "Connecting", function() {});
        connect_button.disabled = true;
    }

    drawDisconnectButton() {
        DomUtl.deleteChildren(this.connect_button_div);
        DomUtl.drawButton(this.connect_button_div, "Disconnect",
            (function() {this.cb_obj.disconnect(this.cb_param)}).bind(this));
    }
}

exports.WebsocketConnectUi = WebsocketConnectUi;
