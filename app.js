require('dotenv').config();
const { Telegraf } = require('telegraf');
const { AddUser } = require('./controllers/addUser');
const { GPTController } = require('./controllers/gptController');
const { UpdateStateSession } = require('./controllers/updateStateSessionController');
const { GetInvoice } = require('./controllers/getInvoiceController');
const { CheckSubscriptions } = require('./controllers/checkSubscriptionsController');
const { AbilityReceiveAnswer } = require('./controllers/abilityReceiveAnswerController')
const { SubInlineBtn } = require('./componets/subInlineBtn');
const moment = require('moment');
const conn = require('./db').promise();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.BOT_TOKEN);

// inline кнопки 
const inlineBtn = {
    reply_markup: {
        inline_keyboard: [
            [ 
                { text: "Добавить новый отзыв", callback_data: "add_comment" }, 
                { text: "Добавить новый товар", callback_data: "add_description" } 
            ],
        ]
    }
}

async function addDescription(ctx) {
    // обновляем состояние для последующего комментария
    await UpdateStateSession(ctx, 1);
    await ctx.reply('Добавьте отзыв')
}
async function addComment(ctx) {
    // сбрасываем состояние
    await UpdateStateSession(ctx, 2);
    await ctx.reply('Идет генерация ответа');
    await GPTAnswer(ctx)
}
async function GPTAnswer(ctx) {
    // ищем последние комментарии и описание, котрые оставил пользователь 
    const [comment] = await conn.execute('SELECT `body` FROM `messages` WHERE user_id = ? AND type = 1 ORDER BY id DESC LIMIT 1', [ctx.from.id]);
    const [description] = await conn.execute('SELECT `body` FROM `messages` WHERE user_id = ? AND type = 0 ORDER BY id DESC LIMIT 1', [ctx.from.id]);
    // выводим ответ gpt

    // console.log(`${description[0].body}
    // \n${process.env.DESCRIPTION_REQUEST_GPT}
    // \n${comment[0].body}`)


    const [userInfo] = await conn.execute('SELECT * FROM `users` WHERE `user_id`=?', [ctx.from.id]);
    const subInlineBtn = await SubInlineBtn(userInfo);
    const abilityReceive = await AbilityReceiveAnswer(ctx);

    // проверяем наличие подписки или количесво попыток
    if (abilityReceive) {
        const GPTtext = await GPTController(`${description[0].body} ${comment[0].body} ${process.env.DESCRIPTION_REQUEST_GPT} `)

        // добавялем ответ gpt в базу данных 
        await conn.execute('INSERT INTO `messages`(`user_id`, `type`, `body`) VALUES(?, ?, ?)', [
            ctx.from.id,
            2,
            GPTtext
        ]);
        
        ctx.reply(GPTtext, inlineBtn);
    } else {
        ctx.replyWithHTML('<b>Подписка RatingRanger</b>\n\n<b>•</b> Неограниченное количевто запрсов\n<b>•</b> Прямое общение с техподержкой\n\n<b>Тарифный план</b>', subInlineBtn); 
    }   
}

// функция добавляет сообщения пользователя
async function addUserMessage(ctx) {    
    // находим текущее состояние пользователя
    const [currentSession] = await conn.execute('SELECT `stateSession` FROM `users` WHERE user_id=?', [ctx.from.id])
    // добавляем сообщение с этим состоянием
    await conn.execute('INSERT INTO `messages`(`user_id`, `type`, `body`) VALUES(?, ?, ?)', [
        ctx.from.id,
        currentSession[0].stateSession,
        ctx.message.text
    ]);

    if (currentSession[0].stateSession == 0) {
        await addDescription(ctx);
    } else if (currentSession[0].stateSession == 1) {
        await addComment(ctx);
    }
}

bot.command('start', async (ctx) => {
    // регестрируем нового пользователя
    await AddUser(ctx); 
    // обнуляем состояние сообщения
    await UpdateStateSession(ctx, 0)
    await ctx.reply('Добавьте описание товара/услуги');
});

// выводим информацию о подписке если она есть, если нет, то выводи варианты оформления подписки
bot.command('subscription', async (ctx) => {
    const userSubIfo = await CheckSubscriptions(ctx.from.id);
    const subInlineBtn = await SubInlineBtn(userSubIfo.infoUser)
    
    if (userSubIfo.subscription) {
        ctx.replyWithHTML(`<b>Информация о подписке</b>\n\nДата окончания: ${ moment(userSubIfo.infoUser[0].end_data).format('DD.MM.YYYY')}`)
    } else {
        ctx.replyWithHTML('<b>Подписка RatingRanger</b>\n\n<b>•</b> Неограниченное количевто запрсов\n<b>•</b> Прямое общение с техподержкой\n\n<b>Тарифный план</b>', subInlineBtn); 
    }
});

// выводим реферальную ссылку
bot.command('referral', async (ctx) => {
    const refelarLink = `https://t.me/${bot.options.username}?start=${ctx.from.id}`
    ctx.reply(`Реферальная ссылка\n\n${refelarLink}`)
});
// выводим данные для свизи
bot.command('support', async (ctx) => {
    ctx.reply(`
🚀Служба поддержки

telegram: ${process.env.TELEGRAM}
`)
});

bot.command('instruction', async (ctx) => {
    ctx.replyWithHTML(`
⚡️<b>Инструкция по работе с боте</b>, которая поможет вам получить максимум пользы от его использования. 

1. <b>Скопируйте и отправте описание товара/услуги из карточки.</b> Чем точнее будет описание, тем более развернутый ответ на отзыв о данном товаре вы получите. 
2. <b>Добавьте текст отзыва</b>, на который необходимо получить ответ. 

Получите развернутый ответ от нашего бота 
`)
});

