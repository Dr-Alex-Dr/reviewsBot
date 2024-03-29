require('dotenv').config();
const conn = require('../db').promise();

/**
 * функция проверяет наличие бесплатных попыток
 * @param {number} ctx - Информация о сообщении
 * @returns {object} Если есть бесплатные попытки, то выводит информацию о пользователе и true, иначе false
 */
async function CheckNumberAttempts(ctx) {
    try {
        // данные пользователя 
        const [checkSub] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [ctx.from.id]);

        if (checkSub[0].number_attempts != 0) {
            return {
                attempt: true,
                infoUser: checkSub 
            }
        } else {
            return {
                attempt: false,
                infoUser: checkSub 
            }
        }       
    }
    catch(err) {
        console.log(err)
    }
}

module.exports = { CheckNumberAttempts }