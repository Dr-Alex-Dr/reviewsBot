require('dotenv').config();

// кнопки с информацией о подписке (цена завист от количества рефералов)
async function SubInlineBtn(userInfo) {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `на один месяц ${Number(process.env.SUB_ON_MONTH) - userInfo[0].count_referal * 0.1 * Number(process.env.SUB_ON_MONTH)} Руб`, callback_data: "one_month" }, 
                    { text: `на три месяца ${Number(process.env.SUB_ON_THREE_MONTH) - userInfo[0].count_referal * 0.1 * Number(process.env.SUB_ON_THREE_MONTH)} Руб`, callback_data: "three_month" },
                ],
                [ 
                    { text: `на пол года ${Number(process.env.SUB_ON_HALF_YEAR) - userInfo[0].count_referal * 0.1 * Number(process.env.SUB_ON_HALF_YEAR)} Руб`, callback_data: "half_year" },
                    { text: `на один год ${Number(process.env.SUB_ON_YEAR) - userInfo[0].count_referal * 0.1 * Number(process.env.SUB_ON_YEAR)} Руб`, callback_data: "one_yaer" }
                ],
            ]
        }
    }
}

module.exports = { SubInlineBtn }