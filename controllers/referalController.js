require('dotenv').config();
const conn = require('../db').promise();
const { CheckSubscriptions } = require('./checkSubscriptionsController');
const moment = require('moment');


// обновляем счетчик рефералов
async function addReferal(referralUserId) {
    // если число рефералов меньше или равно 5
    
    const [userInfo] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [referralUserId]);

    if (userInfo[0].count_referal < 5) {
        await conn.execute('UPDATE `users` SET `count_referal` = ? WHERE `user_id`= ?', [
            userInfo[0].count_referal + 1,
            referralUserId
        ]);
    }
    if (userInfo[0].count_referal === 4) {
        if (userInfo[0].state_referal) {
            const curretEndDate = moment(userInfo[0].end_data)
            
            // увеличиваем дату окончания подписки на месяц
            await conn.execute('UPDATE `users` SET `end_data` = ? WHERE `user_id`= ?', [
                curretEndDate.clone().add(1, 'months').format('YYYY-MM-DD'),
                referralUserId
            ]);

            // обнуляем состояние подписки
            await conn.execute('UPDATE `users` SET `state_referal` = ? WHERE `user_id`= ?', [
                0,
                referralUserId
            ]);
        }
    }
    
}

/**
 * Функция добавляет реферала
 * @param {object} ctx - Информация о сообщении
 */
async function Referal(ctx) {
    try {
        const referralUserId = parseInt(ctx.message.text.split(' ')[1]); // получаем id пользователя, который отправил ссылку  

        if (referralUserId) {
             // проверяем наличие подписки у пользователя, который отправил ссылку
            const subInfo = await CheckSubscriptions(referralUserId);

            if (subInfo.subscription) {
                // пользователь который перешел, увеличиваем количество попыток 
                const [currentUserInfo] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [ctx.from.id]);
    
                await conn.execute('UPDATE `users` SET `number_attempts` = ? WHERE `user_id`= ?', [
                    currentUserInfo[0].number_attempts + 10,
                    ctx.from.id
                ]);
                
                // пользователь, который пригласил. Увеличиваем count referal
                const [userInfo] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [referralUserId]);
     
                const currentData = moment(moment().format('YYYY-MM-DD')); // текущая дата
                const dateEnd = moment().add(1, 'months').format('YYYY-MM-DD'); // дата через месяц
                
    
                
                // если дата добавлениея реферала пустая
                if (userInfo[0].referal_date == null) {
                    // добавляе дату приведенного реферала
                    await conn.execute('UPDATE `users` SET `referal_date` = ? WHERE `user_id`= ?', [
                        dateEnd,
                        referralUserId
                    ]);
    
                    // обновляем счетчик рефералов
                    await addReferal(referralUserId)
                } else {
                    // если дата через месяц больше даты добавления первого реферала
                    if (currentData.isAfter(moment(userInfo[0].referal_date))) {
                        // обновляем состояние подписки
                        await conn.execute('UPDATE `users` SET `state_referal` = ? WHERE `user_id`= ?', [
                            1,
                            referralUserId
                        ]);
                        // обнуляем количесво рефералов
                        await conn.execute('UPDATE `users` SET `count_referal` = ? WHERE `user_id`= ?', [
                            0,
                            referralUserId
                        ]);
                        // обновялем месяц добовления рефералов
                        await conn.execute('UPDATE `users` SET `referal_date` = ? WHERE `user_id`= ?', [
                            dateEnd,
                            referralUserId
                        ]);
    
                        // обновляем счетчик рефералов
                        await addReferal(referralUserId)

                        
                    } else {
                        // обновляем счетчик рефералов
                        await addReferal(referralUserId)
                    }
                } 
            } 
        }
    }
    catch(err) {
        console.log(err)
    }
}

module.exports = { Referal }