export async function launch(FS, UI, core) {
    const win = UI.window('Messages');
    if (core.mobile === false) {
        win.main.window.style.width = "380px";
        win.main.window.style.maxHeight = "540px";
    }
    const tempStyle = UI.create('style', win.main.window, 'hide');
    tempStyle.textContent = await FS.read('/apps/Messages.app/style.css');

    const addContact = UI.button('Add contact', win.titlebar.text, 'small-button');
    addContact.addEventListener('click', function () {
        const dialog = UI.create('div', document.body, 'dialog-box');
        UI.text('Add contact', dialog, 'bold');
        const username = UI.input('Username', dialog, 'text');
        const info = UI.input('Info', dialog, 'text');

        const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

        const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');
        cancel.addEventListener('click', function () {
            dialog.remove();
        });

        const select = UI.button('Add', buttonCont, 'md-filled-button', 'flex-grow-1');
        select.addEventListener('click', async function () {
            dialog.remove();
            await set.contacts.add(username.value, info.value);
            UI.snack('Added contact', 3000);
            await refreshContacts();
        });
    });

    var currentPane = UI.create('div', win.main.content);
    UI.text('Messages', currentPane, 'bold');
    const contactList = UI.create('div', currentPane);

    async function openContact(contact) {
        const check = core.onlined.messages.checkIfOpen(contact.userName);
        if (check.existing !== true) {
            core.onlined.messages.registerNewWin(contact.userName, win);
            const pane = UI.create('div');
            const messageView = UI.create('div', pane, 'message-container');
            messageView.style.height = "320px";
            const messagesUI = UI.create('div', pane, 'dialog-box-two-buttons');

            const input = UI.input('WebDesk Messages - ' + contact.userName, messagesUI, 'flex-grow-1 msg-ui');
            const send = UI.button('Send', messagesUI, 'md-filled-button');

            send.addEventListener('click', function () {
                if (input.value) {
                    const message = UI.create('div', messageView, 'msg mesent');
                    message.innerText = input.value;
                }
            });

            win.main.content.appendChild(pane);
            UI.anims.crossFade(currentPane, pane).then(function () {
                currentPane.remove();
                currentPane = pane;
            });

            UI.events.onRemove(pane).then(() => {
                core.onlined.messages.releaseWin(contact.userName, win);
            });

            UI.events.onRemove(win.main.window).then(() => {
                core.onlined.messages.releaseWin(contact.userName, win);
            });
        } else {
            UI.focusWin(check.window);
        }
    }

    async function refreshContacts() {
        const tacts = await set.contacts.getAll();
        console.log(tacts);
        if (Object.keys(tacts).length !== 0) {
            Object.keys(tacts).forEach(function (contact) {
                const btn = UI.button(contact.userName, contactList, 'md-outlined-button');
                btn.addEventListener('click', async function () {
                    const NP = await openContact(contact);
                });
            });
        } else {
            UI.text('No contacts yet... change that?', contactList);
        }
    }

    await refreshContacts();
    win.finish();
}