export var name = "DeskIDE";

export async function launch(FS, UI, core, path) {
    // path must be a string
    const window = UI.window('DeskIDE');
    window.main.content.style = "display: flex; padding: 0px;";
    const sidebar = UI.create('div', window.main.content, 'window-split-sidebar');
    let content;
    function createContentBox() {
        content = UI.create('div', window.main.content, 'window-split-content');
        content.style.padding = "0px";
    }
    window.main.window.style.overflow = "hidden";
    const calc = UI.math.calcRes(80, 80);
    window.main.window.style.height = calc.h + "px";
    window.main.window.style.width = calc.w + "px";
    const AceModule = await core.loadModule('/system/ace-rebuild.js', true);
    function returnBtnStyles() {
        return "font-family: 'Roboto'; background: transparent; font-size: 12px; border: none; display: block; box-sizing: border-box; text-align: left; cursor: pointer;";
    }
    // Original version of buildFSNode written by me; new version corrected/rebuilt by Claude and modified by me.
    async function buildFSNode(path, el) {
        const ls = await FS.ls(path);

        const container = UI.create('div', el);
        container.style.paddingLeft = "5px";
        container.style.marginLeft = "5px";

        const label = path === '/'
            ? '˅ /'
            : '˅ ' + path.replace(/\/+$/, '').split('/').pop();

        const btn = UI.button(label, container, 'button');
        btn.style.cssText = returnBtnStyles();
        btn.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            const ctx = UI.contextMenu(event);

            const open = UI.button('Open Folder', ctx.menu, 'button', 'list-button');
            open.addEventListener('mouseup', async function () {
                ctx.closeMenu(document.body);
                let thing = await core.loadModule('/apps/DeskIDE.app/index.js', true);
                await thing.launch(FS, UI, core, path);
                window.main.window.remove();
            });

            const newWindow = UI.button('Open Folder in New Window', ctx.menu, 'button', 'list-button');
            newWindow.addEventListener('mouseup', async function () {
                ctx.closeMenu(document.body);
                let thing = await core.loadModule('/apps/DeskIDE.app/index.js', true);
                await thing.launch(FS, UI, core, path);
            });

            const fileTextEditbtn = UI.button('Open Folder in Files', ctx.menu, 'button', 'list-button');
            fileTextEditbtn.addEventListener('mouseup', async function () {
                ctx.closeMenu(document.body);
                let thing = await core.loadModule('/apps/Files.app/index.js', true);
                await thing.launch(FS, UI, core, path);
            });

            const button = UI.button('Delete', ctx.menu, 'button', 'list-button hidden');
            button.addEventListener('mouseup', async function () {
                ctx.closeMenu(document.body);
                await FS.rm(path);
            });
        })

        const childContainer = UI.create('div', container);
        childContainer.style.paddingLeft = "4px";
        childContainer.style.marginLeft = "5px";
        childContainer.style.borderLeft = '1px solid rgba(var(--accent), 1.0)';
        let expanded = false;
        let loaded = false;

        btn.addEventListener('click', async function () {
            expanded = !expanded;
            childContainer.style.display = expanded ? 'block' : 'none';

            if (!loaded) {
                loaded = true;
                for (const file of Object.values(ls)) {
                    if (file.kind === 'directory') {
                        await buildFSNode(file.path, childContainer);
                    } else {
                        const fileBtn = UI.button(file.name, childContainer, 'button');
                        fileBtn.style.cssText = returnBtnStyles();
                        fileBtn.addEventListener('click', () => openNewEditor(file.path));
                    }
                }
            }
        });

        childContainer.style.display = 'none';
        return container;
    }

    if (typeof path === "string") {
        await buildFSNode(path, sidebar);
    } else {
        await buildFSNode('/', sidebar);
    }

    let currentEditor;

    async function openNewEditor(path) {
        if (currentEditor) {
            await currentEditor.destroy();
            content.remove();
        }
        createContentBox();
        await Editor(path);
    }

    async function Editor(path) {
        console.log(AceModule);
        currentEditor = ace.edit(content);
        if (path) {
            if (path.endsWith('.js') || path.endsWith('.js/')) {
                currentEditor.session.setMode("ace/mode/javascript");
            }
            currentEditor.setValue(await FS.read(path), -1);
            currentEditor.session.getUndoManager().reset();
        }

        currentEditor.setOptions({
            fontFamily: 'Roboto Mono',
            fontSize: "12px"
        });

        window.titlebar.text.innerHTML = "";
        window.titlebar.main.style.padding = "var(--padding-small)";
        const buttonContainer = UI.container(undefined, window.titlebar.text, 'column-button-container full-width');
        var menuOpen = false;
        var menuCloseFunction = false;
        var menuName = undefined;

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
                currentEditor.getSession().getUndoManager().undo();
            },
            redo: function () {
                currentEditor.getSession().getUndoManager().redo();
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

                const newWindow = UI.button('New Window', ctx.menu, 'button', 'list-button');
                newWindow.addEventListener('mouseup', async function () {
                    let thing = await core.loadModule('/apps/DeskIDE.app/index.js', true);
                    await thing.launch(FS, UI, core);
                });

                UI.divider(ctx.menu);

                const filebtn = UI.button('Open File...', ctx.menu, 'button', 'list-button');
                filebtn.addEventListener('mouseup', async function () {
                    const mod = await core.loadModule('/apps/Files.app/index.js', true);
                    const filePicker = await mod.pickFile(FS, UI, core, { name: "DeskIDE" });
                    if (filePicker !== false) {
                        openNewEditor(filePicker.path);
                    }
                });

                const fileTextEditbtn = UI.button('Open File in TextEdit...', ctx.menu, 'button', 'list-button');
                fileTextEditbtn.addEventListener('mouseup', async function () {
                    let thing = await core.loadModule('/apps/TextEdit.app/index.js', true);
                    await thing.launch(FS, UI, core);
                });

                UI.divider(ctx.menu);

                const button = UI.button('Save', ctx.menu, 'button', 'list-button');
                button.addEventListener('mouseup', async function () {
                    await FS.write(path, currentEditor.getSession().getValue(), 'text');
                    closeMenu();
                });

                const saver = UI.button('Save & restart', ctx.menu, 'button', 'list-button');
                saver.addEventListener('mouseup', async function () {
                    await FS.write(path, currentEditor.getSession().getValue(), 'text');
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
                    currentEditor.execCommand('find');
                    closeMenu();
                });

                const replacebtn = UI.button('Replace', ctx.menu, 'button', 'list-button');
                replacebtn.addEventListener('mouseup', async function () {
                    currentEditor.execCommand('replace');
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
                    currentEditor.selectAll();
                    closeMenu();
                });

                menuOpen = true;
                menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            tools: function () {
                if (menuOpen === true) {
                    closeMenu();
                }

                menuName = "Tools";
                const rect = toolsButton.getBoundingClientRect();
                const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 }
                const ctx = UI.contextMenu(event, [toolsButton], function () { menuOpen = false; });

                const restartDeskIDE = UI.button('Restart DeskIDE', ctx.menu, 'button', 'list-button');
                restartDeskIDE.addEventListener('mouseup', async function () {
                    window.main.window.remove();
                    let thing = await core.loadModule('/apps/DeskIDE.app/index.js', true);
                    await thing.launch(FS, UI, core);
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

        const toolsButton = UI.button('Tools', buttonContainer, 'button', 'titlebar-button');
        setupmousedown(toolsButton, 'Tools', menu.tools);

        currentEditor.resize();
    }

    if (typeof path === "string") {
        await openNewEditor('/apps/DeskIDE.app/placeholder.txt');
    } else {
        path = "/apps/DeskIDE.app/"
        await openNewEditor("/apps/DeskIDE.app/index.js");
    }
}