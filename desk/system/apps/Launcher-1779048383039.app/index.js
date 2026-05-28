export var name = "Launcher";
var win;
var launcherOpen;
export async function launch(FS, UI, WD) {
    const shelf = UI.create('div', document.body, 'shelf');
    const layout = UI.leftRightLayout(undefined, shelf);
    shelf.style.zIndex = "2147483620";

    if (WD.mobile === true) shelf.style.borderRadius = "0px"; shelf.style.borderTop = "1px solid rgba(var(--ui-2)";

    const startBtn = UI.button('', layout.left, 'button', 'shelf-button');
    UI.create('div', UI.create('div', startBtn, 'shelf-button-layer-2'), 'shelf-button-layer-3');
    startBtn.addEventListener('click', async function () {
        const rect = await shelf.getBoundingClientRect();
        UI.systemElements.rect.shelf = rect;
        if (WD.debug === true) console.log(rect);
        await launcher(FS, UI, WD, rect);
    });

    UI.systemElements.taskbarAppButtonList = UI.create('div', layout.left, 'button-list-horizontal');

    const controlsBtn = UI.button('4:20 PM', layout.right, 'md-text-button');
    controlsBtn.innerText = UI.getDate();
    setInterval(function () {
        controlsBtn.innerText = UI.getDate();
    }, 1000);
    controlsBtn.addEventListener('click', async function () {
        const rect = await shelf.getBoundingClientRect();
        UI.systemElements.rect.shelf = rect;
        if (WD.debug === true) console.log(rect);
        await launcher(FS, UI, WD, rect);
    });

    const rect = await shelf.getBoundingClientRect();
    UI.systemElements.rect.shelf = rect;
}

export async function launcher(FS, UI, WD, shelfRect) {
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
    win.style.zIndex = "999999999999";
    if (WD.mobile === true) {
        win.style.top = "4px";
        win.style.right = "4px";
        win.style.width = "auto";
    }
    const searchBoxContainer = UI.create('div', win);
    searchBoxContainer.style = `padding: var(--padding-normal); padding-bottom: 0px;`;
    const searchApps = UI.input('Search apps', searchBoxContainer, undefined, 'wide');
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
        apps.forEach(async function (file) {
            const manifest = JSON.parse(await FS.read(file.path + "/manifest.json"))
            const btn = UI.button(manifest.name, filesView, 'md-filled-button');
            const layout = UI.leftRightLayout(undefined, btn);

            btn.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                const menu = UI.contextMenu(event);
                const delbtn = UI.button('Delete', menu.menu, 'button', 'list-button');
                delbtn.addEventListener('click', function () {
                    const dialog = UI.create('div', document.body, 'dialog-box');
                    UI.text('Uninstall ' + manifest.name, dialog, 'bold');
                    UI.text(`This app and its data will be deleted.`, dialog).style.textDecoration = "underline";

                    const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        dialog.remove();
                    });

                    const select = UI.button('Uninstall', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', async function () {
                        dialog.innerHTML = "Removing...";
                        await FS.rm(manifest.fsPath);
                        dialog.remove();
                    });
                });
                menu.finish();
            });

            btn.addEventListener('click', async function () {
                if (file.kind === "directory") {
                    removeLauncher();
                    const app = await WD.loadModule(manifest.fsPath + "/index.js", true);
                    const editor = await app.launch(FS, UI, WD);
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

export async function close(FS, UI, WD) {
    if (WD.debug === true) console.log(`<!> Terminating desktop...`);
}