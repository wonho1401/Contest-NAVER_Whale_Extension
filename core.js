class core {
    load(key) {
        let data = window.localStorage[key];
        if (typeof data === "undefined") {
            return null;
        }
        return JSON.parse(data);
    }
    save(key, data) {
        window.localStorage[key] = JSON.stringify(data);
        return true;
    }
    getUserID() {
        let uid = this.load('UID');
        if (uid) {
            return uid;
        } else {
            let buf = new Uint32Array(4), idx = -1;
            window.crypto.getRandomValues(buf);
            uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                idx++;
                let r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }.bind(this));
            this.save('UID', uid);
            return uid;
        }
    }
}
