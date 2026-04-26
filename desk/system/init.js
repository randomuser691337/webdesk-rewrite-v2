async function startsockets() {
    const devsocket = await set.read('devsocket');
    return new Promise((resolve) => {
        try {
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }

            if (devsocket === "true") {
                sys.socket = io('wss://webdeskbeta.meower.xyz/');
                UI.notif('Using beta socket server', 'This is for testing purposes only and might not even be online.');
            } else {
                sys.socket = io("wss://webdesk.meower.xyz/");
            }

            const timeout = setTimeout(() => {
                console.log('<!> Connection timeout: No response in 6 seconds');
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
            }, 6000);

            /* if (params.get('listen') === "yes") {
                sys.socket.onAny((event, ...args) => {
                    console.log(`Received event: ${event}`, args);
                });
            } */

            sys.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.log('<!> Connection error: ', error);
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
                webid.priv = -1;
            });

            sys.socket.on("servmsg", (data) => {
                UI.snack(data);
            });

            sys.socket.on("umsg", (data) => {
                UI.snack(data);
            });

            sys.socket.on("error", (data) => {
                if (data == "No token provided" && sys.setupd === false) {
                    console.log(`<!> Quiet error: ` + data);
                } else {
                    UI.snack(data);
                }
            });

            sys.socket.on("force_update", (data) => {
                window.location.reload();
            });

            sys.socket.on("connect", async () => {
                clearTimeout(timeout);
                const token = await FS.read('/user/info/token');
                console.log('<i> Connected to WebDesk server');
                if (token) {
                    sys.socket.emit("login", token);
                } else {
                    console.log('<!> No token');
                }
                resolve(true);
            });

            sys.socket.on("checkback", async (thing) => {
                if (thing.error === true) {
                    await FS.del('/user/info/token');
                    window.location.reload();
                } else {
                    sys.name = thing.username;
                    sd = thing.username;
                    await set.write('name', thing.username);
                    webid.token = await FS.read('/user/info/token');
                    webid.priv = thing.priv;
                    webid.userid = thing.userid;
                    if (thing.priv === 0) {
                        UI.notif('Your account has been limited.', `You can still use WebDesk normally, but you can't use online services.`);
                    }
                    console.log(`<i> Logged in!
- Username: ${thing.username}
- Account permission level: ${thing.priv}
- UserID: ${thing.userid}
- Token: ${UI.truncate(webid.token, 8)}`);
                }
                resolve(true);
            });
        } catch (error) {
            console.log(error);
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }
            resolve(false);
        }
    });
}
startsockets();