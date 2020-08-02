// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Kjua = require('kjua');

class DomUtl {
    static deleteChildren(n) {
        n.innerHTML = "";
    }

    static drawBr(div) {
        var br = document.createElement("br");
        div.appendChild(br);
        return br;
    }

    static drawNote(div, msg) {
        var h = document.createElement("h3");
        var t = document.createTextNode(msg);
        h.appendChild(t);
        div.appendChild(h);
        return h;
    }

    static drawButton(div, label, func) {
        var b = document.createElement("button");
        var t = document.createTextNode(label);
        b.appendChild(t);
        b.onclick = func;
        div.appendChild(b);
        return b;
    }

    static drawTitle(div, titleText, size) {
        var t = document.createElement(size);
        var title = document.createTextNode(titleText);
        t.appendChild(title);
        div.appendChild(t);
        return t;
    }

    static drawTextInput(div, defaultText) {
        var d = document.createElement("div");
        var i = document.createElement("input");
        i.setAttribute("type", "text");
        i.setAttribute("size", "20");
        i.setAttribute("value", defaultText);
        d.appendChild(i);
        div.appendChild(d);
        return d;
    }

    static drawTextArea(div) {
        var ta = document.createElement("textarea");
        ta.setAttribute("class", "nice");
        div.appendChild(ta);
        return ta;
    }

    static drawText(div, text) {
        var d = document.createElement("div");
        var t = document.createTextNode(text);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static drawBigText(div, text) {
        var d = document.createElement("div");
        var t = document.createTextNode(text);
        d.setAttribute("style", "font-size: 200%");
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static drawColoredText(div, text, color) {
        var d = document.createElement("div");
        d.style.color = color;
        var t = document.createTextNode(text);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static drawBigBalance(div, msats) {
        var d = document.createElement("div");
        d.setAttribute("class", "balance");
        var s = (msats / 1000.0).toFixed(3) + " sats";
        var t = document.createTextNode(s);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static balanceFmt(msats) {
        return (msats / 1000.0).toFixed(3) + " sats";
    }

    static brawBalance(div, msats) {
        var d = document.createElement("div");
        var s = DomUtl.balanceFmt(msats);
        var t = document.createTextNode(s);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static emptyDiv(div) {
        var d = document.createElement("div");
        div.appendChild(d);
        return d;
    }

    static emptySection(div) {
        var s = document.createElement("section");
        div.appendChild(s);
        return s;
    }

    static qrCode(div, bech32str, protocol_prefix) {
        var copy_str = bech32str;
        var b32 = bech32str.toUpperCase();
        var b = document.createElement("div");
        var copied = document.createElement("div");
        var qr = Kjua({
            ecLevel: "M",
            render:  "canvas",
            size:    120,
            text:    b32,
            quiet:   0,
        });

        /*
        b.onclick = function copyToClipboard() {
            //window.clipboardData.setData("Text", copy_str);
            navigator.clipboard.writeText(copy_str);
            DomUtl.deleteChildren(copied);
            var t = document.createTextNode("copied!");
            copied.appendChild(t);
        };
        */
        b.appendChild(qr);
        b.appendChild(copied);
        div.appendChild(b);
    }

}

exports.DomUtl = DomUtl;