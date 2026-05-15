// onlined.app
// manages user-related socket.io actions

export async function launch(FS, UI, WD, webid) {
    const messages = {
        openConversations: {

        },
        checkIfOpen: function (username) {
            if (messages.openConversations[username]) {
                return { existing: true, username, window: messages.openConversations[username].window }
            } else {
                return { existing: false }
            }
        },
        registerNewWin: function (username, win, messageController) {
            messages.openConversations[username] = { username: username, window: win, messageController }
        },
        releaseWin: function (username) {
            delete messages.openConversations[username];
        },
        sendMessage: function (message) {
            WD.socket.emit('sendmsg', webid.token, message);
        },
        // queueController debugged by AI
        queueController: {
            messages: {},

            addMessage: function (message) {
                if (!this.messages[message.username]) {
                    this.messages[message.username] = [];
                }

                this.messages[message.username].push({
                    username: message.username,
                    content: message.content
                });
            },

            getAll: function (username) {
                return this.messages[username] || [];
            }
        }
    }

    const handler = {
        newMessage: async function (message) {
            if (messages.openConversations[message.username]) {
                messages.openConversations[message.username].messageController.newMessage(message);
            } else {
                if (document.getElementById(message.username + "-onlined-notif")) {
                    document.getElementById(message.username + "-onlined-notif").remove();
                }

                const notif = await UI.notif(message.username, message.content);
                notif.id = message.username + "-onlined-notif";
                messages.queueController.addMessage(message);
                const reply = UI.button('Reply', notif.contents, 'button', 'small-button');
                reply.addEventListener('click', async function () {
                    const newInstance = await WD.loadApp('/apps/Messages.app/index.js');
                    const app = await newInstance.launch(FS, UI, WD);
                    console.log(messages.queueController.getAll(message.username));
                    const jsonFriendly = message.username;
                    await app.openContact(await set.contacts.read(message.username) || { jsonFriendly: { "username": jsonFriendly, "details": "" }}, messages.queueController.getAll(message.username));
                });
            }
        }
    }

    WD.socket.on('umsg', function (msg) {
        handler.newMessage(msg);
    })

    WD.onlined = { messages, handler, active: true }
}