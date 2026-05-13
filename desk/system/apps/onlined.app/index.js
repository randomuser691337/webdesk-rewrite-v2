// onlined.app
// manages user-related socket.io actions

export async function launch(FS, UI, core) {
    var messages = {
        checkIfOpen: function (win) {
            return {existing: false}
        },
        registerNewWin: function (userName, win) {
            
        },
        releaseWin: function (win) {
            
        }
    }

    core.onlined.messages = messages;
}