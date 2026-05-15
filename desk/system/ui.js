var windowArray = []

var UI = {
    create: function (elType, parent, classList) {
        /* create(elType, parent, classList) documentation
            - create elType parameter: Element tag (like div/lists)
            - create parent parameter: The element's parent (like document.body or another div)
            - create classList parameter: The element's classes, like "column-button-container" or something
            - create(elType, parent, classList) simply returns the element
            - Usage example:
                const element = UI.create('div', document.body, 'test-div');
                UI.text('It works!', element);
        */
        const el = document.createElement(elType);
        el.classList = classList;
        if (parent instanceof HTMLElement) {
            parent.appendChild(el);
        } else {
            console.log(el + " has no valid parent!");
        }
        return el;
    },
    animSpeed: {
        slow: 0.3,
        med: 0.2,
        fast: 0.13,
    },
    systemElements: {
        rect: {

        },
        taskbarAppButtonList: undefined,
        notifArea: undefined,
    },
    events: {
        onRemove: function (targetElement) {
            return new Promise((resolve) => {
                const parentElement = targetElement.parentNode;
                const observer = new MutationObserver((mutationsList, observer) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            // Check if the specific target was among the removed nodes
                            mutation.removedNodes.forEach(node => {
                                if (node === targetElement) {
                                    observer.disconnect();
                                    resolve();
                                }
                            });
                        }
                    }
                });

                observer.observe(parentElement, { childList: true });
            })
        }
    },
    math: {
        calcRes: function (wPercent, hPercent) {
            // Made by Claude
            // If window res is 1920x1080 and you run UI.math.calcRes(80, 80), calcRes returns { w: 1536, h: 864 }
            const w = window.innerWidth * (wPercent / 100);
            const h = window.innerHeight * (hPercent / 100);
            return { w: Math.round(w), h: Math.round(h) };
        },
    },
    anims: {
        crossFade: function (el1, el2, El2DisplayVarCSS) {
            el2.style.display = "none";
            return Animate(el1, { opacity: [1, 0] }, { duration: UI.animSpeed.fast }).then(function () {
                el1.style.display = "none";
                el2.style.display = El2DisplayVarCSS || "block";
                return Animate(el2, { opacity: [0, 1] }, { duration: UI.animSpeed.fast });
            });
        },
        fadeIn: function (el) {
            return Animate(el, { opacity: [0, 1] }, { duration: UI.animSpeed.med });
        },
        fadeOut: function (el) {
            return Animate(el, { opacity: [1, 0] }, { duration: UI.animSpeed.med });
        },
        fadeOutRemove: function (el) {
            return Animate(el, { opacity: [1, 0] }, { duration: UI.animSpeed.med }).then(function () {
                el.style.display = "none";
            });
        }
    },
    getDate: function (type) {
        const now = new Date();
        if (type === "military") {
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
        }
    },
    notif: async function (title, body, icon) {
        const notif = UI.create('div', UI.systemElements.notifArea, 'wd-notif');
        const closeBtn = UI.button('x', notif, 'button', 'wd-notif-close-button');
        closeBtn.addEventListener('click', () => {
            UI.anims.fadeOut(notif).then(function () { notif.remove(); });
        });
        const wdNotifToast = UI.create('div', notif, 'wd-notif-toast');

        /* let iconImg;
        if (icon) {
            iconImg = UI.img(wdNotifToast, icon, 'wd-notif-img');
        } else {
            iconImg = UI.img(wdNotifToast, '/system/lib/img/notification-toast.svg', 'wd-notif-img');
        } */

        const contents = UI.create('div', notif, 'wd-notif-contents');
        const titleDiv = UI.create('div', contents, 'wd-notif-title');
        const name = UI.create('div', titleDiv, 'wd-notif-title-name bold');
        const time = UI.create('div', titleDiv, 'wd-notif-title-time smalltxt');
        name.innerText = title;
        time.innerText = UI.getDate();
        const mainDiv = UI.create('div', contents);
        if (body) {
            mainDiv.innerText = body;
        }

        function removeNotif() {
            notif.remove();
        }

        return notif, { notif, name, time, mainDiv, titleDiv, /* iconImg, wdNotifToast, */ contents, removeNotif }
    },
    truncater: function (inputString, size, dots) {
        if (inputString.length <= size) {
            return inputString;
        } else {
            if (dots !== false) {
                return inputString.slice(0, size - 2) + '..';
            } else {
                return inputString.slice(0, size);
            }
        }
    },
    key: function (element, keycode, action) {
        element.addEventListener('keydown', (event) => {
            if (event.key === keycode) {
                event.preventDefault();
                action();
            }
        });
    },
    initialize: async function () {
        const img = await FS.read(FS.normalizeUserPath('config/wallpaper'));
        console.log(`<i> Creating object URL from blob`);
        const objectUrl = await URL.createObjectURL(img);
        console.log(`<i> Trying to display image`);
        if (document.getElementById('wallimg-webdesk-desktop')) {
            document.getElementById('wallimg-webdesk-desktop').remove();
        }
        const wallimg = UI.create('img', document.body);
        wallimg.id = "wallimg-webdesk-desktop";
        wallimg.style = `position: fixed;
  width: 100%;
  height: 100%;
  z-index: -4;
  object-fit: cover;
  object-position: center;`
        wallimg.src = objectUrl;
        wallimg.onload = () => {
            const fac = new FastAverageColor();
            const color = fac.getColor(wallimg);
            console.log(color);
            document.adoptedStyleSheets.push(MaterialUI.typescaleStyles.styleSheet);
            set.write('material-hex', color.hex);
            UI.system.applyTheme(color.hex, color.hex, color.isDark);
        }
    },
    reorg: function (element, type) {
        const buttons = Array.from(element.querySelectorAll(type));
        buttons.sort((a, b) => a.textContent.localeCompare(b.textContent));
        element.innerHTML = '';
        let currentLetter = '';

        buttons.forEach(button => {
            const firstLetter = button.textContent.charAt(0).toUpperCase();
            if (firstLetter !== currentLetter) {
                currentLetter = firstLetter;
            }

            element.appendChild(button);
        });
    },
    leftRightLayout: function (classList, parent) {
        const container = this.create('div', parent, `flexbox ${classList}`);
        const left = this.create('div', container, 'flexbox-left');
        const right = this.create('div', container, 'flexbox-right');
        return { left, right, el: container };
    },
    changeImg: async function (path, img) {
        const blob = await FS.read(path);
        if (blob instanceof Blob) {
            img.src = URL.createObjectURL(blob);
        } else if (path.endsWith('.svg')) {
            const data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(blob);
            img.src = data;
        } else {
            console.log(`<!> ` + path + ` is not an image decodable by WebDesk's UI. Trying URL...`);
            img.src = path;
        }
    },
    snack: async function (message, delay) {
        const snackBar = UI.create('div', document.body, 'snack');
        snackBar.innerText = message;
        await this.waitFrame();
        const rect = snackBar.getBoundingClientRect();

        Animate(snackBar, { bottom: ["-" + rect.height + "px", UI.systemElements.rect.shelf.height + 12 + "px", UI.systemElements.rect.shelf.height + 6 + "px"] }, { duration: UI.animSpeed.med, offset: [0, 0.75, 1] });
        function remove() {
            Animate(snackBar, { bottom: [UI.systemElements.rect.shelf.height + 6 + "px", "-" + rect.height + "px"] }, { duration: UI.animSpeed.med }).then(() => snackBar.remove());
        }

        if (delay == null) delay = 5000;
        if (delay !== false) setTimeout(remove, delay);

        return { bar: snackBar, remove };
    },
    img: async function (path, parent, classname) {
        const img = this.create('img', parent, classname);
        await UI.changeImg(path, img);
        return img;
    },
    waitFrame: async function () {
        await new Promise(r => requestAnimationFrame(r));
    },
    icon: function (iconName, parent, classList) {
        const el = UI.create('span', parent, classList + " material-symbols-outlined");
        el.innerHTML = iconName;
        return el;
    },
    span: function (text, parent, classList) {
        const el = UI.create('span', parent, classList);
        el.innerText = text;
        return el;
    },
    openFile: async function (path, type) {
        if (type === undefined) {
            type = await FS.checkType(path);
        }

        if (type === "text") {
            const editorApp = await set.read('WDDefaultEditor');
            if (WD.debug === true) console.log(editorApp);
            const TextEditor = await WD.loadModule(`${editorApp}`, true);
            if (WD.debug === true) console.log(TextEditor);
            TextEditor.editor(path);
        } else {

        }
    },
    list: {
        create: function (classList, parent) {
            const list = UI.create('md-list', parent, classList);
            return list;
        },
        addItem: function (type, list, classList, text) {
            const item = UI.create('md-list-item', list, classList);
            item.type = type;
            let headlineEl = false;
            let supportingEl = false;
            let trailingSupportingEl = false;

            function headline(text) {
                let line;
                if (headlineEl === false) {
                    line = UI.create('div', item);
                    headlineEl = line;
                } else {
                    line = headlineEl;
                }
                line.slot = "headline";
                line.innerText = text;
                return line;
            }

            function supportingText(text) {
                let line;
                if (supportingEl === false) {
                    line = UI.create('div', item);
                    supportingEl = line;
                } else {
                    line = supportingEl;
                }
                line.slot = "supporting-text";
                line.innerText = text;
                return line;
            }

            function trailingSupportingText(text) {
                let line;
                if (trailingSupportingEl === false) {
                    line = UI.create('div', item);
                    trailingSupportingEl = line;
                } else {
                    line = trailingSupportingEl;
                }
                line.slot = "trailing-supporting-text";
                line.innerText = text;
                return line;
            }

            if (text) {
                headline(text);
            }

            return { item: item, headline, supportingText, trailingSupportingText };
        }
    },
    container: function (options, parent, classList) {
        // tbd
        const cont = UI.create('div', parent, classList);
        if (options !== undefined) {

        }
        return cont;
    },
    button: function (text, parent, type, classList) {
        if (type === undefined) type = "md-filled-tonal-button";
        const btn = this.create(type, parent, classList);
        btn.innerText = text;
        return btn;
    },
    dangerousButton: function (text, parent, type, classList) {
        if (type === undefined) type = "md-filled-tonal-button";
        const btn = this.create(type, parent, classList);
        btn.innerHTML = text;
        return btn;
    },
    text: function (text, parent, classList) {
        const txt = this.create('div', parent, classList + " text");
        txt.innerText = text;
        return txt;
    },
    input: function (placeholder, parent, type, classList) {
        var input = this.create("md-outlined-text-field", parent, classList);
        input.label = placeholder;
        if (type) {
            input.type = type;
        }
        return input;
    },
    remove: function (el) {
        el.remove();
    },
    window: function (title, module, closeModuleWithWindow) {
        /* window(title, module) documentation
            - window title parameter: Requires a name for the window title
            - window module parameter: Your app's module, to end when the window is closed (optional)
            - window closeModuleWithWindow parameter: If true, module will be closed with the window when close() is called, unless close(removeModule) is set to false
            - window(title, module, closeModuleWithWindow) returns:
                - titlebar: The titlebar's elements
                    - titlebar.main: Titlebar's root element
                    - titleBar.layout: The layout element for the titlebar's text/buttons
                    - titlebar.text: The titlebar's title
                    - titlebar.buttons: The titlebar's button container
                - main: Window / it's content except titlebar
                    - main.window: Root window element
                    - main.content: Content element, append buttons/elements into this
                - finish: Function to finish creating the window (REQUIRED!)
                - close(removeModule): Destroys the window, and any elements associated with it.
                    - removeModule (true, false): If true and module is provided, it will remove the window and close the module with module.close(). If false, the module will NOT be closed, no matter what.
                - minimize(): Minimizes the window, if unminimized.
                - restore(): Restores the window, if minimized.
            - To create a window, for example:
                const win = UI.window('Example window', module); // close buttons will only remove the window, not the module if the module param is undefined
                UI.text('It works!', win.main.content);
                const btn = UI.button("Log window to console", win.main.content, 'md-outlined-button');
                btn.addEventListener('click', function () { console.log(win); });
                win.finish();
        */

        const win = this.create('div', document.body, 'window');
        win.style.display = "none";
        const titlebar = this.create('div', win, 'window-titlebar');
        const titleBarLayout = this.create('div', titlebar, 'window-titlebar-layout flexbox');
        const titleBarText = this.create('div', titleBarLayout, 'window-titlebar-layout-text flexbox-left');
        const titleBarButtons = this.create('div', titleBarLayout, 'window-titlebar-layout-buttons flexbox-right');
        var minimized = false;
        var ogPos = "flex";
        var shelfButton;

        function generateShelfButton() {
            const btn = UI.button(title, UI.systemElements.taskbarAppButtonList, 'md-filled-button');
            btn.addEventListener('click', function () {
                if (minimized === true) {
                    restore();
                }
                UI.focusWin(win);
            });
            return btn;
        }

        shelfButton = generateShelfButton();
        shelfButtonRect = shelfButton.getBoundingClientRect();

        function minimize() {
            if (minimized === false) {
                minimized = true;

                const rect = shelfButton.getBoundingClientRect();
                const winRect = win.getBoundingClientRect();

                const dx = rect.x - winRect.x - winRect.width / 2 + 20;
                const dy = rect.y - winRect.y - winRect.height;

                win.style.transformOrigin = 'bottom center';
                Animate(win, {
                    x: [0, dx],
                    y: [0, dy],
                    scale: [1, 0],
                    opacity: [1, 0.5]
                }, { duration: UI.animSpeed.med, ease: "easeInOut" }).then(() => {
                    win.dataset.minimized = 'true';
                });
            }
        }

        function restore() {
            if (minimized === true) {
                minimized = false;
                win.style.transformOrigin = 'bottom center';
                Animate(win, {
                    x: [null, 0],
                    y: [null, 0],
                    scale: [null, 1],
                    opacity: [null, 1]
                }, { duration: UI.animSpeed.med, ease: "easeInOut" }).then(() => {
                    win.dataset.minimized = 'false';
                    win.style.transformOrigin = '';
                });
            }
        }

        function close(removeModule) {
            const calc = win.getBoundingClientRect();
            if (shelfButton) UI.anims.fadeOut(shelfButton).then(() => shelfButton.remove());
            Animate(win, { scale: [1.0, 0.5], opacity: [1, 0] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.remove());
            if (module && ((removeModule === true || closeModuleWithWindow === true) && removeModule !== false)) {
                if (typeof module.close === "function") {
                    module.close();
                }
            }
        }

        const minimizeBtn = UI.dangerousButton(`<md-icon>minimize</md-icon>`, titleBarButtons, 'md-filled-tonal-icon-button', 'window-mgmt-button');
        minimizeBtn.addEventListener('click', function () {
            minimize();
        });

        const closeBtn = UI.dangerousButton(`<md-icon>close</md-icon>`, titleBarButtons, 'md-filled-tonal-icon-button', 'window-mgmt-button');
        closeBtn.addEventListener('click', function () {
            close();
        });

        if (title) titleBarText.innerText = title;

        const content = this.create('div', win, 'window-content');
        if (WD.mobile === true) {
            win.style = `left: 0px !important; top: 0px; !important; right: 0px !important; width: 100% !important; bottom: ${UI.systemElements.rect.shelf.height}px !important; border-radius: 0px !important; box-shadow: none !important;`
        }

        UI.registerDrag(win, titlebar);

        function finish() {
            win.style.display = "flex";
            if (WD.mobile === false) {
                win.style.left = (window.innerWidth - win.getBoundingClientRect().width) / 2 + "px";
                win.style.top = (window.innerHeight - win.getBoundingClientRect().height) / 2 + "px";

                const winRect = win.getBoundingClientRect();
                const originX = ((UI.mousePos.x - winRect.left) / winRect.width) * 100;
                const originY = ((UI.mousePos.y - winRect.top) / winRect.height) * 100;

                win.style.transformOrigin = `${originX}% ${originY}%`;
                Animate(win, { scale: [0.5, 1], opacity: [0, 1] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.style.transformOrigin = "50% 50%");
            } else {
                Animate(win, { scale: [0.3, 1], opacity: [0, 1] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.style.transformOrigin = "50% 50%");
            }
        }

        return { finish, close, minimize, restore, "titlebar": { "main": titlebar, "layout": titleBarLayout, "buttons": titleBarButtons, "text": titleBarText }, "main": { "window": win, "content": content } }
    },
    // focusWin and registerDrag rewritten and decoupled by Claude
    focusWin: function (elmnt) {
        if (windowArray.at(-1) === elmnt) return;
        const BASE_Z = 100;
        const topZ = parseInt(windowArray.at(-1).style.zIndex) || BASE_Z;
        elmnt.style.zIndex = topZ + 1;
        const index = windowArray.indexOf(elmnt);
        if (index > -1) windowArray.splice(index, 1);
        windowArray.push(elmnt);
    },
    registerDrag: function (elmnt, dragHandle) {
        const BASE_Z = 100;
        const lastZ = windowArray.length > 0
            ? (parseInt(windowArray.at(-1).style.zIndex) || BASE_Z)
            : BASE_Z;
        elmnt.style.zIndex = lastZ + 1;
        windowArray.push(elmnt);

        elmnt.addEventListener('mousedown', () => UI.focusWin(elmnt));
        elmnt.addEventListener('touchstart', () => UI.focusWin(elmnt), { passive: true });

        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
        let dragging = false;

        const target = dragHandle || elmnt;

        if (WD.mobile === false) {
            target.addEventListener("mousedown", dragStart);
            target.addEventListener("touchstart", dragStart, { passive: false });
        }

        function getPoint(e) {
            const src = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
            return { x: src.clientX, y: src.clientY };
        }

        function dragStart(e) {
            if (e.target.tagName.toLowerCase().includes('button')) return;
            e.preventDefault();
            const p = getPoint(e);
            startX = p.x - currentX;
            startY = p.y - currentY;
            dragging = true;

            document.addEventListener("mousemove", dragMove);
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("touchmove", dragMove, { passive: false });
            document.addEventListener("touchend", dragEnd);
        }

        function dragMove(e) {
            if (!dragging) return;
            e.preventDefault();
            const p = getPoint(e);
            currentX = p.x - startX;
            currentY = p.y - startY;
            elmnt.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        function dragEnd() {
            if (!dragging) return;
            dragging = false;

            elmnt.style.left = (parseFloat(elmnt.style.left) || 0) + currentX + 'px';
            elmnt.style.top = (parseFloat(elmnt.style.top) || 0) + currentY + 'px';
            elmnt.style.transform = '';
            currentX = 0;
            currentY = 0;

            document.removeEventListener("mousemove", dragMove);
            document.removeEventListener("mouseup", dragEnd);
            document.removeEventListener("touchmove", dragMove);
            document.removeEventListener("touchend", dragEnd);
        }
    },
    contextMenu: function (event, exempt, closeCallback) {
        // Used AI to debug
        /* contextMenu(event, exempt) documentation
            - contextMenu event parameter: Needs to include { event.clientX, event.clientY }
            - contextMenu exempt parameter: Array. If an element in the exempt array is interacted with, the menu won't close.
            - contextMenu closeCallback parameter: A function to run once the menu closes.
            - contextMenu returns { menu, finish(), and closeMenu(event) }
                - menu: The actual context menu element. Append buttons/elements to this
                - finish(): Adds close listeners and positions the menu. Use after adding your elements
                - closeMenu(event): Mostly useless, requires an event
            - To create a menu, for example:
                  const ctx = UI.contextMenu(event); // event needs to include an X and Y
                  const button = UI.button('Menu button', ctx.menu, 'button', 'list-button');
                  button.addEventListener('click', function () { console.log("<i> Menu click"); });
                  ctx.finish() // Finishes menu w/ listeners, REQUIRED
        */
        const x = event.clientX;
        const y = event.clientY;
        const el = UI.create('div', document.body, 'context-menu');
        el.style.left = x + "px";
        el.style.top = y + "px";

        function finish() {
            const rect = el.getBoundingClientRect();
            const margin = 25;

            calcX = x + rect.width + margin;

            if (calcX <= window.innerWidth) {
                console.log('<i> Horizontal space sufficient');
            } else {
                console.log('<!> Horizontal space insufficient');
                el.style.left = x - rect.width + "px";
            }

            const calcY = y + rect.height + margin

            if (calcY <= window.innerHeight) {
                console.log('<i> Vertical space sufficient');
            } else {
                console.log('<!> Vertical space insufficient');
                el.style.top = y - rect.height + "px";
            }
        }

        function closeMenu(e) {
            if (!el.contains(e.target)) {
                if (exempt) {
                    for (let item of exempt) {
                        if (item.contains(e.target)) {
                            console.log(`<i> deflect!`);
                            return;
                        }
                    }
                }
                if (typeof closeCallback === 'function') {
                    closeCallback();
                }
                el.remove();
                document.body.removeEventListener('mousedown', closeMenu);
            }
        }

        document.body.addEventListener('mousedown', closeMenu);

        return { menu: el, finish, closeMenu }
    },
    system: {
        changeCSSVar: function (varname, value) {
            document.documentElement.style.setProperty(`--${varname}`, value);
        },
        applyTheme: function (color1, color2, dark) {
            const theme = MaterialUI.themeFromSourceColor(MaterialUI.argbFromHex(color1), [
                {
                    name: "custom-1",
                    value: MaterialUI.argbFromHex(color2),
                    blend: true,
                    dark
                },
            ]);

            let scheme = theme.schemes.light;
            if (dark === true) {
                scheme = theme.schemes.dark;
                UI.system.changeCSSVar('ui-surface-contents-no-color', `250, 250, 250`);
            } else {
                UI.system.changeCSSVar('ui-surface-contents-no-color', `0, 0, 0`);
            }

            MaterialUI.applyTheme(theme, { target: document.body, dark });
            console.log(theme.schemes);
            for (const key in scheme.props) {
                // fixed by AI
                const value = scheme.props[key];
                const { r, g, b } = tools.argbToRgb(value);
                let font = "#fff";
                if ((r + g + b) / 3 > 180) {
                    font = "#000";
                }
                console.log(`%c${key}: ${value}, RGB: ${r}, ${g}, ${b}`, `background-color: rgba(${r}, ${g}, ${b}); color: ${font}; border-radius: 5px; padding: 3px;`);
            }

            const ui1 = tools.argbToRgb(scheme.props.surface);
            UI.system.changeCSSVar('ui-1', `${ui1.r}, ${ui1.g}, ${ui1.b}`);
            const ui2 = tools.argbToRgb(scheme.props.surfaceVariant);
            UI.system.changeCSSVar('ui-2', `${ui2.r}, ${ui2.g}, ${ui2.b}`);
            const accent = tools.argbToRgb(scheme.props.primary);
            UI.system.changeCSSVar('accent', `${accent.r}, ${accent.g}, ${accent.b}`);
            const txt = tools.argbToRgb(scheme.props.onPrimaryContainer);
            UI.system.changeCSSVar('text', `rgb(${txt.r}, ${txt.g}, ${txt.b})`);
            const txtUI = tools.argbToRgb(scheme.props.onPrimary);
            UI.system.changeCSSVar('ui-text', `rgb(${txtUI.r}, ${txtUI.g}, ${txtUI.b})`);
        }
    },
    divider: function (element) {
        const el = UI.create('div', element, 'divider');
        return el;
    }
}

var tools = {
    argbToRgb: function (argb) {
        // AI made tools.argbToRgb()
        let hex = (argb >>> 0).toString(16).padStart(8, '0');
        const a = parseInt(hex.slice(0, 2), 16);
        const r = parseInt(hex.slice(2, 4), 16);
        const g = parseInt(hex.slice(4, 6), 16);
        const b = parseInt(hex.slice(6, 8), 16);
        return { a, r, g, b };
    }
}

UI.mousePos = { x: 0, y: 0 };
document.addEventListener("mousemove", (e) => {
    UI.mousePos.x = e.clientX;
    UI.mousePos.y = e.clientY;
});