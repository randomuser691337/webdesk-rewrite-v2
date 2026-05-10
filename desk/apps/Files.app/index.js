export async function launch(FS, UI, core, path) {
    const win = UI.window('Files');
    var dblClick = "dblclick";
    if (core.mobile === false) {
        win.main.window.style.height = "300px";
        win.main.window.style.width = "300px";
    } else {
        dblClick = "click";
    }
    const filesView = UI.create('div', win.main.content);
    filesView.style.padding = "0px";
    var currentPath = "";
    const plusButton = UI.dangerousButton(`<md-icon>add</md-icon>`, undefined, 'md-filled-tonal-icon-button', 'window-mgmt-button');
    win.titlebar.buttons.prepend(plusButton);
    plusButton.addEventListener('click', async function (event) {
        const menu = UI.contextMenu(event);
        const upBtn = UI.button('Upload file here', menu.menu, 'button', 'list-button');
        upBtn.addEventListener('click', async function (event) {
            menu.closeMenu(document.body);
            const upload = await UI.uploadFileFromBrowser();
            if (upload.file) {
                await FS.write(currentPath + upload.file.name, upload.content, upload.isImage ? "blob" : "text");
            }
        });
        menu.finish();
    });
    async function nav(path) {
        const fileList = await FS.ls(path);
        filesView.innerHTML = "";
        win.titlebar.text.innerHTML = "";
        const crumbs = UI.create('div', win.titlebar.text, 'column-button-container');
        crumbs.style = "width: 100%; box-sizing: border-box";
        const buttonhome = UI.button('/', crumbs, 'button', 'small-button');
        buttonhome.onclick = () => {
            nav("");
        };
        const trimmedPath = path.replace(/\/+$/, '');
        const parts = trimmedPath.split('/').filter(Boolean);
        const breadcrumbs = [];

        currentPath = "";

        parts.forEach((part, index) => {
            currentPath += `/${part}`;
            const crumbPath = parts.slice(0, index + 1).join('/');

            const button = UI.button(part, crumbs, 'button', 'small-button');
            button.onclick = () => {
                if (crumbPath.endsWith('/')) {
                    nav(crumbPath);
                } else {
                    nav(crumbPath + "/");
                }
            };

            breadcrumbs.push(button);
        });

        if (!currentPath.endsWith('/')) currentPath = currentPath + "/";

        Object.values(fileList).forEach(function (file) {
            const btn = UI.button('', filesView, 'button', 'list-button');
            console.log(btn);
            const layout = UI.leftRightLayout(undefined, btn);

            if (file.kind === "directory") {
                UI.icon('folder', layout.left, 'symbol-style-files');
            } else {
                UI.icon('draft', layout.left, 'symbol-style-files');
            }

            const filetxt = UI.span(file.name, layout.left);
            filetxt.style.marginLeft = "var(--padding-small)";
            layout.right.innerText = "⋮";

            btn.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                const menu = UI.contextMenu(event);
                const delBtn = UI.button('Delete', menu.menu, 'button', 'list-button');
                delBtn.addEventListener('click', function (event) {
                    const dialog = UI.create('div', document.body, 'dialog-box');
                    UI.text('Delete ' + file.name, dialog, 'bold');
                    UI.text(`This cannot be undone!`, dialog).style.textDecoration = "underline";

                    const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        dialog.remove();
                    });

                    const select = UI.button('Delete', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', async function () {
                        dialog.innerHTML = "Removing...";
                        await FS.rm(file.path);
                        dialog.remove();
                    });
                });
                menu.finish();
            });

            btn.addEventListener(dblClick, async function () {
                if (file.kind === "directory") {
                    await nav(file.path);
                } else {
                    await UI.openFile(file.path);
                }
            });
        });
    }

    if (typeof path === "string") {
        nav(path);
    } else {
        nav('/');
    }
    win.finish();
}

