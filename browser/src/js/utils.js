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

    static DrawTitle(div, titleText) {
        var title = document.createTextNode(titleText);
        div.appendChild(title);
        return title;
    }

    static DrawTextInput(div, defaultText) {
        var input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("size", "25");
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

    static DrawBalance(div, msats) {
        var d = document.createElement("div");
        d.setAttribute("class", "balance");
        var s = (msats / 1000.0).toFixed(3) + " sats";
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
