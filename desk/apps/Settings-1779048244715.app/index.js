export async function launch(FS, UI, WD) {
    // Corrected by AI:
    // - Breadcrumbs
    // - Temporary stylings
    const win = UI.window('Settings');
    if (WD.mobile === false) {
        win.main.window.style.width = "380px";
        win.main.window.style.maxHeight = "540px";
    }
    const tempStyle = UI.create('style', win.main.window, 'hide');
    const mathRan = `crumbs-${Math.random().toString(36).slice(2)}`;
    win.titlebar.text.id = mathRan;
    tempStyle.textContent = `#${mathRan} * { margin-right: 2px; }`;
    const settingsView = UI.create('div', win.main.content);

    var pane;
    var crumbs = [];

    function renderCrumb(name, func) {
        console.log(crumbs);
        if (name && crumbs[crumbs.length - 1]?.name !== name) {
            crumbs.push({ name: name, func: func, position: crumbs.length });
        }

        win.titlebar.text.innerHTML = "";
        crumbs.forEach(function (crumb) {
            const crumbBtn = UI.button(crumb.name, win.titlebar.text, 'button', 'small-button');
            crumbBtn.addEventListener('click', async function () {
                crumbs.splice(crumb.position + 1);
                renderCrumb();
                const newPane = await crumb.func();
                settingsView.appendChild(newPane);
                UI.anims.crossFade(pane, newPane).then(function () {
                    pane.remove();
                    pane = newPane;
                });
            });
        });
        console.log(crumbs);
    }

    async function paneHandler(oldPane, newPane) {
        settingsView.appendChild(newPane);
        UI.anims.crossFade(oldPane, newPane).then(function () {
            pane.remove();
            pane = newPane;
        });
    }

    var panes = {
        Home: async function () {
            const newPane = UI.create('div', undefined, 'button-list-normal');
            renderCrumb('Home', () => panes.Home());
            UI.text('Settings', newPane);
            const userBar = UI.leftRightLayout('bar', newPane);
            userBar.left.innerText = await set.read('name');
            userBar.left.classList.add('bold');
            const mgmtBtn = UI.button('Manage', userBar.right, 'button', 'small-button');

            const workerBtn = UI.button('General', newPane, 'md-filled-button', 'wide');
            workerBtn.addEventListener('click', async function () {
                const genPane = await panes.General();
                await paneHandler(pane, genPane);
            });
            const appearBtn = UI.button('Appearance', newPane, 'md-filled-button', 'wide');
            appearBtn.addEventListener('click', async function () {
                const appearPane = await panes.Appearance();
                await paneHandler(pane, appearPane);
            });
            const devBtn = UI.button('Developer', newPane, 'md-filled-button', 'wide');
            devBtn.addEventListener('click', async function () {
                const devPane = await panes.Developer();
                await paneHandler(pane, devPane);
            });
            return newPane;
        },
        General: async function () {
            const newPane = UI.create('div', undefined, 'button-list-normal');
            renderCrumb('General', () => panes.General());
            const transferEraseBtn = UI.button('Transfer or Erase WebDesk', newPane, 'md-filled-button', 'wide');

            const bar = UI.create('div', newPane, 'bar');
            const barbox = UI.create('div', bar, 'flexbox bar');
            UI.text('Mobile UI', barbox, 'flexbox-left');
            const mobileSwitch = UI.create('md-switch', barbox, 'flexbox-right');
            mobileSwitch.addEventListener('change', function () {
                if (mobileSwitch.selected) {
                    set.write('mobile', 'true');
                } else {
                    set.del('mobile');
                }
            });

            const barai = UI.create('div', newPane, 'bar');
            const barboxai = UI.create('div', barai, 'flexbox bar');
            UI.text('LLM model', barboxai, 'flexbox-left');
            const LLMSelectBtn = UI.button('Select', barboxai, 'md-filled-button', 'flexbox-right');
            LLMSelectBtn.addEventListener('click', async function (e) {
                const menu = UI.contextMenu(e);
                await WD.startLLMService();
                const LLMs = WD.LLM.module.listModels();
                LLMs.forEach(async function (llm) {
                    const btn = UI.button(llm, menu.menu, 'button', 'small-button wide');
                    btn.addEventListener('click', async function () {
                        menu.closeMenu(document.body);
                        await set.write('LLMModel', llm);
                        UI.snack('Set LLM model to ' + llm, 2500);
                    });
                });

                menu.finish();
            });

            UI.text(`Turning this on will enable the mobile UI`, bar, 'small-text');

            if (await set.read('mobile') === "true") {
                mobileSwitch.selected = true;
            }

            transferEraseBtn.addEventListener('click', async function () {
                const erasePane = UI.create('div', undefined);
                renderCrumb('Transfer or Erase WebDesk', () => panes.General());
                await paneHandler(pane, erasePane);
                const eraseBtn = UI.button('Erase All Content and Settings', erasePane, 'md-filled-button', 'wide');
                eraseBtn.addEventListener('click', async function () {
                    const div = UI.create('div', document.body);
                    div.style = `position: fixed; left: 0px; right: 0px; top: 0px; bottom: 0px; z-index: 2147483647; background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(var(--blur-main)); -webkit-backdrop-filter: blur(var(--blur-main));`;
                    const dialog = UI.create('div', div, 'dialog-box');
                    const dialog1 = UI.create('div', dialog);
                    UI.text('Are you sure you want to erase all media, content and settings?', dialog1, 'bold');
                    UI.text(`This cannot be undone.`, dialog1);
                    const buttonCont = UI.create('div', dialog1, 'dialog-box-two-buttons');
                    const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
                    cancel.addEventListener('click', function () {
                        UI.anims.fadeOutRemove(div);
                    });
                    const select = UI.button('Erase WebDesk', buttonCont, 'md-filled-button', 'flex-grow-1');
                    select.addEventListener('click', async function () {
                        dialog1.remove();
                        const dialog2 = UI.create('div', dialog);
                        UI.text('Erasing...', dialog2, 'bold');
                        await FS.erase('I understand all data in WFS will be destroyed');
                        div.style = `position: fixed; left: 0px; right: 0px; top: 0px; bottom: 0px; z-index: 2147483647; background-color: rgba(0, 0, 0, 1.0); backdrop-filter: blur(var(--blur-main)); -webkit-backdrop-filter: blur(var(--blur-main)); transition: background 0.2s`;
                        const dialog3 = UI.create('div', dialog);
                        UI.text('WebDesk has been erased', dialog3, 'bold');
                        UI.text(`You can either reinstall WebDesk, or be redirected to about:blank to avoid reinstalling.`, dialog3);
                        const buttonCont = UI.create('div', dialog3, 'dialog-box-two-buttons');
                        const cancel = UI.button('Redirect', buttonCont, 'md-outlined-button');
                        cancel.addEventListener('click', function () {
                            window.location.href = "about:blank";
                        });
                        const select = UI.button('Reinstall', buttonCont, 'md-filled-button', 'flex-grow-1');
                        select.addEventListener('click', async function () {
                            window.location.reload();
                        });

                        UI.anims.crossFade(dialog2, dialog3).then(function () {
                            dialog2.remove();
                        });
                    });
                });
            });
            return newPane;
        },
        Appearance: async function () {
            const newPane = UI.create('div', undefined);
            renderCrumb('Appearance', () => panes.Appearance());
            UI.text('Appearance', newPane);
            const buttonCont = UI.create('div', newPane, 'dialog-box-two-buttons no-padding');
            const light = UI.button('Light', buttonCont, 'md-outlined-button', 'flex-grow-1');
            light.addEventListener('click', async function () {
                UI.system.applyTheme(await set.read('material-hex'), await set.read('material-hex'), false);
            });
            const dark = UI.button('Dark', buttonCont, 'md-filled-button', 'flex-grow-1');
            dark.addEventListener('click', async function () {
                UI.system.applyTheme(await set.read('material-hex'), await set.read('material-hex'), true);
            });

            UI.text('Wallpaper', newPane);
            const buttonCont2 = UI.create('div', newPane, 'dialog-box-two-buttons no-padding');
            const reset = UI.button('Reset', buttonCont2, 'md-outlined-button');
            reset.addEventListener('click', async function () {
                await FS.cp('/system/img/wallpaper.jpg', FS.normalizeUserPath('config/wallpaper'));
                await UI.initialize();
            });
            const wall = UI.button('Upload Wallpaper', buttonCont2, 'md-filled-button', 'flex-grow-1');
            wall.addEventListener('click', async function () {
                const upload = await FS.uploadFileFromBrowser();
                if (upload.file && upload.isImage === true) {
                    await FS.write(FS.normalizeUserPath('config/wallpaper'), upload.content, "blob");
                    await UI.initialize();
                }
            });

            UI.text(`Font`, newPane);
            var fontFaces = ['Poppins', 'Arial', 'system-ui', 'Open Sans', 'Roboto', 'Roboto Mono', 'Google Sans', 'Comic Relief'];
            const list = UI.list.create('bar', newPane);
            list.style = "max-height: 240px; overflow: auto !important;";
            fontFaces.forEach(function (fontFace) {
                const item = UI.list.addItem('button', list, undefined, fontFace);
                item.supportingText('The quick brown fox jumps over the lazy dog.');
                const tempStyle = UI.create('style', item.item, 'hide');
                const mathRan = `list-item-${Math.random().toString(36).slice(2)}`;
                item.item.id = mathRan;
                tempStyle.textContent = `#${mathRan} * { font-family: ${fontFace} !important; }`;
                item.item.addEventListener('click', async function () {
                    UI.system.changeCSSVar('md-ref-typeface-plain', fontFace);
                    await set.write('font-family', fontFace);
                });
            });
            UI.reorg(list, 'md-list-item');

            return newPane;
        },
        Developer: async function () {
            const newPane = UI.create('div');
            renderCrumb('Developer', () => panes.Developer());
            UI.text('Developer', newPane);
            const bar = UI.create('div', newPane, 'bar');
            const barbox = UI.create('div', bar, 'flexbox bar');
            UI.text('Force update', barbox, 'flexbox-left');
            const forceSwitch = UI.create('md-switch', barbox, 'flexbox-right');
            forceSwitch.addEventListener('change', function () {
                if (forceSwitch.selected) {
                    set.write('FORCEUPDATE', 'true');
                } else {
                    set.del('FORCEUPDATE');
                }
            });

            UI.text(`Turning this on will make WebDesk update on every reload`, bar, 'small-text');

            if (await set.read('FORCEUPDATE') === "true") {
                forceSwitch.selected = true;
            }
            return newPane;
        }
    }

    pane = await panes.Home();
    settingsView.appendChild(pane);
    win.finish();
}