export async function pickFile(FS, UI, core, parameters) {
    /* PICKER API DOCUMENTATION
    - example: pickFile(FS, UI, core, { name: "Application name" })
    - parameters.name
        - must be set
        - app name
    - parameters.type
        - if not set, falls back to opening an existing file
        - "new" - create new file
        - "folder" - pick a folder
    */
    return new Promise((resolve, reject) => {
        const win = UI.window('File Picker - ' + parameters.name);
        var dblClick = "dblclick";
        if (core.mobile === false) {
            win.main.window.style.height = "300px";
            win.main.window.style.width = "300px";
        } else {
            dblClick = "click";
        }

        const filesView = UI.create('div', win.main.content);
        filesView.style.padding = "0px";
        async function nav(path) {
            const fileList = await FS.ls(path);
            filesView.innerHTML = "";
            if (parameters.type === "folder") {
                const bar = UI.leftRightLayout('bar', filesView);
                bar.el.style.marginBottom = "var(--padding-small)";
                UI.text(`File Picker - ` + parameters.name, bar.left);
                const selectFolder = UI.button('Select This Folder', bar.right, 'button', 'small-button');
                selectFolder.addEventListener('click', function () {
                    const dialog = UI.create('div', document.body, 'dialog-box');
                    UI.text('Select folder', dialog, 'bold');
                    UI.text(path, dialog);

                    const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        dialog.remove();
                    });

                    const select = UI.button('Select', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', function () {
                        win.close();
                        dialog.remove();
                        resolve({ path: path, type: 'directory' });
                    });
                });
            } else {
                const bar = UI.create('div', filesView, 'bar');
                UI.text('Select file for ' + parameters.name, bar);
                bar.style.marginBottom = "var(--padding-small)";
            }
            win.titlebar.text.innerHTML = "";
            const crumbs = UI.create('div', win.titlebar.text, 'column-button-container');
            crumbs.style = "width: 100%; box-sizing: border-box";
            const buttonhome = UI.button('/', crumbs, 'button', 'small-button');
            buttonhome.onclick = () => {
                nav("");
            };
            const trimmedPath = path.replace(/\/+$/, '');
            const parts = trimmedPath.split('/').filter(Boolean);

            let currentPath = '';
            const breadcrumbs = [];

            parts.forEach((part, index) => {
                currentPath += `/${part}`;
                const crumbPath = parts.slice(0, index + 1).join('/');

                const button = UI.button(part, crumbs, 'button', 'small-button');
                button.onclick = () => {
                    if (crumbPath.endsWith('/')) {
                        nav(crumbPath);
                    } else {
                        nav(crumbPath + "/");
                    }
                };

                breadcrumbs.push(button);
            });
            Object.values(fileList).forEach(function (file) {
                const btn = UI.button('', filesView, 'button', 'list-button');
                console.log(btn);
                const layout = UI.leftRightLayout(undefined, btn);

                if (file.kind === "directory") {
                    UI.icon('folder', layout.left, 'symbol-style-files');
                } else {
                    UI.icon('draft', layout.left, 'symbol-style-files');
                }

                const filetxt = UI.span(file.name, layout.left);
                filetxt.style.marginLeft = "var(--padding-small)";
                layout.right.innerText = "⋮";

                btn.addEventListener(dblClick, function () {
                    if (file.kind === "directory") {
                        nav(file.path);
                    } else {
                        if (parameters.type !== "folder") {
                            const dialog = UI.create('div', document.body, 'dialog-box');
                            UI.text('Select file', dialog, 'bold');
                            UI.text(file.name, dialog);

                            const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                            const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                            cancel.addEventListener('click', function () {
                                dialog.remove();
                            });

                            const select = UI.button('Select', buttonCont, 'md-filled-button', 'flex-grow-1');
                            select.addEventListener('click', function () {
                                win.close();
                                dialog.remove();
                                resolve({ path: file.path, type: file.type });
                            });
                        }
                    }
                });
            });
        }

        nav('/');
        win.finish();
    });
}