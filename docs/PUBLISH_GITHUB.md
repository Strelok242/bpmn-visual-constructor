# Публикация локального проекта в GitHub

**Перед началом:** требуется Git для Windows, доступ в собственный GitHub и распакованный архив с каталогом `.git`. В этом проекте локальная история коммитов и учебные ветки уже созданы; повторять `git init` НЕ нужно.

1. Откройте https://github.com/new в своём аккаунте.
2. Название: `bpmn-visual-constructor`.
3. Выберите **Public**. Не создавайте автоматически README, `.gitignore` или лицензию, поскольку они уже включены в локальный проект.
4. Нажмите **Create repository**. Только после создания появится реальная публичная ссылка.
5. В Windows откройте терминал в распакованном каталоге `BPMN_Constructor_Project` (с папкой `.git`).
6. Установите имя и рабочий e-mail Git для **будущих коммитов** (свои, не учебные подставные значения):

```powershell
git config user.name "Ваши имя и фамилия"
git config user.email "ваш-email@пример.рф"
```

7. Выполните команды, заменив адрес на тот, который показал GitHub:

```powershell
git remote add origin https://github.com/ВАШ_ЛОГИН/bpmn-visual-constructor.git
git remote -v
git push -u origin main
git push origin feature/requirements feature/model feature/ui feature/xml-export docs/verification
git branch -a
git log --oneline --graph --all --decorate
```

8. Проверьте публичную страницу (в режиме инкогнито): README, исходный код, ветки и историю коммитов.
9. В документе рейтинговой работы замените маркер `[ВСТАВИТЬ РЕАЛЬНУЮ ССЫЛКУ GITHUB]` фактическим URL.
10. Для скриншотов по методичке сделайте Windows-скриншоты `git --version`, `git config --list --local`, `git status`, `git branch -a`, `git log --oneline --graph --all`, `git remote -v`, `git push`, страницы GitHub. Не подменяйте ими скриншоты Linux-демонстрации из архива.

## Как проверить удалённые операции

```powershell
git fetch origin
git pull --ff-only origin main
git clone https://github.com/ВАШ_ЛОГИН/bpmn-visual-constructor.git ../bpmn-clone-check
```

Если `git remote add origin` сообщает, что origin уже существует, сначала выполните `git remote -v` и проверьте URL. Не перезаписывайте незнакомый remote без проверки. GitHub при HTTPS может потребовать вход через окно авторизации Git Credential Manager: ввод обычного пароля GitHub в качестве пароля для `git push` не поддерживается.

Справка: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository ; https://docs.github.com/en/get-started/git-basics/set-up-git
