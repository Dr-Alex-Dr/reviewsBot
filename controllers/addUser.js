require('dotenv').config();
const conn = require('../db').promise();
const { Referal } = require('./referalController');

/**
 * функция регестрирует нового пользователя
 * @param {number} ctx - Информация о сообщении
 * @description Проверяем существует ли пользователь, если нет, то регестрируем
 */
async function AddUser(ctx) {
    try {
        // существует ли пользователь
        const [isUser] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?',[ctx.from.id]);
        // если нет, то регестрируем
        if (isUser.length === 0) {
            await conn.execute('INSERT INTO `users`(`user_id`,`nickname`,`stateSession`,`number_attempts`) VALUES(?,?,?,?)',[
                ctx.from.id || null,
                ctx.from.username || null,
                0,
                process.env.NUMBER_ATTEMPTS
            ]);

            await Referal(ctx)
        }
    }
    catch(err) {
        console.log(err)
    }
}

module.exports = { AddUser }