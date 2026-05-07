var windowArray = []

var UI = {
    animSpeed: {
        slow: 0.3,
        med: 0.2,
        fast: 0.13,
    },
    systemElements: {
        taskbarAppButtonList: undefined,
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
    uploadFileFromBrowser: async function () {
        return new Promise((resolve, reject) => {
            const input = UI.create('input', document.body, 'hide');
            input.type = "file";
            input.addEventListener("change", async function () {
                const isImage = this.files[0].type.startsWith("image");
                const content = isImage ? this.files[0] : await this.files[0].text();
                resolve({ isImage: isImage, file: this.files[0], content: content });
            });
            input.click();
        })
    },
    reorg: function (element) {
        const buttons = Array.from(element.querySelectorAll('button'));
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
        return { left, right };
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
            if (core.debug === true) console.log(editorApp);
            const TextEditor = await core.loadModule(`${editorApp}`, true);
            if (core.debug === true) console.log(TextEditor);
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
    input: function (parent, placeholder, type, classList) {
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

        function generateShelfButton() {
            const btn = UI.button(title, UI.systemElements.taskbarAppButtonList, 'md-filled-button');
            btn.addEventListener('click', function () {
                if (minimized === false) {
                    
                }
            });
            return btn;
        }

        function minimize(removeModule) {
            const calc = win.getBoundingClientRect();
            Animate(win, { scale: [1.0, 0.7], opacity: [1, 0] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.remove());
            if (module && ((removeModule === true || closeModuleWithWindow === true) && removeModule !== false)) {
                if (typeof module.close === "function") {
                    module.close();
                }
            }
        }

        function close(removeModule) {
            const calc = win.getBoundingClientRect();
            Animate(win, { scale: [1.0, 0.7], opacity: [1, 0] }, { ease: "easeInOut", duration: UI.animSpeed.fast }).then(() => win.remove());
            if (module && ((removeModule === true || closeModuleWithWindow === true) && removeModule !== false)) {
                if (typeof module.close === "function") {
                    module.close();
                }
            }
        }

        const closeBtn = UI.dangerousButton(`<md-icon>close</md-icon>`, titleBarButtons, 'md-filled-tonal-icon-button', 'window-mgmt-button');
        closeBtn.addEventListener('click', function () {
            close();
        });

        if (title) titleBarText.innerText = title;

        const content = this.create('div', win, 'window-content');
        UI.registerDrag(win, titlebar);

        function finish() {
            win.style.display = "flex";
            win.style.left = (window.innerWidth - win.getBoundingClientRect().width) / 2 + "px";
            win.style.top = (window.innerHeight - win.getBoundingClientRect().height) / 2 + "px";
            Animate(win, { scale: [0.7, 1], opacity: [0, 1] }, { ease: "easeInOut", duration: UI.animSpeed.fast });
        }

        return { finish, close, "titlebar": { "main": titlebar, "layout": titleBarLayout, "buttons": titleBarButtons, "text": titleBarText }, "main": { "window": win, "content": content } }
    },
    registerDrag: function (elmnt, dragHandle) {
        console.log(windowArray);
        if (windowArray.at(-1)) {
            const lastWin = Number(window.getComputedStyle(windowArray.at(-1)).zIndex) + 1;
            if (core.debug === true) console.log(`<i> register drag current win zIndex: ` + lastWin)
            elmnt.style.zIndex = lastWin;
        }
        windowArray.push(elmnt);

        // focusWin written by me, debugged by AI
        function focusWin() {
            if (windowArray.at(-1) === elmnt) {
                if (core.debug === true) console.log(`<!> Skipping ` + elmnt + `, it's already the highest`);
                return;
            }
            const newZIndex = Number(window.getComputedStyle(windowArray.at(-1)).zIndex) + 1;
            if (core.debug === true) {
                console.log(windowArray.at(-2));
                console.log(windowArray.at(-1));
                console.log(newZIndex);
            }
            elmnt.style.zIndex = newZIndex;
            const index = windowArray.indexOf(elmnt);
            if (index > -1) {
                if (core.debug === true) console.log(`<i> found ` + elmnt + `, removing...`);
                windowArray.splice(index, 1);
            }
            windowArray.push(elmnt);
        }

        focusWin();

        elmnt.addEventListener('mousedown', function () {
            focusWin();
        });

        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
        let dragging = false;

        const target = dragHandle || elmnt;

        target.addEventListener("mousedown", dragStart);
        target.addEventListener("touchstart", dragStart, { passive: false });

        function getPoint(e) {
            if (e.touches) {
                return {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
            return { x: e.clientX, y: e.clientY };
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

        function dragEnd(e) {
            if (!dragging) return;
            dragging = false;

            const p = getPoint(e);
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