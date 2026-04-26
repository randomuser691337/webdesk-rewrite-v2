export async function launch(FS, UI, core) {
    const win = UI.window('Settings');
    win.main.window.style.height = "300px";
    win.main.window.style.width = "300px";
    const settingsView = UI.create('div', win.main.content);
    var panes = {
        Home: async function () {
            const pane = UI.create('div');
            UI.text('Settings', pane);
            const workerBtn = UI.button('General', pane, 'md-filled-button', 'wide');
            workerBtn.addEventListener('click', async function () {
                pane.remove();
                const genPane = await panes.General();
                settingsView.appendChild(genPane);
            });
            return pane;
        },
        General: async function () {
            const pane = UI.create('div');
            UI.text('General', pane);
            const transferEraseBtn = UI.button('Transfer or Erase WebDesk', pane, 'md-filled-button', 'wide');
            transferEraseBtn.addEventListener('click', async function () {
                pane.remove();
                const erasePane = UI.create('div', settingsView);
                const eraseBtn = UI.button('Erase All Content and Settings', erasePane, 'md-filled-button', 'wide');
                eraseBtn.addEventListener('click', async function () {
                    const div = UI.create('div', document.body);
                    div.style = `position: fixed; left: 0px; right: 0px; top: 0px; bottom: 0px; z-index: 9999999; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(var(--blur-main)); -webkit-backdrop-filter: blur(var(--blur-main)); animation: fade-in var(--anim-speed-slow) ease;`;
                    const dialog = UI.create('div', div, 'dialog-box');
                    const dialog1 = UI.create('div', dialog);
                    UI.text('Are you sure you want to erase all media, content and settings?', dialog1, 'bold');
                    UI.text(`This cannot be undone.`, dialog1);

                    const buttonCont = UI.create('div', dialog1, 'dialog-box-two-buttons');

                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        div.remove();
                    });

                    const select = UI.button('Erase WebDesk', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', async function () {
                        dialog1.remove();
                        const dialog2 = UI.create('div', dialog);
                        UI.text('Erasing...', dialog2, 'bold');
                        await FS.erase('I understand all data in WFS will be destroyed');
                        window.location.reload();
                    });
                });
            });
            return pane;
        }
    }

    const genPane = await panes.Home();
    settingsView.appendChild(genPane);
}