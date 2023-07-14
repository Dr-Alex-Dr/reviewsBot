require('dotenv').config();
const { ReadCellValue } = require('../controllers/ReadCellValue')

/**
 * Функция создает кнопки с ценами о подписке (цена завист от количества рефералов)
 * @param {object} userInfo - Информация о подписке
 * @returns {object} Кнопки с ценами
 */
async function SubInlineBtn(userInfo) {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `${ReadCellValue('E3')} ${Number(ReadCellValue('E4')) - userInfo[0].count_referal * 0.1 * Number(ReadCellValue('E4'))} Руб`, callback_data: "one_month" }, 
                    { text: `${ReadCellValue('E6')} ${Number(ReadCellValue('E7')) - userInfo[0].count_referal * 0.1 * Number(ReadCellValue('E7'))} Руб`, callback_data: "three_month" },
                ],
                [ 
                    { text: `${ReadCellValue('E9')} ${Number(ReadCellValue('E10')) - userInfo[0].count_referal * 0.1 * Number(ReadCellValue('E10'))} Руб`, callback_data: "half_year" },
                    { text: `${ReadCellValue('E12')} ${Number(ReadCellValue('E13')) - userInfo[0].count_referal * 0.1 * Number(ReadCellValue('E13'))} Руб`, callback_data: "one_yaer" }
                ],
            ]
        }
    }
}

module.exports = { SubInlineBtn }