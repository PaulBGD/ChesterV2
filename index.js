import sentiment from 'sentiment';
import { Brain, FileSystemProvider } from 'node-brain';
import keyword from 'keyword-extractor';
import Discord from 'discord.js';
import { join } from 'path';
import * as fs from 'fs';

const ID = process.env.CHESTER_ID;
const TOKEN = process.env.CHESTER_TOKEN;

const provider = new FileSystemProvider(join(__dirname, 'CHESTERS_BRAIN'));
const brain = new Brain({
    provider
});

let bot;

function start() {
    if (fs.existsSync('chester.brain')) {
        let toAdd = 0;
        let promise = Promise.resolve();
        const lines = fs.readFileSync('chester.brain', 'utf8').replace(/\r/g, '').split('\n');
        console.log('Potential lines:', lines.length);
        lines.forEach(line => {
            if (isGoodSentence(line)) {
                promise = promise.then(() => {
                    return brain.addSentence(line).catch(err => {
                        console.error('Error adding line', line);
                        throw err;
                    });
                });
                toAdd++;
            }
        });
        promise.catch(error);
        console.log('Adding', toAdd, 'lines!');
    }

    bot = new Discord.Client();

    bot.on('ready', () => console.log(`Logged in as ${bot.user.username} ${bot.user.id}`));
    bot.on('message', handleMessage);

    bot.login(TOKEN).catch(error);
}

const tag = `<@${ID}>`;

function handleMessage(message) {
    const { content } = message;

    const trimmed = content.replace(new RegExp(tag, 'g'), '').trim();

    if (isGoodSentence(trimmed)) {
        brain.addSentence(trimmed).catch(error);
    }

    if ((content.indexOf(tag) > -1 || message.channel.type === 'dm') && message.author.id !== ID) {
        const keywords = keyword.extract(trimmed, {
            language: 'english',
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: false
        });

        const array = keywords.length > 0 ? keywords : trimmed.split(/[ .!?]/g);

        brain.getSentence(array[Math.floor(array.length * Math.random())])
            .then(sentence => {
                return message.channel.send(sentence, {
                    reply: message.author
                });
            })
            .catch(error);
    }
}

function isGoodSentence(sentence) {
    return sentence.toLowerCase().indexOf('chester') === -1 &&
        !/[^a-zA-Z0-9,.\- !?_+%$#@=]/.test(sentence)
        && sentiment(sentence).score >= 0;
}

function error(err) {
    if (err) {
        console.error(err);
    }
}

provider.initialize()
    .then(start)
    .catch(error);