// проверяем пользователя на парва админа
async function checkAdmin(user_id) {
    const [adminInDb] = await conn.execute('SELECT `nickname` FROM `users` WHERE `user_id` = ?', [user_id]);
    console.log(adminInDb[0].nickname, process.env.ADMIN_USERS)
    if (adminInDb[0].nickname == process.env.ADMIN_USERS) {
        return true;
    } else {
        return false;
    }
}
bot.command('getusers', async (ctx) => {
    if (await checkAdmin(ctx.from.id)) {
        const [users] = await conn.execute('SELECT * FROM `users`');
        const userList = users.map(item => `<b>user_id:</b> ${item.user_id}  <b>nickname:</b> ${item.nickname}`).join('\n');
        ctx.replyWithHTML(userList);
    }
});

bot.command('countusers', async (ctx) => {
    if (await checkAdmin(ctx.from.id)) {
        const [users] = await conn.execute('SELECT * FROM `users`');
        ctx.replyWithHTML(users.length);
    }
})

bot.command('getmessages', async (ctx) => {
    if (await checkAdmin(ctx.from.id)) {
        const userId = Number(ctx.message.text.split(' ')[1]);
        if (userId) {
            const [messages] = await conn.execute('SELECT * FROM `messages` WHERE `user_id` = ?', [userId]);
            const userList = messages.map(item => `${item.type === 0 ? '<b>комментарий: </b>' : item.type === 1 ? '<b>описание: </b>' : '<b>ответ gpt: </b>'} ${item.body}`).join('\n\n');
            ctx.replyWithHTML(userList);
        }
    }
})

// оформление подписки
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true)) // ответ на предварительный запрос по оплате
bot.on('successful_payment', async (ctx, next) => { // ответ в случае положительной оплаты 
    // добавляем флаг, что подписка оформлена  
    try {
        // дата начала
        const startDate = await moment().format('YYYY-MM-DD');
        // дата окончания
        const [endDate] = await conn.execute('SELECT `selected_date` FROM `users` WHERE `user_id`=?' ,[ctx.from.id])
        // обновляем дату начала и конца подписки
        await conn.execute('UPDATE `users` SET `start_data` = ?, `end_data` = ? WHERE `user_id`= ?', [
            startDate,
            endDate[0].selected_date,
            ctx.from.id
        ]);

        // обнуляем количесво рефералов

        await ctx.reply('Подписка оформлена')
    }
    catch(err) {
        await ctx.reply('Ошибка оформления')
        console.log(err)
    }
})

bot.on('text', async (ctx) => {
    await addUserMessage(ctx); 
});

// inline кнопка Добавить новый отзыв
bot.action('add_comment', async (ctx) => {
    await UpdateStateSession(ctx, 1);
    await ctx.reply('Добавьте отзыв о товаре');
});
// inline кнопка Добавить новый товар
bot.action('add_description', async (ctx) => {
    await UpdateStateSession(ctx, 0);
    await ctx.reply('Добавьте описание товара/услуги');
});

// функия проверяте наличие подписки, если есть выводит информацию о ней, если нет запускает функцию оформления
async function subscribe(ctx, currentCost) {
    // проверяем наличие подписки
    const subInfo = await CheckSubscriptions(ctx.from.id);
    
    // если подписка есть, то выводим информацию о подписке
    if (subInfo.subscription) {
        await ctx.replyWithHTML(`<b>Информация о подписке</b>\n\nДата окончания: ${ moment(subInfo.infoUser[0].end_data).format('DD.MM.YYYY')}`);
    } else {
        // запускаем функцию оплаты
        return ctx.replyWithInvoice(GetInvoice(ctx, Number(currentCost) - subInfo.infoUser[0].count_referal * 0.1 * Number(currentCost)));
    }   
}


// сохраняем примерную дату подписки
async function saveSelectedDate(ctx, selectedDate) {
    await conn.execute('UPDATE `users` SET `selected_date` = ? WHERE `user_id`= ?', [
        selectedDate,
        ctx.from.id
    ]);
}

// обработка вариатов подписок
bot.action('one_month', async (ctx) => { 
    const selectedDate = moment().add(1, 'months').format('YYYY-MM-DD'); // дата окончания подписки
    saveSelectedDate(ctx, selectedDate) // запонимаем параметры подписки
    subscribe(ctx, process.env.SUB_ON_MONTH) // оформляем подписку
});
bot.action('three_month', async (ctx) => { 
    const selectedDate = moment().add(3, 'months').format('YYYY-MM-DD'); // дата окончания подписки
    saveSelectedDate(ctx, selectedDate) // запонимаем параметры подписки
    subscribe(ctx, process.env.SUB_ON_THREE_MONTH) // оформляем подписку
});
bot.action('half_year', async (ctx) => { 
    const selectedDate = moment().add(6, 'months').format('YYYY-MM-DD'); // дата окончания подписки
    saveSelectedDate(ctx, selectedDate) // запонимаем параметры подписки
    subscribe(ctx, process.env.SUB_ON_HALF_YEAR) // оформляем подписку 
});
bot.action('one_yaer', async (ctx) => {
    const selectedDate = moment().add(12, 'months').format('YYYY-MM-DD'); // дата окончания подписки
    saveSelectedDate(ctx, selectedDate) // запонимаем параметры подписки
    subscribe(ctx, process.env.SUB_ON_YEAR) // оформляем подписку
});

bot.launch();


// Set up webhook
bot.telegram.setWebhook('https://60b9-94-140-138-143.eu.ngrok.io');

// Bind to Express app
app.use(bot.webhookCallback('/'));

// Start server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

