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

WD.startLLM = async function () {
    return new Promise(async (resolve, reject) => {
        const ai = await FS.read('/system/services/llmd.app/index.js');
        await WD.loadModule(ai).then(async (mod) => {
            // UI.System.llmRing('loading');
            WD.LLM.loaded = "loading";
            let readyResolve;
            let ready = new Promise((resolve) => {
                readyResolve = resolve;
            });
            let modelName = await set.read('LLMModel');
            if (!modelName) modelName = "Qwen2.5-0.5B-Instruct-q0f32-MLC";
            await mod.main(UI, readyResolve, modelName);
            ready.then(() => {
                WD.LLM.loaded = true;
                resolve();
            });
            WD.LLM.module = mod;
            set.del('chloe');
        });
    })
}