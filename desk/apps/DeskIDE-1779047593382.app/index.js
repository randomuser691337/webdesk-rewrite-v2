export var name = "DeskIDE";

// Folder browser debugged by Claude, tabs added by Claude
// recents COMPLETELY rewritten by Claude
var recents = {
    add: async function (path) {
        let items = await FS.read(FS.normalizeUserPath(`appdata/DeskIDE-1779047593382.app/recents.json`));
        let recentItems = items ? JSON.parse(items) : [];
        recentItems = recentItems.filter(item => item.path !== path);
        let check = await FS.checkType(path);
        if (check === "directory") check = true;
        recentItems.push({ path: path, folder: check });
        recentItems = recentItems.slice(-30);
        await FS.write(FS.normalizeUserPath(`appdata/DeskIDE-1779047593382.app/recents.json`), JSON.stringify(recentItems));
    },
    list: async function () {
        let items = await FS.read(FS.normalizeUserPath(`appdata/DeskIDE-1779047593382.app/recents.json`));
        return items ? JSON.parse(items) : [];
    }
}

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
        const picker = await WD.loadApp('/apps/Files-1779048116446.app/index.js');
        const file = await picker.pickFile(FS, UI, WD, { name: "DeskIDE", type: "folder" });
        if (file) {
            await deskide(FS, UI, WD, file.path);
            window.close();
        }
    });

    const newProject = UI.button('New Project', buttonCont, 'md-filled-button', 'flex-grow-1');
    newProject.addEventListener('click', function () {
        const projWin = UI.window('Project Creation Window');
        if (WD.mobile === false) {
            projWin.main.window.style.width = "240px";
        }
        UI.text(`Version, ID and app path are automatically created`, projWin.main.content, 'small-text');
        const UICont = UI.create('div', projWin.main.content, 'button-list-normal');
        const appName = UI.input("App name", UICont, 'flex-grow-1 msg-ui wide');
        const appDesc = UI.input("App description", UICont, 'flex-grow-1 msg-ui wide');
        const appDev = UI.input("Developer name", UICont, 'flex-grow-1 msg-ui wide');
        const newProject = UI.button('Create app', UICont, 'md-filled-button');
        newProject.addEventListener('click', async function () {
            const id = Date.now();
            const appData = {
                "name": appName.value,
                "version": "1.0",
                "developer": appDev.value,
                "id": id,
                "icon": undefined,
                "fsPath": `/apps/${appName.value}-${id}.app`,
                "description": appDesc.value
            }

            await FS.write(`/apps/${appName.value}-${id}.app/manifest.json`, JSON.stringify(appData));
            await FS.write(`/apps/${appName.value}-${id}.app/index.js`, await FS.read('/apps/DeskIDE-1779047593382.app/example.js'));
            projWin.close();
            await deskide(FS, UI, WD, `/apps/${appName.value}-${id}.app/`);
        });
        projWin.finish();
    });



    UI.text("Recent projects", start);

    const recent = UI.create('div', start, 'general-container');
    recent.style.maxHeight = "200px";
    const objs = await recents.list();
    objs.forEach(function (obj) {
        const btn = UI.button('', undefined, 'button', 'list-button');
        const layout = UI.leftRightLayout(undefined, btn);

        if (obj.folder === true) {
            UI.icon('folder', layout.left, 'symbol-style-files');
        } else {
            UI.icon('draft', layout.left, 'symbol-style-files');
        }

        const filetxt = UI.span(obj.path, layout.left);
        filetxt.style.marginLeft = "var(--padding-small)";
        recent.prepend(btn);
        btn.addEventListener('click', async function () {
            await deskide(FS, UI, WD, obj.path);
        });
    });

    window.finish();
}

