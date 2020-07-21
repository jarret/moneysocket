class Utils {
    static DeleteChildren(n) {
        n.innerHTML = "";
    }

    static DrawBr(div) {
        var br = document.createElement("br");
        div.appendChild(br);
        return br;
    }

    static DrawNote(div, msg) {
        var h = document.createElement("h3");
        var t = document.createTextNode(msg);
        h.appendChild(t);
        div.appendChild(h);
        return h;
    }

    static DrawButton(div, label, func) {
        var b = document.createElement("button");
        var t = document.createTextNode(label);
        b.appendChild(t);
        b.onclick = func;
        div.appendChild(b);
        return b;
    }

    static DrawTitle(div, titleText, size) {
        var t = document.createElement(size);
        var title = document.createTextNode(titleText);
        t.appendChild(title);
        div.appendChild(t);
        return t;
    }

    static DrawTextInput(div, defaultText) {
        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("size", "20");
        input.setAttribute("value", defaultText);
        div.appendChild(input);
        return input;
    }

    static DrawText(div, text) {
        var d = document.createElement("div");
        var t = document.createTextNode(text);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static DrawBigText(div, text) {
        var d = document.createElement("div");
        var t = document.createTextNode(text);
        d.setAttribute("style", "font-size: 200%");
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static DrawColoredText(div, text, color) {
        var d = document.createElement("div");
        d.style.color = color;
        var t = document.createTextNode(text);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static DrawBigBalance(div, msats) {
        var d = document.createElement("div");
        d.setAttribute("class", "balance");
        var s = (msats / 1000.0).toFixed(3) + " sats";
        var t = document.createTextNode(s);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static BalanceFmt(msats) {
        return (msats / 1000.0).toFixed(3) + " sats";
    }

    static DrawBalance(div, msats) {
        var d = document.createElement("div");
        var s = Utils.BalanceFmt(msats);
        var t = document.createTextNode(s);
        d.appendChild(t);
        div.appendChild(d);
        return d;
    }

    static EmptyDiv(div) {
        var d = document.createElement("div");
        div.appendChild(d);
        return d;
    }

    static EmptySection(div) {
        var s = document.createElement("section");
        div.appendChild(s);
        return s;
    }
}

exports.Utils = Utils;
