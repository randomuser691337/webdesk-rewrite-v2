export async function launch(FS, UI, WD) {
    // DB written by me, but heavily debugged by AI
    const msgDB = {
        chunkCount: 50,
        queues: {},
        enqueue(username, task) {
            if (!this.queues[username]) {
                this.queues[username] = Promise.resolve();
            }

            this.queues[username] =
                this.queues[username]
                    .catch(err => {
                        console.error(err);
                        throw err;
                    }).then(task);

            return this.queues[username];
        },
        async loadMsgs(username, index) {
            try {
                const raw = await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${index ?? await this.fetchDB(username).indexCount}.json`));
                if (!raw) {
                    return null;
                } else {
                    const parsed = JSON.parse(raw);
                    console.log(parsed);
                    return parsed;
                }
            } catch (error) {
                console.log(error);
                return "recents_corrupt";
            }
        },
        async fetchDB(username) {
            let db = await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/db.json`));
            if (!db) {
                return null;
            } else {
                return JSON.parse(db);
            }
        },
        async createDB(username) {
            try {
                let db = await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/db.json`));
                if (!db) {
                    console.log(`<i> DB for user ${username} doesn't exist, creating now`);
                    const newDB = { indexCount: 0, messagesUntilNewChunk: this.chunkCount, dbCreationDate: Date.now() }
                    const parse = JSON.stringify(newDB);
                    await FS.write(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/db.json`), parse);
                    return newDB;
                } else {
                    return JSON.parse(db);
                }
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        async updateDBCount(username, indexCount, messagesUntilNewChunk) {
            try {
                let db = JSON.parse(await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/db.json`)));
                if (!db) {
                    console.log(`<i> DB for user ${username} doesn't exist`);
                    return null;
                } else {
                    let newDB = { indexCount: indexCount, messagesUntilNewChunk: messagesUntilNewChunk, dbCreationDate: db.dbCreationDate }
                    const parse = JSON.stringify(newDB);
                    await FS.write(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/db.json`), parse);
                    return "success";
                }
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        async addMsg(username, content, timestamp, sender) {
            return await this.enqueue(username, async () => {
                try {
                    let db = await this.fetchDB(username);
                    if (!db) {
                        console.log(`<i> Creating DB because of new message for ` + username);
                        db = await this.createDB(username);
                    }

                    if (db.messagesUntilNewChunk <= 0) {
                        const freshChunk = []
                        freshChunk.push({ "username": username, "content": content, "timestamp": timestamp ?? Date.now(), "sender": sender });
                        const newChunk = JSON.stringify(freshChunk);
                        await FS.write(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${db.indexCount + 1}.json`), newChunk, 'text');
                        await this.updateDBCount(username, db.indexCount + 1, this.chunkCount - 1);
                    } else {
                        const recentIndex = await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${db.indexCount}.json`));
                        let msgs = [];
                        if (recentIndex) {
                            try {
                                msgs = JSON.parse(recentIndex);
                            } catch {
                                msgs = [];
                            }
                        }
                        msgs.push({ "username": username, "content": content, "timestamp": timestamp ?? Date.now(), "sender": sender });
                        const str = JSON.stringify(msgs);
                        await FS.write(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${db.indexCount}.json`), str, 'text');
                        await this.updateDBCount(username, db.indexCount, db.messagesUntilNewChunk - 1);
                    }
                    return true;
                } catch (error) {
                    console.log(error);
                    return "index_corrupt";
                }
            });
        },
        async delMsg(username, timestamp) {
            try {
                const userDB = await this.fetchDB(username);
                if (userDB) {
                    let index = userDB.indexCount;

                    async function scan(username, index) {
                        if (index <= -1) {
                            return false;
                        } else {
                            const recentIndex = await FS.read(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${index}.json`));
                            if (recentIndex) {
                                const msgs = JSON.parse(recentIndex);
                                const msg = msgs.filter(m => m.timestamp === timestamp);
                                if (msg) {
                                    await FS.write(FS.normalizeUserPath(`appdata/Messages-1779048184267.app/messages/${username}/${index}.json`), JSON.stringify(msg), 'text');
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                            index--;
                            await scan(username, index);
                        }
                    }

                    await scan(username, index);
                }
                return true;
            } catch (error) {
                console.log(error);
                return false;
            }
        },
    }

    const win = UI.window('Messages');
    if (WD.mobile === false) {
        win.main.window.style.width = "380px";
    }
    const tempStyle = UI.create('style', win.main.window, 'hide');
    tempStyle.textContent = await FS.read('/apps/Messages-1779048184267.app/style.css');
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

    const killdb = UI.button('Delete DB', win.titlebar.text, 'button', 'small-button');
    killdb.addEventListener('click', async function () {
        await FS.rm(FS.normalizeUserPath('/appdata/Messages-1779048184267.app'));
        window.location.reload();
    });


    var currentPane = UI.create('div', win.main.content);
    UI.text('Messages', currentPane, 'bold');
    const contactList = UI.create('div', currentPane, 'button-list-normal');

    async function openContact(contact, pastMessages) {
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

                async function setupRightClick(newMsg, msg) {
                    newMsg.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                        const menu = UI.contextMenu(e);

                        const delBtn = UI.button('Delete message', menu.menu, 'button', 'small-button wide');
                        delBtn.addEventListener('click', async function (event) {
                            menu.closeMenu(document.body);
                            const check = await msgDB.delMsg(contact.username, msg.timestamp);
                            if (check === true) {
                                newMsg.remove();
                            } else {
                                UI.snack(`Couldn't delete message`, 2500);
                            }
                        });

                        menu.finish();
                    });
                }

                function scrollToTop() {
                    messageView.scrollTo({
                        top: messageView.scrollHeight,
                        behavior: 'smooth'
                    });
                }

                send.addEventListener('click', async function () {
                    if (input.value) {
                        const message = UI.create('div', messageView, 'msg mesent');
                        message.innerText = input.value;
                        // const sending = UI.create('span', message);
                        // sending.innerText = "Sending...";
                        const t = Date.now();
                        WD.onlined.messages.sendMessage({ username: contact.username, content: input.value, timestamp: t });
                        msgDB.addMsg(contact.username, input.value, t, true);
                        input.value = "";
                        scrollToTop();
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
                    newMessage: async function (message, writeToDB, sender) {
                        const newMsg = UI.create('div', messageView, `msg ${sender ? "mesent" : "othersent"}`);
                        newMsg.innerText = message.content;
                        scrollToTop();
                        if (writeToDB === true) {
                            await msgDB.addMsg(contact.username, message.content, message.timestamp, sender);
                        }

                        setupRightClick(newMsg, message);
                    }
                }

                if (pastMessages) {
                    pastMessages.forEach(async function (pastMsg) {
                        console.log(pastMsg);
                        controller.newMessage(pastMsg, true, false);
                    });
                }

                let fetchedDB = await msgDB.fetchDB(contact.username);
                if (fetchedDB !== null) {
                    console.log(fetchedDB);
                    let pastIndex = fetchedDB.indexCount;
                    console.log(pastIndex);

                    const recents = await msgDB.loadMsgs(contact.username, pastIndex);
                    console.log(recents);
                    if (recents) {
                        recents.forEach(function (msg) {
                            controller.newMessage(msg, false, msg.sender);
                        });
                    }

                    const loadMore = UI.button('Load more', undefined, 'button', 'small-button');
                    messageView.prepend(loadMore);
                    loadMore.addEventListener('click', async function () {
                        const oldHeight = messageView.scrollHeight;
                        const older = await msgDB.loadMsgs(contact.username, pastIndex - 1);

                        if (!older || older.length === 0) {
                            loadMore.innerText = "No more messages";
                            loadMore.disabled = true;
                            return;
                        }

                        older.reverse().forEach(function (msg) {
                            const newMsg = UI.create('div', undefined, 'msg');
                            if (msg.sender === false) {
                                newMsg.classList.add('othersent');
                            } else {
                                newMsg.classList.add('mesent');
                            }

                            setupRightClick(newMsg, msg);

                            newMsg.innerText = msg.content;
                            messageView.insertBefore(newMsg, loadMore.nextSibling);
                        });

                        const newHeight = messageView.scrollHeight;
                        messageView.scrollTop += (newHeight - oldHeight);
                        pastIndex--;
                    });

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