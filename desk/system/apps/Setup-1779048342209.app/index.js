export var name = "Setup";

export async function launch(FS, UI, WD) {
    const backgroundDiv = UI.create('div', document.body, 'setup-flex-container');
    backgroundDiv.style.zIndex = "999999999999";
    const styles = UI.create('style', backgroundDiv, 'hide');
    styles.textContent = `.setup-flex-container {
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0);
    -webkit-backdrop-filter: blur(var(--blur-main));
    backdrop-filter: blur(var(--blur-main));
}

.setup-window {
    width: 600px;
    height: 400px;
    background-color: rgba(var(--ui-1), 1);
    border-radius: var(--radii-main);
    box-shadow: var(--big-shadow);
    padding: 20px;
    overflow: auto;
    max-width: 95% !important;
    max-height: 95% !important;
}`
    const div = UI.create('div', backgroundDiv, 'setup-window');
    const close = UI.button('Skip for now', div, 'md-outlined-button', 'wide');
    close.addEventListener('click', async function () {
        const Launcher = await WD.loadModule('/system/apps/Launcher-1779048383039.app/index.js', true);
        const editor = await Launcher.launch(FS, UI, WD).then(function () {
            UI.anims.fadeOut(backgroundDiv).then(function () {
                backgroundDiv.remove();
            });
        });
    });

    const container = UI.create('div', div, 'window-content');
    var pane;
    const panes = {
        welcome: async function () {
            const newPane = UI.create('div');

            await UI.img('/system/img/webdesk.png', newPane, 'header-image');
            UI.text('Welcome to WebDesk!', newPane, 'bold');
            UI.text(`Let's get you set up.`, newPane);

            const nextBtn = UI.button('Next', newPane, 'md-filled-button');
            nextBtn.addEventListener('click', async function () {
                const newPane2 = await panes.quickStart();
                container.appendChild(newPane2);
                UI.anims.crossFade(newPane, newPane2, 'block').then(function () {
                    pane.remove();
                    pane = newPane2;
                });
            });

            return newPane;
        },
        quickStart: async function () {
            const newPane = UI.create('div');

            await UI.img('/system/img/setup/quick.png', newPane, 'header-image');
            UI.text('Quick Start', newPane, 'bold');
            UI.text(`You can transfer the files from your old WebDesk to this one.`);

            const skipBtn = UI.button('Skip', newPane, 'md-filled-button');
            skipBtn.addEventListener('click', async function () {
                const newPane2 = await panes.login();
                container.appendChild(newPane2);
                UI.anims.crossFade(newPane, newPane2, 'block').then(function () {
                    pane.remove();
                    pane = newPane2;
                });
            });

            return newPane;
        },
        login: async function () {
            const newPane = UI.create('div');

            await UI.img('/system/img/setup/user.svg', newPane, 'header-image');
            UI.text('Sign into WebDesk', newPane, 'bold margin-bottom-small');
            UI.text(`Create a WebDesk account to talk with other users and access online services.`);

            const usernameInput = UI.input('Username', newPane, 'text', 'wide margin-bottom-small');
            const passwordInput = UI.input('Password', newPane, 'password', 'wide margin-bottom-small');

            const createBtn = UI.button('Create Account', newPane, 'md-filled-button');
            createBtn.addEventListener('click', function () {
                WD.socket.emit('newacc', { user: usernameInput.value, pass: passwordInput.value });
                WD.socket.on('token', async function (token) {
                    await FS.write(FS.normalizeUserPath('config/token'), token.token);
                    await set.write('setupdone', 'true');
                    const newPane2 = await panes.setupDone();
                    container.appendChild(newPane2);
                    UI.anims.crossFade(newPane, newPane2).then(function () {
                        pane.remove();
                        pane = newPane2;
                    });
                });

                WD.socket.on('logininstead', async function (token) {
                    const dialog = UI.create('div', document.body, 'dialog-box');
                    UI.text('Login as ' + usernameInput.value + "?", dialog, 'bold');
                    UI.text('This account already exists.', dialog);

                    const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        dialog.remove();
                    });

                    const select = UI.button('Login', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', async function () {
                        WD.socket.emit('signin', { user: usernameInput.value, pass: passwordInput.value });
                        UI.anims.fadeOut(dialog).then(() => dialog.remove());
                    });
                });
            });

            return newPane;
        },
        setupDone: async function () {
            await set.write('setupdone', 'true');
            const newPane = UI.create('div');

            await UI.img('/system/img/setup/check.svg', newPane, 'header-image');
            UI.text('Setup complete', newPane, 'bold');
            UI.text(`Restart to use WebDesk whenever you're ready.`, newPane);

            const reBtn = UI.button('Restart', newPane, 'md-filled-button');
            reBtn.addEventListener('click', function () {
                window.location.reload();
            });

            return newPane;
        }
    }

    const welcomePane = await panes.welcome();
    pane = welcomePane;
    container.appendChild(pane);
}