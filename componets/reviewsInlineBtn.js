const { ReadCellValue } = require('../controllers/ReadCellValue')
/**
 * @returns {object} Кнопки "Добавить новый отзыв" "Добавить новый товар"
 */
const reviewsInlineBtn = {
    reply_markup: {
        inline_keyboard: [
            [ 
                { text: ReadCellValue('A5'), callback_data: "add_comment" }, 
                { text: ReadCellValue('A7'), callback_data: "add_description" } 
            ],
        ]
    }
}

module.exports = reviewsInlineBtn;