export var name = "Launcher";
var win;
var launcherOpen;
export async function launch(FS, UI, core) {
    const shelf = UI.create('div', document.body, 'shelf');
    const layout = UI.leftRightLayout(undefined, shelf);

    const startBtn = UI.button('', layout.left, 'button', 'shelf-button');
    UI.create('div', UI.create('div', startBtn, 'shelf-button-layer-2'), 'shelf-button-layer-3');
    startBtn.addEventListener('click', async function () {
        const rect = await shelf.getBoundingClientRect();
        if (core.debug === true) console.log(rect);
        await launcher(FS, UI, core, rect);
    });

    const controlsBtn = UI.button('4:20 PM', layout.right, 'md-text-button');
    controlsBtn.addEventListener('click', async function () {
        const rect = await shelf.getBoundingClientRect();
        if (core.debug === true) console.log(rect);
        await launcher(FS, UI, core, rect);
    });
}

export async function launcher(FS, UI, core, shelfRect) {
    function removeLauncher() {
        launcherOpen = false;
        Animate(win, { opacity: [1, 0] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.remove());
    }
    if (launcherOpen === true) {
        removeLauncher();
        return;
    } else {
        launcherOpen = true;
    }
    win = UI.create('div', document.body, 'window');
    const filesView = UI.create('div', win, 'window-content brick-layout');
    filesView.style.minWidth = "200px";
    Animate(win, { opacity: [0, 1] }, { ease: "easeInOut", duration: UI.animSpeed.fast });

    if (shelfRect) {
        console.log(shelfRect);
        win.style.left = "4px";
        win.style.bottom = shelfRect.height + 4 + "px";
    }

    async function refreshLauncher() {
        const apps = await FS.ls('/apps/');
        filesView.innerHTML = "";
        Object.values(apps).forEach(function (file) {
            const btn = UI.button(file.name, filesView, 'md-filled-button');
            const layout = UI.leftRightLayout(undefined, btn);

            btn.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                const menu = UI.contextMenu(event);
                UI.button('Delete', menu.menu, 'button', 'list-button');
                menu.finish();
            });

            btn.addEventListener('click', async function () {
                if (file.kind === "directory") {
                    removeLauncher();
                    const app = await core.loadModule(file.path + "/index.js", true);
                    const editor = await app.launch(FS, UI, core);
                }
            });
        });
    }

    const buttons = UI.create('div', win, 'window.titlebar');
    buttons.classList = "column-button-container";
    buttons.style = "padding: var(--padding-normal); padding-top: 0px !important";
    const about = UI.button('About', buttons, 'button', 'small-button');
    about.addEventListener('click', function () {
        removeLauncher();
        const win = UI.window('About WebDesk');
        const mainPane = UI.create('div', win.main.content);
        UI.text('WebDesk 0.3.3', mainPane, 'bold');
        UI.text(`Designed by dbh_ra9`, mainPane);
        win.finish();
    });
    const refresh = UI.button('Refresh', buttons, 'button', 'small-button');
    refresh.addEventListener('click', () => refreshLauncher());
    const close = UI.button('Close', buttons, 'button', 'small-button');
    close.addEventListener('click', () => removeLauncher());
    await refreshLauncher();
}

export async function close(FS, UI, core) {
    if (core.debug === true) console.log(`<!> Terminating desktop...`);
}