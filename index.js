import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDate = moment().subtract(219, 'd');
const DATE_STRING = targetDate.format();

const data = { date: DATE_STRING };

async function saveAndCommit() {
    try {
        const filePath1 = path.join(__dirname, "data.json");
        await jsonfile.writeFile(filePath1, data);
        console.log('Файл создан:', filePath1);

        const srcDir = path.join(__dirname, "src");
        try {
            await fs.mkdir(srcDir, { recursive: true });
        } catch (e) {
        }

        const filePath2 = path.join(srcDir, "config.json");
        await jsonfile.writeFile(filePath2, {
            updated: DATE_STRING,
            version: "1.0.0"
        });
        console.log('Файл создан:', filePath2);


        // 2. Инициализируем GIT
        const git = simpleGit(__dirname);

        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.log('Инициализация Git репозитория...');
            await git.init();
        }

        // Добавляем изменения
        await git.add('.');
        console.log('Все изменения добавлены в git');

        // 4. Устанавливаем дату коммита
        process.env.GIT_AUTHOR_DATE = targetDate.format('YYYY-MM-DD HH:mm:ss');
        process.env.GIT_COMMITTER_DATE = targetDate.format('YYYY-MM-DD HH:mm:ss');

        // 5. Создаем коммит
        const commitMessage = `Обновление репозитория: ${targetDate.format('YYYY-MM-DD')}\n\nИзменения:\n- Обновлен data.json\n- Обновлен src/config.json`;

        await git.commit(commitMessage);
        console.log('Коммит создан с датой:', targetDate.format('YYYY-MM-DD HH:mm:ss'));

        // 6. Отправляем на GITHUB
        try {
            await git.push('origin', 'main');
            console.log('Изменения отправлены в GitHub');
        } catch (pushError) {
            console.log('Не удалось отправить в GitHub. Возможно, нужно настроить remote:');
            console.log('   git remote add origin https://github.com/username/repo.git');
        }

        // 7. Показываем
        const status = await git.status();
        console.log('\nСтатус репозитория:');
        console.log(`   Ветка: ${status.current}`);
        console.log(`   Коммитов впереди: ${status.ahead}`);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

saveAndCommit();

