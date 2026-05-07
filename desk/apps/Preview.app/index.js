export var name = "Preview";
var win;
var core2;

export async function launch(FS, UI, core, path) {
    core2 = core;
    async function open(data, isBlobContents, title = "Preview") {
        var contents;
        win = UI.window(path, core.tasks[id].task);
        win.main.content.style = "backdrop-filter: blur(0px); padding: 0px";
        win.main.window.style.width = "450px";
        win.finish();

        const img = new Image();

        if (isBlobContents !== true) {
            FS.read(data).then(blob => {
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }).catch(err => {
                UI.text(`An error occured while loading this image.`, win.main.content);
                UI.text(`Developer details: ` + err, win.main.content);
                return;
            });
        } else {
            const url = URL.createObjectURL(contents);
            img.onload = () => {
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }

        img.style = "max-width: 100%";
        win.main.content.appendChild(img);
    }

    if (!path) {
        const code = await FS.read('/apps/Files.app/index.js');
        const mod = await core.loadModule(code);
        const path = await mod.pickFile(FS, UI, core, {name: "Preview"});
        if (path) {
            await open(path.path, false, path);
        } else {
            console.warn('No file selected');
        }
    }

    return {
        open: open
    };
}

export async function close() {

}