async function startsockets() {
    const devsocket = await set.read('devsocket');
    return new Promise((resolve) => {
        try {
            if (core.socket) {
                core.socket.disconnect();
                core.socket = undefined;
            }

            if (devsocket === "true") {
                core.socket = io('wss://webdeskbeta.meower.xyz/');
                UI.notif('Using beta socket server', 'This is for testing purposes only and might not even be online.');
            } else {
                core.socket = io("wss://webdesk.meower.xyz/");
            }

            const timeout = setTimeout(() => {
                console.log('<!> Connection timeout: No response in 6 seconds');
                core.socket.disconnect();
                core.socket = undefined;
                resolve(false);
            }, 6000);

            /* if (params.get('listen') === "yes") {
                core.socket.onAny((event, ...args) => {
                    console.log(`Received event: ${event}`, args);
                });
            } */

            core.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.log('<!> Connection error: ', error);
                core.socket.disconnect();
                core.socket = undefined;
                resolve(false);
                sys.webid.priv = -1;
            });

            core.socket.on("servmsg", (data) => {
                UI.snack(data);
            });

            core.socket.on("umsg", (data) => {
                UI.snack(data);
            });

            core.socket.on("error", (data) => {
                if (data == "No token provided" && sys.setupd === false) {
                    console.log(`<!> Quiet error: ` + data);
                } else {
                    UI.snack(data);
                }
            });

            core.socket.on("force_update", (data) => {
                window.location.reload();
            });

            core.socket.on("connect", async () => {
                clearTimeout(timeout);
                const token = await FS.read(FS.normalizeUserPath('config/token'));
                console.log('<i> Connected to WebDesk server');
                if (token) {
                    core.socket.emit("login", token);
                } else {
                    console.log('<!> No token');
                }
                resolve(true);
            });

            core.socket.on("checkback", async (thing) => {
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
            if (core.socket) {
                core.socket.disconnect();
                core.socket = undefined;
            }
            resolve(false);
        }
    });
}
startsockets();