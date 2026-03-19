export var name = "Launcher";

export async function launch(FS, UI, core) {
    const shelf = UI.create('div', document.body, 'shelf');
    const layout = UI.leftRightLayout(undefined, shelf);

    const startBtn = UI.button('', layout.left, 'button', 'shelf-button');
    UI.create('div', UI.create('div', startBtn, 'shelf-button-layer-2'), 'shelf-button-layer-3');
    startBtn.addEventListener('click', async function () {
        await launcher(FS, UI, core);
    });

    const controlsBtn = UI.button('4:20 PM', layout.right, 'md-text-button');
    controlsBtn.addEventListener('click', async function () {
        const rect = await shelf.getBoundingClientRect()
        await launcher(FS, UI, core, rect);
    });
}

export async function launcher(FS, UI, core, shelfRect) {
    const win = UI.window('Launcher');
    const filesView = UI.create('div', win.main.content);
    win.main.window.style.height = "300px";
    win.main.window.style.width = "300px";

    if (shelfRect) {
        console.log(shelfRect);
        win.main.window.style.left = "4px";
        win.main.window.style.bottom = shelfRect.bottom + 8 + "px";
    }

    async function refreshLauncher() {
        const apps = await FS.ls('/apps/');
        filesView.innerHTML = "";
        Object.values(apps).forEach(function (file) {
            const btn = UI.button('', filesView, 'button', 'list-button');
            console.log(btn);
            const layout = UI.leftRightLayout(undefined, btn);

            if (file.kind === "directory") {
                layout.left.innerText = "" + file.name;
            } else {
                btn.style.display = "none";
            }

            layout.right.innerText = "⋮";

            btn.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                const menu = UI.contextMenu(event);
                UI.button('Delete', menu.menu, 'button', 'list-button');
                menu.finish();
            });

            btn.addEventListener('click', async function () {
                if (file.kind === "directory") {
                    const app = await core.loadModule(file.path + "/index.js", true);
                    const editor = await app.launch(FS, UI, core);
                }
            });
        });
    }
    const refresh = UI.button('Refresh', win.titlebar.buttons, 'button', 'small-button');
    refresh.addEventListener('click', () => refreshLauncher());
    const close = UI.button('Close', win.titlebar.buttons, 'button', 'small-button');
    close.addEventListener('click', () => win.main.window.remove());
    await refreshLauncher();
}