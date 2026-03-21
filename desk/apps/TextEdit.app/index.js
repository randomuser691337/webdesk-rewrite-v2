export var name = "TextEdit";

export async function launch(FS, UI, core) {
    const mod = await core.loadModule('/apps/Files.app/index.js', true);
    console.log(mod);
    const filePicker = await mod.pickFile(FS, UI, core, { name: "TextEdit" });
    if (filePicker !== false) {
        editor(filePicker.path);
    }
}

export async function editor(path, contents) {
    const textedit = UI.window('TextEdit');
    const AceModule = await core.loadModule('/system/ace.js', true);
    const textarea = ace.edit(textedit.main.content);
    if (contents && contents !== undefined) {
        textarea.setValue(contents);
    } else if (path) {
        textarea.setValue(await FS.read(path));
    } else {
        textarea.placeholder = `Start typing... [New File]`;
    }

    textarea.setOptions({
        fontFamily: 'monospace',
        fontSize: "16px"
    });

    textedit.main.content.style.height = "400px";
    textedit.main.window.style.width = "480px";
    const buttonContainer = UI.container(undefined, textedit.main.window, 'column-button-container');
    buttonContainer.style.padding = "var(--padding-normal)";

    const save = UI.button('Save', buttonContainer);
    save.addEventListener('click', async function () {
        await FS.write(path, textarea.getSession().getValue(), 'text');
        console.log('<i> Saved!');
    });

    const saver = UI.button('Save & restart', buttonContainer, 'md-outlined-button');
    saver.addEventListener('click', async function () {
        await FS.write(path, textarea.getSession().getValue(), 'text');
        await window.location.reload();
    });
}