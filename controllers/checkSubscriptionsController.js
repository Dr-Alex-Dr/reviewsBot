require('dotenv').config();
const conn = require('../db').promise();
const moment = require('moment');

// функция проверяет наличие подписки и если есть, то выводит информацию о ней
async function CheckSubscriptions(userId) {
    try {
        // данные о подписке пользователя
        const [checkSub] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [userId]);
     
        const currentData = moment(moment().format('YYYY-MM-DD')); // текущая дата
        const endData = moment(checkSub[0].end_data); // дата окончания подписки
       
        // если текущая дата больше даты окончания, то false иначе true
        if(currentData.isBefore(endData)) {
            return {
                subscription: true,
                infoUser: checkSub 
            }
        } else {
            return {
                subscription: false,
                infoUser: checkSub 
            }
        }
    }
    catch(err) {
        console.log(err)
    }
}

module.exports = { CheckSubscriptions }