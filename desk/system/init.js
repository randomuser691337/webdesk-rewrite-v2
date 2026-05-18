(async function () {
    console.log('<i> Starting WebDesk...');
    await WD.loadScript('/system/ui.js', true);
    await WD.loadStyle('/system/styles.css', true);
    console.log(`<i> Initializing Material UI...`);
    await WD.loadScript('/system/mui.js', true);
    await UI.initialize();

    // variables
    await set.read('animsSlow').then(speed => {
        UI.animSpeed.slow = speed;
        UI.system.changeCSSVar('anim-speed-slow', `${speed}s`);
    });
    await set.read('animsMed').then(speed => {
        UI.animSpeed.med = speed;
        UI.system.changeCSSVar('anim-speed-med', `${speed}s`);
    });
    await set.read('animsFast').then(speed => {
        UI.animSpeed.fast = speed;
        UI.system.changeCSSVar('anim-speed-fast', `${speed}s`);
    });
    await set.read('font-family').then(font => {
        UI.system.changeCSSVar('md-ref-typeface-plain', font);
    });
    await set.read('mobile').then(mobile => {
        if (mobile === "true") WD.mobile = true;
    });

    const Launcher = await WD.loadModule('/system/apps/Launcher-1779048383039.app/index.js', true);
    const editor = await Launcher.launch(FS, UI, WD).then(function () {
        UI.anims.fadeOut(document.getElementById('webdesk-loading')).then(() => document.getElementById('webdesk-loading').remove());
        sys.booted = true;
    });

    async function startsockets() {
        const devsocket = await set.read('devsocket');
        return new Promise((resolve) => {
            try {
                if (WD.socket) {
                    WD.socket.disconnect();
                    WD.socket = undefined;
                }

                if (devsocket === "true") {
                    WD.socket = io('wss://webdeskbeta.meower.xyz/');
                    UI.notif('Using beta socket server', 'This is for testing purposes only and might not even be online.');
                } else {
                    WD.socket = io("wss://webdesk.meower.xyz/");
                }

                const timeout = setTimeout(() => {
                    console.log('<!> Connection timeout: No response in 6 seconds');
                    WD.socket.disconnect();
                    WD.socket = undefined;
                    resolve(false);
                }, 6000);

                /* if (params.get('listen') === "yes") {
                    WD.socket.onAny((event, ...args) => {
                        console.log(`Received event: ${event}`, args);
                    });
                } */

                WD.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.log('<!> Connection error: ', error);
                    WD.socket.disconnect();
                    WD.socket = undefined;
                    resolve(false);
                    sys.webid.priv = -1;
                });

                WD.socket.on("servmsg", (data) => {
                    UI.snack(data);
                });

                WD.socket.on("umsg", (data) => {
                    UI.snack(data);
                });

                WD.socket.on("error", (data) => {
                    if (data == "No token provided" && sys.setupd === false) {
                        console.log(`<!> Quiet error: ` + data);
                    } else {
                        UI.snack(data);
                    }
                });

                WD.socket.on("force_update", (data) => {
                    window.location.reload();
                });

                WD.socket.on("connect", async () => {
                    clearTimeout(timeout);
                    const token = await FS.read(FS.normalizeUserPath('config/token'));
                    console.log('<i> Connected to WebDesk server');
                    if (token) {
                        WD.socket.emit("login", token);
                    } else {
                        console.log('<!> No token');
                    }
                    resolve(true);
                });

                WD.socket.on("checkback", async (thing) => {
                    if (thing.error === true) {
                        await FS.del('/user/info/token');
                        window.location.reload();
                    } else {
                        sys.name = thing.username;
                        sd = thing.username;
                        await set.write('name', thing.username);
                        sys.webid.token = await FS.read(FS.normalizeUserPath('config/token'));
                        sys.webid.priv = thing.priv;
                        sys.webid.userid = thing.userid;
                        if (thing.priv === 0) {
                            UI.notif('Your account has been limited.', `You can still use WebDesk normally, but you can't use online services.`);
                        }
                        console.log(`<i> Logged in!
- Username: ${thing.username}
- Account permission level: ${thing.priv}
- UserID: ${thing.userid}
- Token: ${UI.truncater(sys.webid.token, 8)}`);
                    }
                    resolve(true);
                });
            } catch (error) {
                console.log(error);
                if (WD.socket) {
                    WD.socket.disconnect();
                    WD.socket = undefined;
                }
                resolve(false);
            }
        });
    }

    startsockets();

    const onlined = await WD.loadModule('/system/services/onlined.app/index.js', true);
    await onlined.launch(FS, UI, WD, sys.webid);
    UI.systemElements.notifArea = UI.create('div', document.body, 'notif-pane');

    WD.startLLMService = async function () {
        return new Promise(async (resolve, reject) => {
            if (WD.LLM.module === undefined) {
                const ai = await FS.read('/system/services/llmd.app/index.js');
                await WD.loadModule(ai).then(async (mod) => {
                    WD.LLM.module = mod;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    WD.startLLM = async function () {
        return new Promise(async (resolve, reject) => {
            await WD.startLLMService();
            WD.LLM.loaded = "loading";
            let readyResolve;
            let ready = new Promise((resolve) => {
                readyResolve = resolve;
            });
            let modelName = await set.read('LLMModel');
            if (!modelName) modelName = "Qwen3-0.6B-q4f32_1-MLC";
            await WD.LLM.module.main(UI, readyResolve, modelName);
            ready.then(() => {
                WD.LLM.loaded = true;
                resolve();
            });
        });
    }
})();