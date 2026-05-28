/* FOR MORE DETAILS ON HOW TO DEVELOP:
   - Visit /system/ui.js and read the comments under each UI element
   - Paste /system/ui.js into an AI and ask it questions about how the UI works
   - Use code from other WebDesk applications
   - Or ask me for help on Discord: @dbh_ra9
*/

export var name = "Example App";

export async function launch(FS, UI, WD, webid) {
    async function chat(prompt, imageDataUrl = null) {
        const message = {
            role: 'user',
            content: prompt
        };

        // Accepts canvas.toDataURL(...)
        if (imageDataUrl) {
            // Strip: data:image/jpeg;base64,
            const base64 = imageDataUrl.split(',')[1];

            message.images = [base64];
        }

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen3.5:4b',
                messages: [message],
                stream: false
            })
        });

        const data = await response.json();

        return data.message.content;
    }

    // Creates a window
    const window = UI.window('Example App', WD.tasks[id].task);
    // If mobile mode is off, resize window to 260px
    if (WD.mobile === false) {
        window.main.window.style.width = "240px";
    }
    // Creates a div under the window's contents to contain the UI
    const mainView = UI.create('div', window.main.content);
    // Creates text
    UI.text("Example Application", mainView);
    // Creates container for list of files
    const fileListContainer = UI.create('div', mainView, 'general-container');
    // Lists files in the filesystem root
    window.finish();

    WD.socket.on('ai_umsg', async function (msg) {
        UI.button(`Request: ${UI.getDate()}`, fileListContainer, 'button', 'list-button');
        const data = await chat(msg.content.text, msg.content.data);
        console.log(data);
        WD.socket.emit("ai_sendmsg", sys.webid.token, { username: msg.username, content: data, timestamp: Date.now() });
    });
}