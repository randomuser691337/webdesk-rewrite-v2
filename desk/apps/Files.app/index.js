export async function launch(FS, UI, core) {
    const win = UI.window('Files');
    win.main.window.style.height = "300px";
    win.main.window.style.width = "300px";
    const filesView = UI.create('div', win.main.content);
    filesView.style.padding = "0px";
    async function nav(path) {
        const fileList = await FS.ls(path);
        filesView.innerHTML = "";
        const crumbs = UI.create('div', filesView, 'column-button-container');
        crumbs.style.padding = "var(--padding-small)";
        crumbs.style.paddingTop = "0px";
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

            btn.addEventListener('click', async function () {
                if (file.kind === "directory") {
                    await nav(file.path);
                } else {
                    await UI.openFile(file.path);
                }
            });
        });
    }

    nav('/');
}

export async function pickFile(FS, UI, core, parameters) {
    /* PICKER API DOCUMENTATION
    - example: pickFile(FS, UI, core, { name: "Application name" })
    - parameters.name
        - must be set
        - app name
    */
    return new Promise((resolve, reject) => {
        const win = UI.window('File Picker - ' + parameters.name);
        win.main.window.style.height = "300px";
        win.main.window.style.width = "300px";
        const filesView = UI.create('div', win.main.content);
        filesView.style.padding = "0px";
        async function nav(path) {
            const fileList = await FS.ls(path);
            filesView.innerHTML = "";
            const crumbs = UI.create('div', filesView, 'column-button-container');
            crumbs.style.padding = "var(--padding-small)";
            crumbs.style.paddingTop = "0px";
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

                btn.addEventListener('contextmenu', function (event) {
                    event.preventDefault();
                    const menu = UI.contextMenu(event);
                    UI.button('Delete', menu.menu, 'button', 'list-button');
                    menu.finish();
                });

                btn.addEventListener('click', function () {
                    if (file.kind === "directory") {
                        nav(file.path);
                    } else {
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
                            win.main.window.remove();
                            dialog.remove();
                            resolve({ path: file.path, type: file.type });
                        });
                    }
                });
            });
        }

        nav('/');
    });
}