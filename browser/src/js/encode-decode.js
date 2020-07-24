// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Utils = require('./utils.js').Utils;

class EncodeUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.opinion = "Bullish";
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = Utils.EmptyDiv(this.my_div);
        this.UpdateCurrentOpinion(this.opinion);

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        Utils.DrawButton(this.my_div, "Bullish",
            (function() {this.UpdateCurrentOpinion("Bullish")}).bind(this));
        Utils.DrawBr(this.my_div);
        Utils.DrawButton(this.my_div, "Bearish",
            (function() {this.UpdateCurrentOpinion("Bearish")}).bind(this));
        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    UpdateCurrentOpinion(opinion) {
        this.opinion = opinion
        Utils.DeleteChildren(this.opinion_div)
        Utils.DrawText(this.opinion_div, "Current Opinion: ");
        Utils.DrawBr(this.opinion_div);
        Utils.DrawBigText(this.opinion_div, opinion);
    }
}

class EncodeDecodeApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.edu = null;
    }


    DrawEncodeDecodeUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        Utils.DrawTitle(this.my_div, "Encode/Decode Beacon", "h1");

        this.edu = new EncodeUi(this.my_div);
        this.edu.Draw("center");
        Utils.DrawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }
}

window.app = new EncodeDecodeApp();

function DrawFirstUi() {
    window.app.DrawEncodeDecodeUi()
}

window.addEventListener("load", DrawFirstUi());
