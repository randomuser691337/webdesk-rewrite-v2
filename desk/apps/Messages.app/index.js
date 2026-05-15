export async function launch(FS, UI, WD) {
    const win = UI.window('Messages');
    if (WD.mobile === false) {
        win.main.window.style.width = "380px";
    }
    const tempStyle = UI.create('style', win.main.window, 'hide');
    tempStyle.textContent = await FS.read('/apps/Messages.app/style.css');
    win.titlebar.text.innerHTML = "";
    const addContact = UI.button('Add contact', win.titlebar.text, 'button', 'small-button');
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
    const contactList = UI.create('div', currentPane, 'button-list-normal');

    async function openContact(contact) {
        if (WD.onlined.active === true) {
            const check = WD.onlined.messages.checkIfOpen(contact.username);
            if (check.existing !== true) {
                if (WD.mobile === false) {
                    win.main.window.style.height = "540px";
                }
                win.main.content.style.paddingTop = "0px";
                const pane = UI.create('div', undefined, 'messages-container');
                const messageView = UI.create('div', pane, 'message-container');
                const messagesUI = UI.create('div', pane, 'dialog-box-two-buttons msg-ui');

                const input = UI.input('WebDesk Messages - ' + contact.username, messagesUI, 'flex-grow-1 msg-ui');
                const send = UI.button('Send', messagesUI, 'md-filled-button');

                send.addEventListener('click', function () {
                    if (input.value) {
                        const message = UI.create('div', messageView, 'msg mesent');
                        message.innerText = input.value;
                        // const sending = UI.create('span', message);
                        // sending.innerText = "Sending...";
                        WD.onlined.messages.sendMessage({ username: contact.username, content: input.value });
                    }
                });

                win.main.content.appendChild(pane);
                UI.anims.crossFade(currentPane, pane, 'flex').then(function () {
                    currentPane.remove();
                    currentPane = pane;
                });

                UI.events.onRemove(pane).then(() => {
                    WD.onlined.messages.releaseWin(contact.username, win);
                });

                UI.events.onRemove(win.main.window).then(() => {
                    WD.onlined.messages.releaseWin(contact.username, win);
                });

                const controller = {
                    newMessage: function (message) {
                        const newMsg = UI.create('div', messageView, 'msg othersent');
                        newMsg.innerText = message.content;
                    }
                }

                WD.onlined.messages.registerNewWin(contact.username, win, controller);
            } else {
                UI.focusWin(check.window.main.window);
            }
        } else {
            UI.snack(`The onlined service isn't active. Cannot open conversation.`);
        }
    }

    async function refreshContacts() {
        contactList.innerHTML = "";

        const tacts = await set.contacts.getAll();

        console.log(tacts);

        if (Object.keys(tacts).length !== 0) {
            Object.keys(tacts).forEach(function (userName) {
                const contact = tacts[userName];
                console.log(contact);
                const btn = UI.button(userName, contactList, 'md-filled-button', 'wide');
                btn.addEventListener('click', async function () {
                    console.log(contact);
                    await openContact(contact);
                });

                btn.addEventListener('contextmenu', function (event) {
                    event.preventDefault();
                    const menu = UI.contextMenu(event);
                    const delBtn = UI.button('Delete', menu.menu, 'button', 'list-button');

                    delBtn.addEventListener('click', function () {

                        const dialog = UI.create('div', document.body, 'dialog-box');

                        UI.text('Delete ' + userName, dialog, 'bold');
                        UI.text('This cannot be undone!', dialog).style.textDecoration = "underline";

                        const buttonCont = UI.create('div', dialog, 'dialog-box-two-buttons');

                        const cancel = UI.button('Cancel', buttonCont, 'md-outlined-button');

                        cancel.addEventListener('click', function () {
                            dialog.remove();
                        });

                        const select = UI.button('Delete', buttonCont, 'md-filled-button', 'flex-grow-1');

                        select.addEventListener('click', async function () {
                            dialog.innerHTML = "Removing...";
                            await set.contacts.remove(userName);
                            dialog.remove();
                            await refreshContacts();
                        });
                    });
                    menu.finish();
                });
            });
        } else {
            UI.text('No contacts yet... change that?', contactList);
        }
    }
    await refreshContacts();
    win.finish();
    return { openContact }
}