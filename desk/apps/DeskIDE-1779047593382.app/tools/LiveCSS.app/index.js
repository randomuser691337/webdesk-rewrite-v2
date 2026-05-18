export var name = "LiveCSS";

export async function launch(FS, UI, WD) {
    const textedit = UI.window('LiveCSS');
    const AceModule = await WD.loadModule('/system/ace-rebuild.js', true);
    console.log(AceModule);
    const textarea = ace.edit(textedit.main.content);
    const style = UI.create('style', document.body);
    textarea.setOptions({
        fontFamily: 'Roboto Mono',
        fontSize: "12px"
    });

    if (WD.mobile === false) {
        textedit.main.content.style.height = "400px";
        textedit.main.window.style.width = "480px";
    }
    textedit.titlebar.text.innerHTML = "";
    textedit.titlebar.main.style.padding = "var(--padding-small)";
    const buttonContainer = UI.container(undefined, textedit.titlebar.text, 'column-button-container full-width');
    var menuOpen = false;
    var menuCloseFunction = false;
    var menuName = undefined;

    textarea.textInput.getElement().addEventListener('keydown', function (e) {
        style.textContent = textarea.getSession().getValue();
    });

    function closeMenu() {
        menuCloseFunction(document.body);
    }

    function handleToolBtn(name, func) {
        if (menuOpen === true) {
            if (menuName === name) {
                closeMenu()
            } else {
                closeMenu();
                func();
            }
        } else {
            func();
        }
    }

    function handleHoverToolBtn(name, func) {
        if (menuOpen === true) {
            if (menuName === name) {
                // do ABSOLUTELY nothing
            } else {
                closeMenu();
                func();
            }
        }
    }

    var editor = {
        undo: function () {
            textarea.getSession().getUndoManager().undo();
        },
        redo: function () {
            textarea.getSession().getUndoManager().redo();
        }
    }

    var menu = {
        file: function () {
            if (menuOpen === true) {
                closeMenu();
            }

            menuName = "File";

            const rect = fileButton.getBoundingClientRect();

            const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 }

            const ctx = UI.contextMenu(event, [fileButton], function () { menuOpen = false; });

            const filebtn = UI.button('Open File...', ctx.menu, 'button', 'list-button');
            filebtn.addEventListener('mouseup', async function () {
                let thing = await WD.loadModule('/apps/TextEdit-1779048336412.app/index.js', true);
                await thing.launch(FS, UI, WD);
                thing = undefined;
            });

            UI.divider(ctx.menu);

            const button = UI.button('Save', ctx.menu, 'button', 'list-button');
            button.addEventListener('mouseup', async function () {
                await FS.write(path, textarea.getSession().getValue(), 'text');
                closeMenu();
            });

            const saver = UI.button('Save & restart', ctx.menu, 'button', 'list-button');
            saver.addEventListener('mouseup', async function () {
                await FS.write(path, textarea.getSession().getValue(), 'text');
                await window.location.reload();
            });

            menuOpen = true;
            menuCloseFunction = ctx.closeMenu;
            ctx.finish();
        },
        edit: function () {
            if (menuOpen === true) {
                closeMenu();
            }

            menuName = "Edit";
            const rect = editButton.getBoundingClientRect();
            const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 }
            const ctx = UI.contextMenu(event, [editButton], function () { menuOpen = false; });

            const findbtn = UI.button('Find', ctx.menu, 'button', 'list-button');
            findbtn.addEventListener('mouseup', async function () {
                textarea.execCommand('find');
                closeMenu();
            });

            UI.divider(ctx.menu);

            const undobtn = UI.button('Undo', ctx.menu, 'button', 'list-button');
            undobtn.addEventListener('mouseup', async function () {
                editor.undo();
                closeMenu();
            });

            const redobtn = UI.button('Redo', ctx.menu, 'button', 'list-button');
            redobtn.addEventListener('mouseup', async function () {
                editor.redo();
                closeMenu();
            });

            menuOpen = true;
            menuCloseFunction = ctx.closeMenu;
            ctx.finish();
        },
        selection: function () {
            if (menuOpen === true) {
                closeMenu();
            }

            menuName = "Selection";
            const rect = selectionButton.getBoundingClientRect();
            const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 }
            const ctx = UI.contextMenu(event, [selectionButton], function () { menuOpen = false; });

            const sabtn = UI.button('Select All', ctx.menu, 'button', 'list-button');
            sabtn.addEventListener('mouseup', async function () {
                textarea.selectAll();
                closeMenu();
            });

            menuOpen = true;
            menuCloseFunction = ctx.closeMenu;
            ctx.finish();
        }
    }

    function setupmousedown(button, name, func) {
        button.addEventListener('mousedown', async function () {
            handleToolBtn(name, func);
        });

        button.addEventListener('mouseover', function () {
            handleHoverToolBtn(name, func);
        });
    }

    const fileButton = UI.button('File', buttonContainer, 'button', 'titlebar-button');
    setupmousedown(fileButton, 'File', menu.file);

    const editButton = UI.button('Edit', buttonContainer, 'button', 'titlebar-button');
    setupmousedown(editButton, 'Edit', menu.edit);

    const selectionButton = UI.button('Selection', buttonContainer, 'button', 'titlebar-button');
    setupmousedown(selectionButton, 'Selection', menu.selection);

    textarea.resize();
    textedit.finish();
}