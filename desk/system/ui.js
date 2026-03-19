var windowArray = []

var UI = {
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
    openFile: function (path, type) {
        if (type === "text") {
            
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
        const el = document.createElement(elType);
        el.classList = classList;
        parent.appendChild(el);
        return el;
    },
    container: function (options, parent, classList) {
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
    text: function (text, parent, classList) {
        const txt = this.create('div', parent, classList + " text");
        txt.innerText = text;
        return txt;
    },
    window: function (title, module) {
        const win = this.create('div', document.body, 'window');
        const titlebar = this.create('div', win, 'window-titlebar');
        const titleBarLayout = this.create('div', titlebar, 'window-titlebar-layout flexbox');
        const titleBarText = this.create('div', titleBarLayout, 'window-titlebar-layout-text flexbox-left');
        const titleBarButtons = this.create('div', titleBarLayout, 'window-titlebar-layout-buttons flexbox-right');

        if (title) titleBarText.innerText = title;

        const content = this.create('div', win, 'window-content');
        UI.registerDrag(win, titlebar);
        return { "titlebar": { "main": titlebar, "layout": titleBarLayout, "buttons": titleBarButtons, "text": titleBarText }, "main": { "window": win, "content": content } }
    },
    registerDrag: function (elmnt, dragHandle) {
        console.log(windowArray);
        if (windowArray.at(-1)) {
            const lastWin = Number(window.getComputedStyle(windowArray.at(-1)).zIndex) + 1;
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
            dragging = false;

            document.removeEventListener("mousemove", dragMove);
            document.removeEventListener("mouseup", dragEnd);

            document.removeEventListener("touchmove", dragMove);
            document.removeEventListener("touchend", dragEnd);
        }
    },
    contextMenu: function (event) {
        // Used AI to debug
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
            if (dark === true) scheme = theme.schemes.dark;

            MaterialUI.applyTheme(theme, { target: document.body, dark });
            console.log(theme.schemes)
            for (const key in scheme.props) {
                // fixed by AI
                const value = scheme[key];
                console.log(key, value, tools.argbToRgb(value));
            }

            const ui1 = tools.argbToRgb(scheme.props.surface);
            UI.system.changeCSSVar('ui-1', `${ui1.r}, ${ui1.g}, ${ui1.b}`);
            const ui2 = tools.argbToRgb(scheme.props.surfaceVariant);
            UI.system.changeCSSVar('ui-2', `${ui2.r}, ${ui2.g}, ${ui2.b}`);
            const accent = tools.argbToRgb(scheme.props.primary);
            UI.system.changeCSSVar('accent', `${accent.r}, ${accent.g}, ${accent.b}`);
            const txt = tools.argbToRgb(scheme.props.onSurface);
            UI.system.changeCSSVar('text', `rgb(${txt.r}, ${txt.g}, ${txt.b})`);
        }
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