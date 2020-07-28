// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

class Uuid {
    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0;
                var v = (c == 'x') ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }

    static isUuid(uuid_str) {
        var re = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        return re.test(uuid_str);
    }
}

exports.Uuid = Uuid;
