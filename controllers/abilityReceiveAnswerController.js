const { CheckSubscriptions } = require('./checkSubscriptionsController');
const { CheckNumberAttempts } = require('./checkNumberAttemptsController');
const conn = require('../db').promise();

/**
 * Функция проверяет наличие подписки или наличие бесплатных попыток
 * @param {object} ctx - Информация о сообщении
 * @returns {boolean} True если есть подписка или наличие бесплатных попыток иначе False
 */
async function AbilityReceiveAnswer(ctx) {
    const attempts = await CheckNumberAttempts(ctx);
    const subscriptions = await CheckSubscriptions(ctx.from.id);

    // если подписка есть выполняем действия
    if (subscriptions.subscription) {
        try {
            return true;
        }
        catch(err) {
            console.log(err)
        } 
    } 
    // если нет подписки, но есть попытки выполняем действие 
    if (attempts.attempt) {
        try {
            // обновляем количесво попыток 
            await conn.execute('UPDATE `users` SET `number_attempts` = ? WHERE `user_id`=?', [
                attempts.infoUser[0].number_attempts - 1,
                ctx.from.id
            ]);
            return true
        }
        catch(err) {
            console.log(err)
        }       
    } 
    // если нет подписки и закончились попытки выводим информацию
    return false;
}

module.exports = { AbilityReceiveAnswer }