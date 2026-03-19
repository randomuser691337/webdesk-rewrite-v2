export var name = "TextEdit";

export async function launch(FS, UI, core) {
    const mod = await core.loadModule('/apps/Files.app/index.js', true);
    console.log(mod);
    const filePicker = await mod.pickFile(FS, UI, core, { name: "TextEdit" });
    if (filePicker !== false) {
        editor(filePicker.path, filePicker.type);
    }
}

export async function editor(path) {
    const textedit = UI.window('TextEdit - Init code');
    const textarea = UI.create('textarea', textedit.main.content);
    textarea.spellcheck = "off";
    textarea.value = await FS.read(path);
    textarea.spellcheck = "false";
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.height = "400px";
    textedit.main.window.style.width = "480px";

    const buttonContainer = UI.container(undefined, textedit.main.content, 'column-button-container');

    const save = UI.button('Save', buttonContainer);
    save.addEventListener('click', async function () {
        await FS.write('/system/init.js', textarea.value, 'text');
        console.log('<i> Saved!');
    });

    const saver = UI.button('Save & restart', buttonContainer, 'md-outlined-button');
    saver.addEventListener('click', async function () {
        await FS.write('/system/init.js', textarea.value, 'text');
        await window.location.reload();
    });
}