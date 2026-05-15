export var name = "DeskIDE";

// Folder browser debugged by Claude, tabs added by Claude

export async function launch(FS, UI, WD, path) {
    console.log(WD.tasks[id].task);
    const window = UI.window('Open - DeskIDE', WD.tasks[id].task, false);
    if (WD.mobile === false) {
        window.main.window.style.width = "320px";
    }
    const start = UI.create('div', window.main.content);
    UI.text('Open an existing project/folder, or start a new project/folder', start);
    const buttonCont = UI.create('div', start, 'dialog-box-two-buttons');

    const openExisting = UI.button('Open Existing', buttonCont, 'md-outlined-button');
    openExisting.addEventListener('click', async function () {
        const picker = await WD.loadApp('/apps/Files.app/index.js');
        const file = await picker.pickFile(FS, UI, WD, { name: "DeskIDE", type: "folder" });
        if (file) {
            await deskide(FS, UI, WD, file.path);
            window.close();
        }
    });

    const newProject = UI.button('New Project', buttonCont, 'md-filled-button', 'flex-grow-1');
    newProject.addEventListener('click', function () {

    });

    window.finish();
}

export async function deskide(FS, UI, WD, path) {
    const window = UI.window('DeskIDE');
    window.main.content.style = "display: flex; padding: 0px;";
    const sidebar = UI.create('div', window.main.content, 'window-split-sidebar');
    sidebar.style.width = UI.math.calcRes(15, 15).w + "px";

    const editorArea = UI.create('div', window.main.content, 'window-split-content');
    editorArea.style.cssText = "padding: 0px; display: flex; flex-direction: column; overflow: hidden; flex: 1;";

    const tabBar = UI.create('div', editorArea);
    tabBar.style.cssText = "display: flex; flex-direction: row; overflow-x: auto; overflow-y: hidden; flex-shrink: 0; background: rgba(var(--surface), 1.0); border-bottom: 1px solid rgba(var(--outline), 0.3); scrollbar-width: none;";

    const editorContainer = UI.create('div', editorArea);
    editorContainer.style.cssText = "flex: 1; overflow: hidden; position: relative;";

    window.main.window.style.overflow = "hidden";
    window.titlebar.main.style.padding = "4px";
    if (WD.mobile === false) {
        const calc = UI.math.calcRes(80, 80);
        window.main.window.style.height = calc.h + "px";
        window.main.window.style.width = calc.w + "px";
    }
    window.main.content.style.overflow = "hidden";
    window.finish();

    const AceModule = await WD.loadModule('/system/ace-rebuild.js', true);

    let tabs = [];
    let activeTab = null;

    function getTabByPath(path) {
        return tabs.find(t => t.path === path) || null;
    }

    function setActiveTab(tab) {
        if (activeTab === tab) return;

        if (activeTab) {
            activeTab.contentEl.style.display = 'none';
            activeTab.tabEl.style.background = 'transparent';
            activeTab.tabEl.style.borderBottom = '2px solid transparent';
        }

        activeTab = tab;
        tab.contentEl.style.display = 'block';
        tab.tabEl.style.background = 'rgba(var(--surface-variant), 0.5)';
        tab.tabEl.style.borderBottom = '2px solid rgba(var(--accent), 1.0)';

        tab.editor.resize();
        tab.editor.focus();
    }

    function closeTab(tab) {
        const idx = tabs.indexOf(tab);
        if (idx === -1) return;

        tab.tabEl.remove();
        tab.contentEl.remove();
        tab.editor.destroy();
        tabs.splice(idx, 1);

        if (activeTab === tab) {
            activeTab = null;
            if (tabs.length > 0) {
                setActiveTab(tabs[Math.max(0, idx - 1)]);
            }
        }
    }

    function returnBtnStyles() {
        return "font-family: 'font'; background: transparent; font-size: var(--small-fz); border: none; display: block; box-sizing: border-box; text-align: left; cursor: pointer;";
    }

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
                closeMenu();
                let thing = await WD.loadModule('/apps/DeskIDE.app/index.js', true);
                await thing.launch(FS, UI, WD, path);
                window.main.window.remove();
            });

            const newWindow = UI.button('Open Folder in New Window', ctx.menu, 'button', 'list-button');
            newWindow.addEventListener('mouseup', async function () {
                closeMenu();
                let thing = await WD.loadModule('/apps/DeskIDE.app/index.js', true);
                await thing.launch(FS, UI, WD, path);
            });

            const fileTextEditbtn = UI.button('Open Folder in Files', ctx.menu, 'button', 'list-button');
            fileTextEditbtn.addEventListener('mouseup', async function () {
                closeMenu();
                let thing = await WD.loadModule('/apps/Files.app/index.js', true);
                await thing.launch(FS, UI, WD, path);
            });

            const button = UI.button('Delete', ctx.menu, 'button', 'list-button hidden');
            button.addEventListener('mouseup', async function () {
                closeMenu();
                await FS.rm(path);
            });
        });

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

    async function openNewEditor(filePath) {
        const existing = getTabByPath(filePath);
        if (existing) {
            setActiveTab(existing);
            return;
        }
        await createTab(filePath);
    }

    async function createTab(filePath) {
        const fileName = filePath ? filePath.replace(/\/+$/, '').split('/').pop() : 'untitled';

        const tabEl = UI.create('div', tabBar);
        tabEl.style.cssText = "display: flex; align-items: center; padding: 0 8px 0 12px; height: 32px; white-space: nowrap; cursor: pointer; flex-shrink: 0; font-size: var(--small-fz); font-family: 'font'; border-bottom: 2px solid transparent; transition: background 0.1s; gap: 6px;";

        const tabLabel = UI.create('span', tabEl);
        tabLabel.textContent = fileName;

        const closeBtn = UI.create('span', tabEl);
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = "font-size: 10px; opacity: 0.5; cursor: pointer; line-height: 1; padding: 2px;";
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.5');

        const contentEl = UI.create('div', editorContainer);
        contentEl.style.cssText = "position: absolute; inset: 0; display: none;";

        const editor = ace.edit(contentEl);

        if (filePath) {
            if (filePath.endsWith('.js') || filePath.endsWith('.js/')) {
                editor.session.setMode("ace/mode/javascript");
            }
            editor.setValue(await FS.read(filePath), -1);
            editor.session.getUndoManager().reset();
        }

        editor.setOptions({
            fontFamily: 'Roboto Mono',
            fontSize: await FS.read('EditorTextSize')
        });

        editor.commands.addCommand({
            name: 'Save',
            bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
            exec: function (ed) {
                FS.write(filePath, ed.getSession().getValue(), 'text');
            }
        });

        const tab = { path: filePath, editor, tabEl, contentEl, label: tabLabel };
        tabs.push(tab);

        tabEl.addEventListener('mousedown', function (e) {
            if (e.target !== closeBtn) {
                setActiveTab(tab);
            }
        });

        closeBtn.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            closeTab(tab);
        });

        setActiveTab(tab);
        setupEditorMenuBar(filePath, editor);

        return tab;
    }

    let menuBarInitialized = false;
    let currentEditorRef = null;
    let currentPathRef = null;

    function setupEditorMenuBar(filePath, editor) {
        currentEditorRef = editor;
        currentPathRef = filePath;

        if (menuBarInitialized) return;
        menuBarInitialized = true;

        window.titlebar.text.innerHTML = "";
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
                    closeMenu();
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
                } else {
                    closeMenu();
                    func();
                }
            }
        }

        var editorActions = {
            undo: function () {
                currentEditorRef.getSession().getUndoManager().undo();
            },
            redo: function () {
                currentEditorRef.getSession().getUndoManager().redo();
            },
            save: async function () {
                await FS.write(currentPathRef, currentEditorRef.getSession().getValue(), 'text');
                if (activeTab) {
                    activeTab.label.textContent = currentPathRef.replace(/\/+$/, '').split('/').pop();
                }
            }
        };

        var menu = {
            file: function () {
                if (menuOpen === true) closeMenu();
                menuName = "File";
                const rect = fileButton.getBoundingClientRect();
                const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 };
                const ctx = UI.contextMenu(event, [fileButton], function () { menuOpen = false; });

                const newWindow = UI.button('New Window', ctx.menu, 'button', 'list-button');
                newWindow.addEventListener('mouseup', async function () {
                    closeMenu();
                    let thing = await WD.loadModule('/apps/DeskIDE.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                UI.divider(ctx.menu);

                const filebtn = UI.button('Open File...', ctx.menu, 'button', 'list-button');
                filebtn.addEventListener('mouseup', async function () {
                    closeMenu();
                    const mod = await WD.loadModule('/apps/Files.app/index.js', true);
                    const filePicker = await mod.pickFile(FS, UI, WD, { name: "DeskIDE" });
                    if (filePicker !== false) {
                        openNewEditor(filePicker.path);
                    }
                });

                const fileTextEditbtn = UI.button('Open File in TextEdit...', ctx.menu, 'button', 'list-button');
                fileTextEditbtn.addEventListener('mouseup', async function () {
                    closeMenu();
                    let thing = await WD.loadModule('/apps/TextEdit.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                UI.divider(ctx.menu);

                const button = UI.button('Save', ctx.menu, 'button', 'list-button');
                button.addEventListener('mouseup', async function () {
                    closeMenu();
                    await editorActions.save();
                });

                const saver = UI.button('Save & restart', ctx.menu, 'button', 'list-button');
                saver.addEventListener('mouseup', async function () {
                    await editorActions.save();
                    await window.location.reload();
                });

                menuOpen = true;
                menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            edit: function () {
                if (menuOpen === true) closeMenu();
                menuName = "Edit";
                const rect = editButton.getBoundingClientRect();
                const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 };
                const ctx = UI.contextMenu(event, [editButton], function () { menuOpen = false; });

                const findbtn = UI.button('Find', ctx.menu, 'button', 'list-button');
                findbtn.addEventListener('mouseup', async function () {
                    currentEditorRef.execCommand('find');
                    closeMenu();
                });

                const replacebtn = UI.button('Replace', ctx.menu, 'button', 'list-button');
                replacebtn.addEventListener('mouseup', async function () {
                    currentEditorRef.execCommand('replace');
                    closeMenu();
                });

                UI.divider(ctx.menu);

                const undobtn = UI.button('Undo', ctx.menu, 'button', 'list-button');
                undobtn.addEventListener('mouseup', async function () {
                    editorActions.undo();
                    closeMenu();
                });

                const redobtn = UI.button('Redo', ctx.menu, 'button', 'list-button');
                redobtn.addEventListener('mouseup', async function () {
                    editorActions.redo();
                    closeMenu();
                });

                menuOpen = true;
                menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            selection: function () {
                if (menuOpen === true) closeMenu();
                menuName = "Selection";
                const rect = selectionButton.getBoundingClientRect();
                const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 };
                const ctx = UI.contextMenu(event, [selectionButton], function () { menuOpen = false; });

                const sabtn = UI.button('Select All', ctx.menu, 'button', 'list-button');
                sabtn.addEventListener('mouseup', async function () {
                    currentEditorRef.selectAll();
                    closeMenu();
                });

                menuOpen = true;
                menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            tools: function () {
                if (menuOpen === true) closeMenu();
                menuName = "Tools";
                const rect = toolsButton.getBoundingClientRect();
                const event = { clientX: rect.x, clientY: rect.y + rect.height + 5 };
                const ctx = UI.contextMenu(event, [toolsButton], function () { menuOpen = false; });

                const restartDeskIDE = UI.button('Restart DeskIDE', ctx.menu, 'button', 'list-button');
                restartDeskIDE.addEventListener('mouseup', async function () {
                    closeMenu();
                    window.main.window.remove();
                    let thing = await WD.loadModule('/apps/DeskIDE.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                const LiveCSSbtn = UI.button('LiveCSS', ctx.menu, 'button', 'list-button');
                LiveCSSbtn.addEventListener('mouseup', async function () {
                    closeMenu();
                    let thing = await WD.loadModule('/apps/DeskIDE.app/tools/LiveCSS.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                menuOpen = true;
                menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            }
        };

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
    }

    if (typeof path === "string") {
        await openNewEditor('/apps/DeskIDE.app/placeholder.txt');
    } else {
        path = "/apps/DeskIDE.app/";
        await openNewEditor("/apps/DeskIDE.app/index.js");
    }

    window.main.window.addEventListener('resize', function () {
        if (activeTab) activeTab.editor.resize();
    });
}