export async function deskide(FS, UI, WD, path) {
    await recents.add(path);
    const window = UI.window('DeskIDE');
    let editorFontSize = "12px";
    window.main.content.style = "display: flex; padding: 0px;";
    const sidebar = UI.create('div', window.main.content, 'window-split-sidebar');

    const editorArea = UI.create('div', window.main.content, 'window-split-content');
    editorArea.style.cssText = "padding: 0px; display: flex; flex-direction: column; overflow: hidden; flex: 1;";

    const tabBar = UI.create('div', editorArea);
    tabBar.style.cssText = "display: flex; flex-direction: row; overflow-x: auto; overflow-y: hidden; flex-shrink: 0; background: rgba(var(--ui-1), 1.0); border-bottom: 1px solid rgba(var(--outline), 0.3); scrollbar-width: none;";

    const editorContainer = UI.create('div', editorArea);
    editorContainer.style.cssText = "flex: 1; overflow: hidden; position: relative;";

    window.main.window.style.overflow = "hidden";
    window.titlebar.main.style.padding = "4px";
    if (WD.mobile === false) {
        const calc = UI.math.calcRes(80, 80);
        window.main.window.style.height = calc.h + "px";
        window.main.window.style.width = calc.w + "px";
        sidebar.style.width = UI.math.calcRes(15, 15).w + "px";
    } else {
        sidebar.style = "max-width: 100%; width: 100%";
        sidebar.style.height = UI.math.calcRes(15, 15).h + "px";
        window.main.content.style.flexDirection = "column";
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
        setupEditorMenuBar(tab.filePath, tab.editor);
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
        return "font-family: var(--font); background: transparent; font-size: var(--small-fz); border: none; display: block; box-sizing: border-box; text-align: left; cursor: pointer;";
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
                let thing = await WD.loadModule('/apps/DeskIDE-1779047593382.app/index.js', true);
                await thing.launch(FS, UI, WD, path);
                window.main.window.remove();
            });

            const newWindow = UI.button('Open Folder in New Window', ctx.menu, 'button', 'list-button');
            newWindow.addEventListener('mouseup', async function () {
                closeMenu();
                let thing = await WD.loadModule('/apps/DeskIDE-1779047593382.app/index.js', true);
                await thing.launch(FS, UI, WD, path);
            });

            const fileTextEditbtn = UI.button('Open Folder in Files', ctx.menu, 'button', 'list-button');
            fileTextEditbtn.addEventListener('mouseup', async function () {
                closeMenu();
                let thing = await WD.loadModule('/apps/Files-1779048116446.app/index.js', true);
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
                for (const file of ls) {
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
        tabEl.style.cssText = "display: flex; align-items: center; padding: 0 8px 0 12px; height: 32px; white-space: nowrap; cursor: pointer; flex-shrink: 0; font-size: var(--small-fz); font-family: var(--font); border-bottom: 2px solid transparent; transition: background 0.1s; gap: 6px;";

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
            fontSize: await set.read('EditorTextSize')
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

    let currentEditorRef = null;
    let currentPathRef = null;

    function setupEditorMenuBar(filePath, editor) {
        currentEditorRef = editor;
        currentPathRef = filePath;

        window.titlebar.text.innerHTML = "";
        const buttonContainer = UI.container(undefined, window.titlebar.text, 'full-width');
        const newToolbar = UI.toolbar.createToolbar(buttonContainer);

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
                const ctx = newToolbar.toolbarMenu(fileButton, newToolbar);

                newToolbar.listButton('New Window', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    let thing = await WD.loadModule('/apps/DeskIDE-1779047593382.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                UI.divider(ctx.menu);

                newToolbar.listButton('Open File...', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    const mod = await WD.loadModule('/apps/Files-1779048116446.app/index.js', true);
                    const filePicker = await mod.pickFile(FS, UI, WD, { name: "DeskIDE" });
                    if (filePicker !== false) {
                        openNewEditor(filePicker.path);
                    }
                });

                newToolbar.listButton('Open File in TextEdit...', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    let thing = await WD.loadModule('/apps/TextEdit-1779048336412.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                UI.divider(ctx.menu);

                newToolbar.listButton('Save', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    await editorActions.save();
                });

                newToolbar.listButton('Save & restart', ctx.menu, async function () {
                    await editorActions.save();
                    await window.location.reload();
                });

                newToolbar.menuOpen = true;
                newToolbar.menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            edit: function () {
                const ctx = newToolbar.toolbarMenu(editButton, newToolbar);

                newToolbar.listButton('Find', ctx.menu, async function () {
                    currentEditorRef.execCommand('find');
                    newToolbar.menuCloseFunction();
                });

                newToolbar.listButton('Replace', ctx.menu, async function () {
                    currentEditorRef.execCommand('replace');
                    newToolbar.menuCloseFunction();
                });

                UI.divider(ctx.menu);

                newToolbar.listButton('Undo', ctx.menu, async function () {
                    editorActions.undo();
                    newToolbar.menuCloseFunction();
                });

                newToolbar.listButton('Redo', ctx.menu, async function () {
                    editorActions.redo();
                    newToolbar.menuCloseFunction();
                });

                newToolbar.menuOpen = true;
                newToolbar.menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            selection: function () {
                const ctx = newToolbar.toolbarMenu(selectionButton, newToolbar);

                newToolbar.listButton('Select All', ctx.menu, async function () {
                    currentEditorRef.selectAll();
                    newToolbar.menuCloseFunction();
                });

                newToolbar.menuOpen = true;
                newToolbar.menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            },
            tools: function () {
                const ctx = newToolbar.toolbarMenu(toolsButton, newToolbar);

                newToolbar.listButton('Restart DeskIDE', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    window.main.window.remove();
                    let thing = await WD.loadModule('/apps/DeskIDE-1779047593382.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                newToolbar.listButton('LiveCSS', ctx.menu, async function () {
                    newToolbar.menuCloseFunction();
                    let thing = await WD.loadModule('/apps/DeskIDE-1779047593382.app/tools/LiveCSS.app/index.js', true);
                    await thing.launch(FS, UI, WD);
                });

                newToolbar.menuOpen = true;
                newToolbar.menuCloseFunction = ctx.closeMenu;
                ctx.finish();
            }
        };

        const fileButton = newToolbar.toolbarButton('File', menu.file);
        const editButton = newToolbar.toolbarButton('Edit', menu.edit);
        const selectionButton = newToolbar.toolbarButton('Selection', menu.selection);
        const toolsButton = newToolbar.toolbarButton('Tools', menu.tools);
    }

    if (typeof path === "string") {
        await openNewEditor('/apps/DeskIDE-1779047593382.app/placeholder.txt');
    } else {
        path = "/apps/DeskIDE-1779047593382.app";
        await openNewEditor("/apps/DeskIDE-1779047593382.app/index.js");
    }

    window.main.window.addEventListener('resize', function () {
        if (activeTab) activeTab.editor.resize();
    });
}