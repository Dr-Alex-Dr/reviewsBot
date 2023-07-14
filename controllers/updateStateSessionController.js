const conn = require('../db').promise();

/**
 * функция обновляет stateSession 0 - ожидаем описание 1 - ожидаем комментарий
 * @param {number} ctx - Информация о сообщении
 * @param {number} stateSession - Какое сообщение ожидается
 */
async function UpdateStateSession(ctx, stateSession) {
    try {
        await conn.execute('UPDATE `users` SET `stateSession`=? WHERE `user_id`=?',[
            stateSession,
            ctx.from.id
        ]);
    }
    catch(err) {
        console.log(err)
    }
}

module.exports = { UpdateStateSession }