const win = UI.window('Settings');
win.main.window.style.height = "300px";
win.main.window.style.width = "300px";
const settingsView = UI.create('div', win.main.content);
var panes = {
    General: async function () {
        const pane = UI.create('div');
        UI.text('General', pane);
        const workerBtn = UI.button('Service worker', pane, 'md-filled-button', 'wide');
        workerBtn.addEventListener('click', async function () {
            
        });
        return pane;
    }
}

const genPane = await panes.General();
settingsView.appendChild(genPane);